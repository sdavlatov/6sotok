# 6sotok.kz — Claude Instructions

Apply changes without confirmation. Modify files directly. Always.
NEVER ask yes/no questions. Always proceed immediately.
Always respond in Russian unless explicitly requested otherwise.
Responses must be short and concise. No summaries at end of response.
В конце каждой сессии обновлять раздел "Последние изменения" ниже.

---

## Последние изменения (2026-04-23)

- **Vercel деплой**: https://6sotok.vercel.app — работает. Neon PostgreSQL (unpooled URL — pooler ломает search_path). Vercel Blob для медиафайлов.
- **payload.config.ts**: `vercelBlobStorage` плагин (`enabled: !!process.env.BLOB_READ_WRITE_TOKEN`). `push: true` в postgres адаптере.
- **importMap.ts**: Добавлен `VercelBlobClientUploadHandler` вручную (generate:importmap не работает локально).
- **instrumentation.ts**: Инициализирует Payload при старте сервера.
- **Инфраструктура**: Frontend перенесён из Docker в WSL2 systemd service (`6sotok-dev.service`). Docker используется только для Postgres.
- **api.ts**: Payload JS API напрямую (`getPayload({config})`), не HTTP — устраняет Turbopack panic.

---

## Инфраструктура (Dev)

**Next.js** работает НЕ в Docker — через systemd user service в WSL2:
```bash
systemctl --user status 6sotok-dev.service   # статус
systemctl --user restart 6sotok-dev.service  # перезапуск
journalctl --user -u 6sotok-dev.service -f   # логи
```
Сервис автостартует вместе с WSL2. Файл: `~/.config/systemd/user/6sotok-dev.service`

**PostgreSQL** — Docker контейнер `postgres`, доступен на `localhost:5432` из WSL2.

**DATABASE_URI** в `.env.local` = `postgresql://postgres:postgres@localhost:5432/sixsotok` (localhost, не postgres!)

**Admin**: http://localhost:3000/admin

**Важно**: после изменения файлов через Windows (Claude Code IDE) Turbopack может не подхватить изменения автоматически — нужен `systemctl --user restart 6sotok-dev.service`.

**api.ts** вызывает Payload JS API напрямую (`getPayload({ config })`), НЕ через HTTP-запросы к себе. Это важно — самореферентный fetch вызывал Turbopack panic.

---

## Stack

- Next.js 16, App Router, Turbopack
- Tailwind v4, TypeScript
- Payload CMS 3.x (admin `/admin`, JS API через `getPayload`)
- PostgreSQL via Docker (`localhost:5432` из WSL2)
- Leaflet via CDN (no npm install) — types in `map-view.tsx` declare global `window.L`

---

## Ключевые файлы — читать ТОЛЬКО если меняешь

| Файл | Назначение |
|------|-----------|
| `src/collections/Listings.ts` | Payload коллекция. Slug генерируется как `listing-{timestamp}`, после create заменяется на `String(doc.id)` через afterChange hook |
| `src/collections/Media.ts` | `create: () => true` — публичная загрузка |
| `src/types/listing.ts` | TypeScript тип Listing. Источник истины для полей |
| `src/lib/api.ts` | `getListings()`, `getListingBySlug()`. PayloadListing → Listing маппинг |
| `src/lib/listing-constants.ts` | `LAND_CATEGORIES`, `UTILITIES`, `LEGAL_FILTERS` — используются в форме и фильтрах каталога |
| `payload.config.ts` | i18n ru, postgresAdapter, upload limit 200MB |

## Компоненты

| Файл | Назначение |
|------|-----------|
| `src/app/(site)/page.tsx` | Главная. Fetches 500 listings → вычисляет `countByType`, `locations`, `totalCount` → передаёт в SearchBar (не весь массив!) |
| `src/app/(site)/add-listing/page.tsx` | Форма подачи. Одно поле `location` (KZ datalist). Карта ограничена Казахстаном. Reverse geocode через Nominatim. Видео 9:16 |
| `src/app/(site)/catalog/` | Каталог с фильтрами. `catalog-client.tsx` — клиентская часть |
| `src/app/(site)/listing/[slug]/page.tsx` | Страница объявления. Показывает "Торг" бейдж, locationType теги |
| `src/components/home/search-bar.tsx` | Принимает `countByType`, `locations`, `totalCount` (не Listing[]). Табы показывают реальные счётчики |
| `src/components/home/hero-section.tsx` | Принимает `count: number` — реальное кол-во объявлений |
| `src/components/listings/listing-card.tsx` | Карточка `rounded-3xl`. Видео: blur backdrop + object-contain (сохраняет 9:16 в сетке 4:3). Чипы коммуникаций, бейджи "Торг" и тип |
| `src/components/listings/listing-gallery.tsx` | Галерея с `mounted` state (hydration fix). Видео → `aspect-[9/16] max-w-sm`, фото → `aspect-[16/9]` |
| `src/components/listings/contact-card.tsx` | Контакты продавца. WhatsApp кнопка если `seller.hasWhatsApp`. Пропс `isNegotiable` показывает бейдж "Торг" |
| `src/components/catalog/map-view.tsx` | Leaflet карта. Здесь объявлены глобальные типы Leaflet (`LMap`, `LMarker`, `LeafletStatic`, `declare global Window.L`) — не дублировать в других файлах |

## Типы Listing (ключевые поля)

```ts
// Обязательные
id, slug, title, price, area, landType, location, image, images[], communications[]

// Коммуникации (boolean флаги)
hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess

// Юридика
cadastralNumber, ownershipType, hasStateAct, isPledged, hasEncumbrances, isDivisible, isOnRedLine

// Геометрия
reliefType, plotShape, frontWidth, depth

// Маркетплейс
isNegotiable, locationType: string[], lat, lng

// Продавец
seller: { name, phone, isAgency, hasWhatsApp }
```

## Паттерны

**Slug**: автогенерация temp → afterChange заменяет на `String(doc.id)` → URL `/listing/42`

**Форма**: `fd` state, `set(key, value)`, `toggle(key)`. Цена форматируется пробелами (`fmtPrice`/`rawPrice`). Медиа загружается в `/api/media` → IDs → POST `/api/listings`

**Видео**: определяется по расширению URL `/\.(mp4|mov|webm|ogv|m4v)$/i`. В карточках: два слоя — blur backdrop fill + centered contain, контейнер всегда `aspect-[4/3]`.

**Hydration fix**: компоненты с условным рендером зависящим от client-only данных (видео, размеры) — добавлять `mounted` state + `useEffect(() => setMounted(true), [])`, server рендерит дефолт.

**SearchBar props**: передавать только `countByType: Record<string,number>`, `locations: string[]`, `totalCount: number` — НЕ весь массив Listing[].

**WhatsApp**: `https://wa.me/{cleanPhone}?text={encoded}` — только если `seller.hasWhatsApp`

**DataLayer**: `pushDataLayer(event, params?)` из `src/lib/analytics.ts`

**Цвет primary**: `#16a34a` (green-600). Tailwind классы: `bg-primary`, `text-primary`, `border-primary`, `primary-soft`, `primary-hover`

## Что НЕ делать

- Не переписывать файлы целиком без необходимости
- Не добавлять `locale: 'ru'` в payload admin config (нет в типах этой версии)
- Не объявлять `interface Window { L? }` нигде кроме `map-view.tsx`
- Не импортировать `from 'leaflet'` — пакет не установлен, типы локальные
- Не читать файл если не меняешь его
- Не передавать `Listing[]` как пропс в клиентские компоненты — только скалярные данные
- Не перезапускать сервер через `kill $(lsof -t -i:3000)` — использовать `systemctl --user restart 6sotok-dev.service`
- Не писать `DATABASE_URI` с hostname `postgres` — только `localhost` (Next.js вне Docker)
- Не делать fetch к `http://localhost:3000/api/*` из серверных компонентов — использовать `getPayload({ config })` напрямую

---

# ДИЗАЙН-СИСТЕМА 6sotok

> Эталон визуального стиля: **Linear**, **Vercel**, **Luma.events**, **Airbnb**
> Принцип: каждый экран должен выглядеть как продукт уровня Series B стартапа.

---

## Цвета — Design Tokens (`globals.css`)

```
--color-primary:       #066F36   ← основной зелёный (бренд)
--color-primary-light: #2CA64E   ← светлее для hover-акцентов
--color-primary-hover: #055a2b   ← hover на кнопках
--color-primary-soft:  #f0fdf4   ← фоновый тинт (bg карточек, секций)
--color-primary-dark:  #022c15   ← тёмный вариант

--color-accent:        #A3D2F0   ← небесно-голубой акцент (теги, бейджи)
--color-accent-purple: #7e22ce
--color-accent-soft:   #faf5ff

--color-muted:         #a1a1aa   ← zinc-400 (плейсхолдеры, второстепенный текст)
--color-border:        #e4e4e7   ← zinc-200 (разделители, рамки)
--color-card:          #ffffff
--color-background:    #fafafa
```

**Правила использования цвета:**
- `bg-primary` / `text-primary` — ТОЛЬКО для главных CTA, активных состояний, ключевых цифр
- Большие области — никогда `bg-primary`, используй `bg-primary-soft`
- Нейтралы — всегда `zinc-*`, никогда `gray-*` (несовместимы с токенами)
- Текст на белом фоне: заголовки `text-zinc-900`, тело `text-zinc-700`, второстепенное `text-zinc-500`, плейсхолдеры `text-zinc-400`
- Никогда `text-black` или `color: #000` — только через zinc шкалу

---

## Типографика

**Шрифт:** `Inter` (подключён через `next/font/google`, переменная `--font-inter`)

### Шкала размеров
```
Микро-лейбл:  10px  font-bold   uppercase  tracking-widest   text-zinc-400
Caption:      11px  font-medium                               text-zinc-500
Small:        12px  font-medium                               text-zinc-600
Body sm:      13px  font-normal  leading-relaxed
Body:         15px  font-normal  leading-relaxed              text-zinc-700
Body md:      16px  font-medium
Subheading:   18px  font-semibold tracking-tight
H4:           20px  font-bold    tracking-tight
H3:           24px  font-bold    tracking-tight               text-zinc-900
H2:           30px  font-bold    tracking-tight  (md:36px)
H1:           36px  font-black   tracking-tight  (md:48px)
Hero:         48px  font-black   tracking-tighter (md:64px)
```

**Правила:**
- Заголовки всегда `tracking-tight` или `tracking-tighter` — никогда дефолтный letter-spacing
- Цены и числа — `font-black tabular-nums`
- Не более 3 разных размеров шрифта в одной секции
- Длинные параграфы: `leading-relaxed` (1.625), короткие UI-лейблы: `leading-none`
- Никакого `text-black` — минимум `text-zinc-800`

---

## Отступы и сетка

**Базовая единица: 4px.** Все отступы кратны ей.

```
gap-1   = 4px    gap-2   = 8px    gap-3   = 12px
gap-4   = 16px   gap-6   = 24px   gap-8   = 32px
gap-10  = 40px   gap-12  = 48px   gap-16  = 64px
```

**Стандартные паттерны:**
```
Паддинг карточки:        px-4 pt-4 pb-4  (или p-5)
Паддинг секции:          py-12 md:py-16 lg:py-20
Паддинг страницы:        px-4 sm:px-6 lg:px-8
Максимальная ширина:     max-w-7xl mx-auto
Gap в сетке карточек:    gap-2 sm:gap-3
Gap между секциями:      space-y-12 md:space-y-16
```

**Сетки карточек:**
```tsx
// 2 колонки
'grid-cols-2'
// 3 колонки (дефолт каталога)
'grid-cols-2 sm:grid-cols-3'
// 4 колонки
'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
```

---

## Border Radius

```
rounded-lg   = 8px   ← только для мелких UI элементов (dropdown items)
rounded-xl   = 12px  ← кнопки, инпуты, теги, иконки-контейнеры
rounded-2xl  = 16px  ← карточки, модальные, панели (ОСНОВНОЙ для карточек)
rounded-3xl  = 24px  ← hero-блоки, большие секции
rounded-full        ← пилюли (бейджи, теги, аватары, кнопки-иконки)
```

**Запрещено:**
- `rounded` (4px) — слишком острый для контента
- `rounded-md` (6px) — устаревший корпоративный стиль
- `rounded-sm` — только для мелких внутренних элементов

---

## Тени

```
shadow-sm    ← дефолт карточки в покое (едва заметная)
shadow-md    ← hover карточки
shadow-lg    ← активная/выбранная карточка, dropdown
shadow-xl    ← модальные, поповеры
```

**Паттерн карточки:**
```tsx
className="shadow-sm hover:shadow-lg transition-shadow duration-200"
```

**Кастомная тень (для особых случаев):**
```tsx
shadow-[0_8px_32px_rgba(0,0,0,0.08)]    // мягкая рассеянная
shadow-[0_20px_56px_rgba(0,0,0,0.12)]   // эффект "парения"
```

---

## Анимации и переходы

**Базовые классы:**
```tsx
transition-all duration-200        // универсальный
transition-colors duration-150     // только цвет (hover кнопок)
transition-shadow duration-200     // тень карточек
transition-transform duration-300  // движение/масштаб
```

**Hover-эффекты карточек:**
```tsx
hover:-translate-y-1 transition-all duration-300   // лёгкий подъём
hover:scale-[1.03]                                  // для медиа внутри карточки (через group)
```

**Pulse-анимация (коммуникации):**
```tsx
<span className="relative flex size-2">
  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
  <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
</span>
```

**Цвета pulse-точек по типу коммуникации:**
```
Свет    → bg-yellow-400   (жёлтый — лампочка/солнце)
Газ     → bg-orange-400   (оранжевый — пламя горелки)
Вода    → bg-cyan-400     (голубой/аква — вода)
Дорога  → bg-stone-400    (серый — асфальт)
Госакт  → bg-emerald-500  (зелёный — одобрено/официально)
Делимый → bg-violet-400   (фиолетовый — абстрактное)
```

**Skeleton / загрузка:**
```tsx
<div className="bg-zinc-100 animate-pulse rounded-2xl" />
```

**Запрещено:**
- `transition` без `duration` — браузеры дают 150ms, но явно лучше
- Анимации длиннее `duration-500` в UI (кроме page transitions)
- `animate-bounce` — дешёвый эффект, не использовать

---

## Кнопки

```tsx
// Primary CTA
"bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150"

// Secondary
"bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium px-5 py-2.5 rounded-xl transition-colors duration-150"

// Ghost / outline
"border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium px-5 py-2.5 rounded-xl transition-all duration-150"

// Destructive
"bg-red-50 hover:bg-red-100 text-red-700 font-medium px-5 py-2.5 rounded-xl transition-colors duration-150"

// Icon-only
"size-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors duration-150"
```

**Правила кнопок:**
- Минимальный padding по вертикали: `py-2.5`
- Минимальный padding по горизонтали: `px-4`
- Иконка внутри кнопки с текстом: `size-4 gap-2`
- Не более 1 Primary CTA в видимой области экрана
- Disabled state: `opacity-50 cursor-not-allowed pointer-events-none`

---

## Инпуты и формы

```tsx
// Текстовый инпут
"w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"

// Select
"w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] text-zinc-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"

// Label
"block text-sm font-medium text-zinc-700 mb-1.5"

// Error state (добавить к инпуту)
"border-red-300 focus:border-red-400 focus:ring-red-100"

// Error message
"text-xs text-red-600 mt-1"
```

---

## Карточки и поверхности

```tsx
// Стандартная карточка
"bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"

// Карточка без hover (статичная)
"bg-white rounded-2xl border border-zinc-100 shadow-sm"

// Карточка с акцентом (featured)
"bg-white rounded-2xl border border-primary/20 shadow-sm ring-1 ring-primary/10"

// Фоновая секция
"bg-primary-soft rounded-3xl p-6 md:p-8"

// Внутренний блок (nested)
"bg-zinc-50 rounded-xl p-4"

// Glass (для оверлеев на фото)
"bg-white/80 backdrop-blur-md rounded-2xl border border-white/50"
```

---

## Бейджи и теги

```tsx
// Категория (primary)
"bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full"

// Нейтральный тег
"bg-zinc-100 text-zinc-600 text-xs font-medium px-2.5 py-1 rounded-full"

// Тёмный (тип участка)
"bg-zinc-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full"

// Успех
"bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full"

// Предупреждение (Торг)
"bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full"

// Акцент (синий)
"bg-sky-50 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full"
```

---

## Иконки

- **Библиотека:** только `lucide-react` — никаких других
- Размеры:
  ```
  size-3.5  (14px) — внутри текстовых строк (адрес, мета)
  size-4    (16px) — стандарт в кнопках и списках
  size-5    (20px) — feature-секции, заголовки
  size-6    (24px) — hero иконки, пустые состояния
  size-8+         — декоративные иконки в карточках
  ```
- Иконка-контейнер для feature-секций:
  ```tsx
  "bg-primary-soft p-3 rounded-2xl text-primary"
  ```
- Цвет иконок в тексте: всегда совпадает с цветом текста или `text-zinc-400`

---

## Изображения и медиа

```tsx
// Карточка листинга (фото)
<div className="relative overflow-hidden rounded-t-2xl bg-zinc-100" style={{ aspectRatio: '4/3' }}>
  <img className="w-full h-full object-contain" />  // contain — для видео совместимости
</div>

// Полноэкранная галерея
aspect-[16/9]  // фото
aspect-[9/16] max-w-sm  // вертикальное видео

// Avatar
"size-10 rounded-full object-cover"

// Placeholder (нет фото)
"bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center"
```

**Правила:**
- LCP-изображения (hero, первая карточка): `loading="eager"`, остальные `loading="lazy"`
- Всегда указывать `alt` (для SEO и a11y)
- Контейнер всегда с фиксированным `aspect-ratio` — никогда не полагаться на высоту изображения

---

## Заголовки секций

```tsx
// С подзаголовком и ссылкой
<div className="flex items-end justify-between mb-6">
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
      Категория
    </p>
    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
      Заголовок секции
    </h2>
  </div>
  <a className="text-sm font-medium text-primary hover:underline shrink-0">
    Смотреть все →
  </a>
</div>

// Центрированный hero-заголовок
<div className="text-center max-w-2xl mx-auto mb-10">
  <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Надзаголовок</p>
  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4">
    Главный заголовок
  </h1>
  <p className="text-lg text-zinc-500 leading-relaxed">Описание</p>
</div>
```

---

## Пустые состояния

```tsx
<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 px-4 text-center">
  <div className="bg-zinc-100 p-4 rounded-2xl mb-4">
    <SearchX className="size-8 text-zinc-400" />
  </div>
  <p className="text-base font-semibold text-zinc-700 mb-1">Ничего не найдено</p>
  <p className="text-sm text-zinc-400">Попробуйте изменить фильтры</p>
</div>
```

---

## Адаптивность (mobile-first)

```
Точки останова Tailwind:
sm:  640px   — планшет вертикально
md:  768px   — планшет горизонтально
lg:  1024px  — десктоп
xl:  1280px  — широкий десктоп
2xl: 1536px  — 4K / ультраширокий
```

**Правила:**
- Писать base (мобильный) стиль первым, потом `md:` / `lg:`
- Типографика: `text-2xl md:text-3xl lg:text-4xl`
- Паддинги страницы: `px-4 sm:px-6 lg:px-8`
- Колонки карточек: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Скрывать декоративные элементы на мобиле: `hidden md:block`
- Минимальная область касания: `min-h-[44px] min-w-[44px]`

---

## Sticky header

```tsx
"sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-zinc-100 transition-shadow"
```

---

## Современные паттерны (2025–2026)

1. **Bento grid** — асимметричные сетки `grid-cols-3` с `col-span-2` / `row-span-2`
2. **Subtle gradients** — `bg-gradient-to-br from-zinc-50 via-white to-primary-soft/20`
3. **Glassmorphism** — `bg-white/80 backdrop-blur-md border border-white/50` (только для оверлеев)
4. **Большая типографика** — не бояться `text-5xl` / `text-6xl` в hero
5. **Цветные pulse-точки** — для статусных индикаторов (коммуникации участка)
6. **Hover border-color** — `hover:border-primary/30` вместо только shadow
7. **Micro-copy** — `text-xs text-zinc-400` под ценой, датой, площадью

---

## ЗАПРЕЩЕНО — никогда не делать

| Что | Почему |
|-----|--------|
| `rounded-md` на карточках/кнопках | Устаревший корпоративный стиль |
| `text-black` / `color: #000` | Слишком резко, используй zinc-900 |
| `border-2` на карточках | `border` (1px) + shadow достаточно |
| `text-green-*` классы Tailwind | Конфликт с кастомным `--color-primary` |
| `gray-*` нейтралы | Используй `zinc-*` — они нейтральнее |
| Более 1 Primary CTA на экране | Размывает фокус пользователя |
| Центрирование длинного текста | Читабельно только для 1–2 строк |
| `p-2` и меньше внутри карточек | Минимум `p-4` |
| Иконки из других библиотек | Только `lucide-react` |
| `animate-bounce` | Дешёво выглядит |
| Хардкод цветов (#hex) в компонентах | Всегда через CSS переменные или zinc шкалу |

---

# ПОЧЕМУ ДИЗАЙН ВЫГЛЯДИТ ДЁШЕВО — диагностика и лечение

> Это самый важный раздел. Технические правила выше — КАК делать. Этот раздел — ПОЧЕМУ результат выглядит плохо.

---

## Проблема 1: Все слова одинаково жирные

**Симптом:** `font-bold` или `font-semibold` везде — у лейблов, значений, заголовков, подписей. Глаз не знает на что смотреть.

**Правило весов для этого проекта:**
```
font-normal (400)   → body text, описания, вторичный контент
font-medium (500)   → навигация, мета-информация, подписи
font-semibold (600) → названия в карточках, лейблы форм
font-bold (700)     → заголовки секций H2/H3, цены
font-extrabold (800)→ только H1 страницы
font-black (900)    → ЗАПРЕЩЕНО кроме hero-цифр на главной
```

**Никогда:** `font-black` для цен в карточках и контакт-карточке → используй `font-bold`

---

## Проблема 2: Слишком много uppercase лейблов

**Симптом:** "СТОИМОСТЬ УЧАСТКА", "ПРОДАВЕЦ", "КОММУНИКАЦИИ", "ЮРИДИКА" — все секции начинаются с кричащего uppercase. Выглядит как шаблон, не как продукт.

**Правило:** максимум 1-2 uppercase лейбла на экран. Остальные секции разделяй пробелом или тонкой линией — не лейблом.

**Плохо:**
```tsx
<p className="text-[10px] font-bold uppercase tracking-widest">ПРОДАВЕЦ</p>
```
**Хорошо:** просто разделитель `border-t border-zinc-100` без лейбла, или очень тихий:
```tsx
<p className="text-[11px] font-medium text-zinc-400 mb-2">Продавец</p>  // не uppercase, не bold
```

---

## Проблема 3: Цвет размазан по всему интерфейсу

**Правило 10%:** primary green (#066F36) должен занимать не более 10% визуального пространства экрана.

**Используй зелёный ТОЛЬКО для:**
- Одна главная CTA-кнопка ("Показать телефон")
- WhatsApp кнопка (у неё свой зелёный #25D366)
- Активные состояния фильтров
- Галочки в "Безопасная сделка"

**НЕ используй зелёный для:**
- Цены (→ zinc-900)
- Иконки рядом с текстом (→ zinc-500)
- Фоны секций (→ zinc-50 или white)
- Лейблы и бейджи без явного смысла

---

## Проблема 4: Карточки выглядят плоско

**Плохо:** только `border border-zinc-200` без глубины.

**Хорошо — рецепт карточки с глубиной:**
```tsx
className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200"
```

Разница: `border-zinc-100` (светлее чем zinc-200) + кастомная мягкая тень вместо `shadow-sm`.

---

## Проблема 5: Нет воздуха — всё слиплось

**Симптом:** секции идут одна за другой без отдышки. Элементы внутри карточки слишком близко.

**Минимальные отступы:**
```
Между секциями внутри карточки:  border-t + py-5 (не py-3)
Между иконкой и текстом:          gap-3 (не gap-1.5)
Между лейблом и значением:        mb-1.5 (не mb-0.5)
Паддинг карточки:                 p-6 (не p-4 для десктопа)
```

---

## Проблема 6: Типографическая иерархия сломана

Хорошая иерархия — это когда размер текста уменьшается в 1.25–1.5x на каждом уровне:

```
Цена:        48px  font-bold      ← якорный элемент
За сотку:    13px  font-medium    ← вспомогательный (разница большая!)
Лейбл:       11px  font-medium uppercase  ← минимальный
Значение:    15px  font-semibold  ← средний
Мета:        13px  font-normal    ← тихий
```

**Запрещено:** разница в 2px между уровнями (`14px` и `16px` — выглядит как ошибка, не иерархия).

---

## Проблема 7: Границы и разделители слишком заметны

**Плохо:** `border-zinc-200` (#e4e4e7) — слишком тёмная для разделителей внутри карточки.
**Хорошо:** `border-zinc-100` (#f4f4f5) — едва видна, даёт структуру без шума.

Внешняя граница карточки может быть `zinc-200`, внутренние разделители — только `zinc-100`.

---

## Чек-лист перед тем как писать компонент

1. **Иерархия:** назови 3 уровня важности → убедись что они визуально различимы
2. **Вес:** используй `font-bold` максимум для 1-2 элементов в компоненте
3. **Цвет:** зелёный присутствует? → убедись что только в 1 месте
4. **Воздух:** есть ли отступ `py-5+` между секциями?
5. **Тень:** карточка имеет кастомную мягкую тень, не `shadow-sm`?
6. **Вопрос:** выглядело бы это в приложении Airbnb? Если нет — переделай.
