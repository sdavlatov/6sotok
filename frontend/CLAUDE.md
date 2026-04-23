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
