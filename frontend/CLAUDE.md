# 6sotok.kz — Claude Instructions

Apply changes without confirmation. Modify files directly. Always.
NEVER ask yes/no questions. Always proceed immediately.
Always respond in Russian unless explicitly requested otherwise.
Responses must be short and concise. No summaries at end of response.
В конце каждой сессии обновлять раздел "Последние изменения" ниже.

**Согласованные решения проекта (auth, страницы, хедер, главная, монетизация): см. `docs/decisions.md`.**

---

## Производительность (2026-07-22)

Разбор «почему сайт долго грузится». Прод-замер до правок: TTFB 2.5–3.0 с холодный / 0.85 с тёплый на всех страницах. После — главная и /business статические (8 мс локально), /catalog 70 мс.

- **Шрифты. Найден корень: в `@theme` было `--font-mono: var(--font-mono), …` — токен ссылался сам на себя.** Переменная не резолвилась НИГДЕ, поэтому утилита Tailwind `font-mono` и все `var(--font-mono)` молча падали на Inter, а моно-шрифт держался только на захардкоженном `'JetBrains Mono'` + рендер-блокирующем `<link>` на fonts.googleapis.com (он ещё и стоял внутри `<body>`). Теперь: next/font отдаёт `--font-jetbrains` (имя развязано с токеном Tailwind), `@theme` → `--font-mono: var(--font-jetbrains), …`, внешний `<link>` и оба `preconnect` удалены. Голые `'JetBrains Mono'` по всем css/инлайн-стилям заменены на `var(--font-mono), 'JetBrains Mono', …`. Веса урезаны до используемых (Inter 400–900 без 100/200/300, mono 400–700 без 800), в subsets добавлен **latin-ext — он даёт ₸ (U+20B8)**, ради которого и тянули Google. Проверено headless: моно-шрифт теперь применяется на всех страницах (стало лучше, чем было), ₸ рисуется.
- **Кеш данных.** Все чтения объявлений в `lib/api.ts` обёрнуты в `unstable_cache` с тегом `LISTINGS_TAG` (`lib/cache-tags.ts` — отдельный модуль, разрывает цикл api → payload.config → Listings.ts) и TTL 300 с. `force-dynamic` снят с главной, /business, /business/[slug], PDP → `revalidate = 300`. `/catalog` и `/catalog/compare` читают searchParams и остаются динамическими, но их запрос к БД теперь из кеша.
- **Сброс кеша — грабли Next 16.** `revalidateTag(tag)` без второго аргумента задепрекейчен; с именованным профилем (`'max'`, `'hours'`…) он даёт **stale-while-revalidate** — следующий запрос ещё отдаёт старые данные. Для продавца это «объявление не появилось». Нужен `revalidateTag(tag, { expire: 0 })` — только он инвалидирует сразу (проверено: черновик → публикация виден на первом же запросе). `updateTag()` не подходит — кидает в route handler'ах.
- **Счётчик просмотров чуть не убил кеш.** `/api/view` пишет `views` в ту же коллекцию → afterChange → сброс кеша на КАЖДОМ открытии карточки. Лечится `context: { skipCacheFlush: true }` в вызове update + защита `isViewsOnlyChange(previousDoc, doc)` в хуке. Проверено обоими тестами: правка через Payload сбрасывает кеш, просмотр — нет.
- **Главная больше не грузит 500 объявлений** ради трёх счётчиков: `getListingCounts()` (payload `count`) + `getListingLocations()` (`select: { location: true }`, depth 0) + 40 свежих для витрины.
- **Курс валют.** Браузер ходил на nationalbank.kz напрямую → CORS-ошибка на КАЖДОЙ странице у каждого посетителя, курс всегда падал на заглушку 525. Появился прокси `app/api/fx/route.ts` (Нацбанк → резерв open.er-api.com, кеш 1 ч, `s-maxage`); `currency-context` делает один запрос на `/api/fx`. Реальный курс теперь доходит до клиента.
- **Картинки.** `images.remotePatterns` (Vercel Blob + Unsplash) в `next.config.ts`; карточки каталога/главной/сравнения/PDP переведены на `next/image` (`fill` + `sizes`, `priority` у LCP). Замер: PNG 2.2 МБ → WebP 16 КБ. Лайтбокс PDP и превью в `add-listing` (object-URL) намеренно оставлены на `<img>`.
- **Карты каталога.** Leaflet + markercluster + maplibre-gl + maplibre-gl-leaflet (~1 МБ) грузились цепочкой `.then()` = 4 round-trip'а. Теперь все четыре в `<link rel="preload" as="script">`, а выполнение — двумя параллельными ветками по зависимостям. Отказ maplibre гасится сразу (`.then(()=>true, ()=>false)`), иначе повисал unhandled rejection.
- **Карточка объявления отдавалась 10–14 с — худший TTFB на сайте.** Причина: `fetchLocationData` (Overpass, POI «что рядом») вызывался прямо в серверном компоненте с таймаутом 14 с, а стоявший на нём `next: { revalidate: 86400 }` **не работал — Next кеширует только GET, а запрос POST**. Публичный Overpass отвечает 7–9 с и регулярно отдаёт 429/504, то есть ждали его на каждый рендер. Решение: логика вынесена в `lib/poi.ts` под `unstable_cache` (сутки, методу запроса безразличен) + роут `app/api/poi/route.ts`; страница больше POI не ждёт (`loc = { mapPOIs: [], travel: [] }`), их догружает `listing-view.tsx` через `useEffect` → `/api/poi?lat&lng` в локальный state `poi`. Итог: **14.5 с → 0.53 с**, чипы «Аэропорт/Больница/Трасса» и пины на карте на месте (проверено headless на 1440 и 390).
- **Сбой Overpass кешировался на сутки.** `if (!res.ok) return {пусто}` + `catch → {пусто}` означало, что одна временная 429 гасила POI объявления на 24 часа (наткнулся на это вживую — объявление отдавало 0 POI из кеша). Теперь сбои **бросают** исключение: `unstable_cache` не кеширует отклонённый промис, поэтому следующий посетитель пробует снова. Пустой ответ 200 («рядом ничего нет») по-прежнему кешируется — это честный результат. Публичная обёртка `fetchLocationData` глушит ошибку уже ПОСЛЕ кеша. Проверено: 1-я попытка упала → 2-я успешна → 3-я мгновенно из кеша.
- **`POST /api/listings` возвращал 405 — форма подачи объявления не работала вообще.** Статический роут `app/api/listings/route.ts` (умел только `GET ?ids=`) перекрывал catch-all Payload `(payload)/api/[...slug]`, из-за чего ломались и создание объявления (форма шлёт POST и разбирает `err.errors[0].message` — формат Payload), и «Мои объявления» в ЛК (шлёт `?where[seller][equals]=` и ждёт `data.docs`). Роут перенесён на `app/api/listings/by-ids/route.ts`, единственный потребитель (`favorites/page.tsx`) обновлён. Теперь POST → 400 на пустом теле (эндпоинт жив), GET с `where` → `{docs:[…]}`.
- **`sharp` не был передан в `payload.config.ts`**, хотя `Media.ts` объявляет `imageSizes` (thumbnail 400×300, card 800×600) — Payload ругался на каждой сборке и **не ресайзил загруженное**, в хранилище ложились только оригиналы. Добавлен `sharp` в конфиг. Колонки `sizes_*` в таблице `media` уже существуют (проверено локально) — миграция не нужна.
- **Описание уезжало в каталог впустую.** `description` доходит до фронта (в БД лежит обычной строкой, `typeof === 'string'` проходит), но каталог и витрина бизнеса его не показывают — только PDP и `/business/[slug]`. Добавлен `stripDescription()` в `lib/api.ts`, применён на `/catalog` и `/business`. Проверено: текст описания больше не встречается в HTML каталога.
- Грабли при обрезке полей: первый греп «что использует каталог» **соврал** — `dealType`, `isNegotiable`, `reliefType` в списке не появились, хотя используются. Перед удалением поля из пейлоада проверять каждое отдельным `grep -c "\.поле\b"` по `catalog/` и `components/catalog/`.
- Грабли: dev-сервер Turbopack **не подхватил правку `globals.css`** — отдавал старый CSS со старой циклической строкой, из-за чего моно-шрифт «ломался» только в dev. Лечится `rm -rf .next && systemctl --user restart 6sotok-dev.service` (не только `rm -rf .next/cache`). Ещё: `.next/cache` переживает перезапуск `next start`, поэтому тесты инвалидации кеша надо гонять после его удаления.
- Не трогал (нашёл попутно, отдельная задача): `app/api/listings/route.ts` экспортирует только GET и понимает лишь `?ids=`, а ЛК запрашивает `?where[seller][equals]=…` → всегда `[]`.

---

## Последние изменения (2026-07-22)

- **Карточка объявления (PDP) переписана с нуля по макету `Дизайн html/Дизайн карточки объявления/listing.html`** (+ README/DATA_SPEC там же). Старый `catalog/[type]/[id]/page.tsx` (стрип статов, анализ цены со слайдером, ContactCard с ипотекой/юристом/безопасной сделкой) удалён. Осиротевшие компоненты `components/listings/doc-viewer.tsx` и `copy-link-button.tsx` удалены (использовались только старой PDP; `contact-card`/`mobile-contact-bar`/`photo-grid` НЕ трогать — их держит `business/[slug]`).
- Новое: server `page.tsx` (данные + Overpass-локация + метадата + ViewTracker) → client `listing-view.tsx` (весь дизайн 1:1) + `listing.css` (визуальные хелперы, скоуп `.pdp-page`). Токены `--brand*`, `font-mono` (JetBrains) — из globals.
- **Секции 1:1 с макетом**: галерея 4×2 (первый тайл col-span-2 row-span-2) + лайтбокс (←/→ wrap, Esc/scrim, body-lock) · заголовок + Поделиться(`navigator.share`→clipboard)/Печать · sticky sub-nav (top `61/69px`) со scroll-spy (`IntersectionObserver`, активный = чёрная заливка) · 4 ключевых факта («за сотку» — единственный зелёный) · описание · две `<dl>` характеристики+коммуникации · «Что построить» (нормы + SVG-ориентация) · документы (модалка-предпросмотр) · карта (реальный `ListingMap` + tt-чипы) · похожие (`.ncard`) · desktop sticky-сайдбар и mobile fixed нижний бар (цена/телефон/WhatsApp/избранное) + инлайн-карточка продавца на мобиле.
- **Боевые данные**: `getListingById` → всё из `Listing`; похожие из `getListings({limit:100})` (тот же пул считает `listingsCount` продавца по имени); Overpass POI/время в пути; избранное — `localStorage 6sotok_bookmarks` + событие `bookmarks-updated` (счётчик в хедере). Телефон раскрывается по клику. Документы (Акт/Межевой план) генерируются из реальных полей (`hasStateAct`/`cadastralNumber`/`area`/`seller`) — предпросмотр без скачивания, не персистятся.
- **Цвет строго по CLAUDE.md**: моно + один зелёный. Коммуникации — честные «Есть»/«Нет» (не выдуманные «3-фазное 15 кВт»); обременения: залог/обременение → «Есть» (чёрный), иначе при акте «Нет» (зелёный), без акта «Не проверено» (серый, не красный/янтарь); «Срочно» — чёрный чип; скидок/старой цены нет (полей нет — не выдумываем). `readyToBuild = hasStateAct && hasElectricity`, высота над морем — «—» (поля нет).
- Проверено headless (Playwright, реальное объявление с гео) на 1440 и 390: 200, secnav/факты/характеристики/похожие/карта на месте, новых pageerror нет (известные глобальные: hydration-варнинг Breadcrumbs + CORS курса nationalbank.kz). Грабли: dev-сервер после долгой сессии начал 404-ить ВСЕ маршруты кроме `/` (порченый `.next`) — лечится `rm -rf .next && systemctl --user restart 6sotok-dev.service`.

## Последние изменения (2026-07-21)

- **Личный кабинет переписан с нуля по макету `Дизайн html/Личный кабинет/`** (cabinet-lib/desktop/mobile.jsx). Старый `profile/page.tsx` (профиль + сетка «мои объявления») удалён. Новое: один client-компонент `profile/page.tsx` + `profile/cabinet.css` (только `.mono` и фон `.cabinet-page` — токены `--brand*/--ink-*/--paper*/--line` из globals). Моно-палитра + один зелёный акцент; кастомный набор SVG-иконок (`ICONS`/`Ic`) перенесён из макета 1:1 (не lucide — для точности: rocket/sparkle/drone/wallet и т.д.). Оболочка: десктоп = sticky-сайдбар (аватар, карта баланса, 7 пунктов навигации, «Выйти») + топ-бар (крошки, колокол, корзина); мобайл = свой топ-бар + фиксированная нижняя навигация (4 + «Ещё» боттом-шит) + шиты корзины. Хук `useMobile` (matchMedia 1024) переключает оболочки.
- **7 разделов**: Мои объявления · Продвижение · Доп. услуги · Заявки на услуги · Баланс и платежи · Аналитика · Настройки. Корзина (drawer/шит) + флеш-тост. **Боевое**: auth-guard (редирект `/login?next=/profile`), «Мои объявления» тянет реальные объявления (`/api/listings?where[seller][equals]=…`, маппинг `mapRow`: статус published→active/sold→archived/draft→draft, meta `тип · локация`, per=цена/площадь для земли, thumb=фото или градиент-заглушка, editHref land→`/edit-listing/{id}` biz→`/edit-business/{id}`), пустое состояние; Настройки — реальные имя/телефон/email/город + `updateUser`; «Выйти» = `signOut`. **Демо (бэкенда нет)**: Продвижение (BOOSTS: Реклама/Срочно/Снижение цены), Услуги (SERVICES), Заявки (ORDERS + прогресс-степпер), Баланс (топап/чекаут — client-state), Аналитика (KPI+бары). Промо-метки на карточках объявлений — демо-фичи будущего, у реальных объявлений их нет.
- Цвет строго по CLAUDE.md: «Срочно» = чёрный чип (`Badge tone=ink`), никакого синего/янтарного/красного. Проверено headless (CDP + реальная cookie-сессия тестового юзера) на 1440 и 390: все 7 разделов, корзина, мобайл — 1:1 с макетом, pageerrors нет (кроме известного CORS курса nationalbank.kz). Грабли: CDP-мок `/api/users/me` через Fetch.fulfillRequest не проходил в AuthProvider на прямой навигации (гонка первого запроса при загрузке документа) — тестировать ЛК надо реальной cookie (`Network.setCookie` с payload-token), не моком.
- **Подача объявления переписана с нуля по макету `Дизайн html/Подача объявлений/submit-listing.html`** (+ ТЗ там же). Старая одностраничная форма `add-listing/page.tsx` удалена. Новое — многошаговый мастер на **две сущности**: экран выбора типа → **Участок (4 шага)** `Тип и расположение · Параметры и цена · Фотографии · Контакты` и **Готовый бизнес (5 шагов)** `Категория · Локация · Финансы · Документы и фото · Контакты`. Общая оболочка: хлебные крошки + заголовок, сетка `рельс(220) · форма · сайдбар(320)`, sticky-панель действий снизу (Назад · «шаг N из M» · «Публикация — бесплатно» · чёрная «Дальше — …» / зелёная «Опубликовать бесплатно»). Мобайл: рельс/сайдбар скрыты, вместо них прогресс-хедер «Шаг N из M · %».
- Файлы: `add-listing/page.tsx` (мастер, client), `add-listing/map-editor.tsx` (Leaflet-карта вынесена: точка + рисование контура, оценка площади шнурованием), `add-listing/submit.css` (фактуры map-bg/ph-biz/noise/dash; сетка-фон `.submit-page`). Токены `--brand/--ink-*/--paper-*/--line` и класс `.mono` берутся из globals.
- **Цвет строго по CLAUDE.md**: моно + один зелёный акцент. Тумблеры (`Toggle`) в on → зелёная рамка + brand-50; активная плитка/чип → зелёные; никакого синего/янтарного/красного (старые amber/sky/red из `UTILITIES/LEGAL_FILTERS` в новой форме НЕ используются — коммуникации/документы это зелёные `Toggle`). Ошибки полей — чёрный `text-ink-900`, не красный. «Черновик»/«Бизнес» бейджи в превью — `brand-ink` (чёрный).
- **Тарифов при подаче НЕТ** — на шаге «Контакты» только зелёная плашка «Публикация бесплатна» (продвижение — позже из ЛК). Способы связи — только Звонок + WhatsApp.
- **Боевой сабмит сохранён**: медиа → `/api/media` → POST `/api/listings`. Участок: `listingCategory:'land'` + все поля (площадь/цена/коммуникации/документы/кадастр/контур/lat-lng, заголовок через `generateTitle`). Бизнес: `listingCategory:'business'` + `businessType/buildingArea/monthlyRevenue/paybackMonths(авто)/isOperational/floor`; поля без бэкенд-колонок (юр.форма, возраст, чистая прибыль, аренда, опись активов) складываются в `description`. NDA-тумблер и загрузка документов — пока клиентские (бэкенд-полей нет; документы прикладываются к модерации, не персистятся). При ошибке валидации мастер прыгает на шаг с первой ошибкой.
- Грабли: step-функции (`PhotosStep/ContactsStep/…`) вызываются **инлайн как функции**, а `DocUploader` вынесен на верхний уровень — иначе новая идентичность компонента на каждый рендер = remount и потеря фокуса/локального state при вводе. Проверено headless (CDP + перехват `/api/users/me`) на 1440 и 390: выбор типа, участок, бизнес, мобайл — 1:1 с макетом, карта грузится, ошибок нет.

## Последние изменения (2026-07-17)

- **Вход/регистрация переписаны 1:1 по макету `Дизайн html/Вход/auth.html`** (README там же). Старые `components/auth/auth-shell.tsx`, `auth-card.tsx` удалены; auth-блок CSS из `globals.css` вырезан (остался только `input::-ms-reveal`). Новое: `components/auth/auth-view.tsx` (client: бренд-панель, табы Вход↔Регистрация, формы) + `auth.css` (стили макета, скоуп `.auth-page`, локальные токены). `/login` и `/register` — тонкие обёртки `<AuthView initialMode>`; таб переключает режим на месте + `history.replaceState` синхронизирует URL (`next` сохраняется). Логика боевая: `useAuth` signIn/signUp, Google OAuth (`/api/auth/google?next=`), `error` из query на /login, статы бренд-панели из `/api/stats`. Регистрация: роль Хозяин/Агент, ОДНО поле «Имя и фамилия» (как в макете, вместо раздельных), телефон +7 (нормализуется в `+7XXXXXXXXXX`), согласие обязательно. «Забыли пароль?» — бэкенда нет, клик показывает честную подсказку `.note` (зелёный бокс: «скоро появится, пока войдите через Google»). Ошибки — нейтральный ink-бокс `.err` (без красного, по правилу цвета); `humanError()` переводит канцелярские/английские ответы Payload («Указанный email или пароль неверен», «Value must be unique») в человеческий текст. Статы бренд-панели с плюрализацией (`plural()`: «8 участков», не «8 участка» как в статичном макете). Телефон нормализуется `normalizePhone()`: ведущая 7/8 отрезается только у 11-значного (иначе 10-значный номер на 707… терял цифру). **Хедер/футер ВЕРНУЛИ на /login и /register** (как в макете) — из `site-chrome.tsx` удалён `AUTH_ROUTES`. Проверено headless (390 и 1440): вход/регистрация/мобайл ок, pageerrors нет.
- **Карта каталога — векторная «Схема»** (`components/catalog/catalog-map.tsx`): MapLibre GL + OpenFreeMap liberty (бесплатно, без ключа/лимитов) через `@maplibre/maplibre-gl-leaflet` поверх того же Leaflet (пины/кластеры не тронуты). Трансформация стиля в `getOfmStyle()`: все подписи → `coalesce(name:ru, name)` (name:ru в тайлах есть — проверено декодом pbf); улицы раньше (`STREET_NAME_MINZOOM`: major z10, minor z12); палитра под 2GIS через `OFM_COLOR_SWAP` (swap по значению цвета); выпилен растровый рельеф `ne2_shaded` (бледнил карту страны). «Спутник» — гибрид: labels-only GL-слой (`getOfmLabelsStyle()`) поверх Esri; нужен `z-index:2` у `.leaflet-gl-layer` (catalog.css), иначе подписи под растром.
- **Грабли maplibre-gl-leaflet**: (1) без WebGL конструктор GL кидает ВНУТРИ addTo, а Leaflet уже привязал события слоя → зомби-обработчики (`jumpTo`/`_actualCanvas` undefined) ломают все зумы и карта пустеет — поэтому `webglAvailable()` до создания + `tryAddGl()` с зачисткой `map.off(gl.getEvents(), gl)`; (2) GL-слой нельзя добавлять во время зум-анимации (`whenMapIdle`); (3) StrictMode: async-добавление слоя проверяет `stale()` — иначе слой уезжает на размонтированную карту. Fallback всегда — растровый OSM (`rasterSchemeLayer`). Атрибуция скрыта по требованию заказчика (перед продом желательно вернуть). Проверено headless (puppeteer + `--enable-unsafe-swiftshader`): страна/город/спутник/кластер-зумы без ошибок.
- **Центр знаний (журнал)** — 3 уровня по макетам `Дизайн html/Журнал знаний/` (README там же, fidelity pixel-perfect): `/journal` (хаб: hero+живой поиск, 7 секций, серии, вопросы, «Калькуляторы»/«Документы» — заглушки «Скоро»), `/journal/docs` (тема «Документы», сортировка популярность/дата), `/journal/docs/[slug]` (статья: прогресс-бар, TOC scrollspy десктоп-сайдбар + моб. аккордеон, врезки «Из каталога», чек-лист, связанные статьи/объявления, плавающая моб. CTA «Каталог»).
- Файлы: `app/(site)/journal/` — `page.tsx`, `journal.css` (классы `j-card`/`j-tile`/`map-mini`/`plot-amber`/`map-water`, scroll-row и т.д. — префиксованы `.journal`), `journal-data.ts` (ДЕМО-данные, заменить на CMS), `journal-ui.tsx` (JLink, JournalBreadcrumbBar, SecLabel, JournalCta, ArticleCard), `journal-search.tsx` (client), `docs/page.tsx` + `docs/topic-grid.tsx` (client, сортировка), `docs/[slug]/page.tsx` + `article-toc.tsx` (client: ReadProgress, TocDesktop/TocMobile). Одна демо-статья: slug `5-dokumentov-pered-pokupkoy`, остальные карточки `href='#'`.
- **Хедер**: пункт «Центр знаний» (kz «Білім орталығы», en «Knowledge hub») → `/journal`, между Аналитикой и Агентствам. **Футер**: «Журнал» в колонке Платформа → `/journal` (все 3 языка).
- `<image-slot>` из макета заменён CSS-плейсхолдером `.img-slot`; шапка/футер/крошки макета не портированы — используются боевые Header/Footer/Breadcrumbs.
- Известное (НЕ из этой сессии): `currency-context` фетчит курс с nationalbank.kz напрямую из браузера — CORS-ошибка в консоли на ВСЕХ страницах (курс падает на дефолт); лечится прокси-роутом на своём API. Также dev-warning гидрации в `Breadcrumbs` (`ol` className) — есть на всех страницах с крошками (/analytics, /safe-deal и т.д.), в проде не проявляется как ошибка.

---

## Последние изменения (2026-07-16)

- **Каталог + safe-area**: offset под хедером теперь `top-[calc(61px+env(safe-area-inset-top,0px))]` (мобайл) / `calc(69px+…)` (десктоп) — повторяет формулу высоты хедера (у него `padding-top:env(safe-area-inset-top)`). Сейчас no-op (нет `viewport-fit=cover` → env=0), но не сломается при переходе на PWA/cover.
- **site-chrome.tsx**: футер скрыт на `/catalog` (`FULLSCREEN_ROUTES`) — fixed-контейнер каталога не показывает футер, но его высота в потоке создавала фантомный скролл страницы на мобиле (docH 1256 при вьюпорте 844). `/catalog/compare` не затронут (точное совпадение pathname). Хедер/футер по маршрутам проверены headless-скриптом (desktop 1440 + mobile 390): все страницы ок, /login /register без хроума, /profile /add-listing редиректят на /login.
- **Каталог полностью переписан** по high-fidelity макету `Дизайн html/Каталог /catalog.html` (README там же). Старые `catalog-client.tsx`, `components/catalog/filters.tsx`, `sort.tsx` удалены.
- Новые файлы: `app/(site)/catalog/catalog-client.tsx` (десктоп >1024px + общее состояние), `mobile-view.tsx` (мобайл ≤1024px: bottom sheet 3 снапа, sheet фильтров, детальный sheet с WhatsApp/звонком), `filter-ui.tsx` (единые фильтр-контролы), `catalog-utils.ts` (модель фильтров, форматтеры, cardMeta), `catalog.css`, `components/catalog/catalog-map.tsx` (новая Leaflet-карта: пины-пилюли с ценой, кластеры по макету).
- `components/catalog/map-view.tsx` НЕ трогать при работе с каталогом — он остался только для `business-catalog-client.tsx` и `home/search-bar.tsx`.
- Важные грабли: контейнер каталога `fixed z-40` — модалки поверх хедера (z-1000) выносить через `createPortal(document.body)`; контейнер Leaflet-карты должен иметь `relative z-0 isolate`, иначе панели карты (z 200–700) перекрывают оверлеи.
- Часть данных карточек замокана в `cardMeta()` (высота над морем, −N% скидка, «Срочно», рекламная позиция) — см. TODO в конце сессии.
- Правки после ревью #1: фильтры дополнены (Документы +«ИЖС (разрешение)», Особенности = У воды/Вид на горы/Только от хозяина/С постройкой — мапятся на `locationType` water/foothills); реклама-карточка топ-1 без `sticky`; тайлы «Схема» → CartoDB Positron (светлая приглушённая гамма, бесплатно).
- Правки после ревью #5 (мобайл/карта): (1) карта открывается на уровне страны (KZ_CENTER [48,67.5] zoom 5, убрал стартовый fitBounds); (2) фильтр по окну карты применяется только ПОСЛЕ первого движения (`mapInteracted`) — на старте виден весь список (иначе показывало «1 участок»); (3) на мобиле чип фильтра открывает ФОКУС-ШИТ только этого фильтра (`focus`/`openFocus`, компонент из filter-ui: Цена/Площадь/Город/Тип/Коммуникации/Документы), «Все фильтры» — по-прежнему полное окно; (4) убрал горизонтальную карусель в peek — список всегда вертикальный (удалён `MobileCarouselCard`); (5) на мобиле показывается зачёркнутая старая цена + чип −N% у цены (было только на фото); (6) десктоп: убрал hover по пину (Leaflet заменяет DOM при смене иконки → терялся mouseout, карточка залипала) — карточка теперь по ховеру карточки списка (надёжный DOM) и клику по пину; клик по карте чистит и active, и hover.
- Двойной счёт просмотренных (фикс): `6sotok_viewed` пишут ДВА механизма с разными ключами — каталог `markViewed` по `id`, а `ViewTracker`/`hero-map` по `slug` (в моках `id!==slug`), поэтому одно объявление давало 2 записи. Каталог теперь считает по объявлению через `isListingViewed(l, viewed)` = `viewed.has(id) || viewed.has(slug)` и `viewedCount()` — без двойного счёта; используется в счётчике, пинах и карточках (desktop+mobile).
- Кнопка «Очистить историю просмотров»: контекстная ссылка в шапке списка (desktop) и листа (mobile), видна ТОЛЬКО когда `viewed.size > 0` — иконка корзины + «N просмотрено»; `clearViewed()` чистит Set и `6sotok_viewed`. Тихий серый тон, в существующей строке «в окне карты / ср. за сотку» — не занимает места, когда просмотренных нет.
- Правки после ревью #4: (1) убран служебный подзаголовок drawer «единый набор · тот же на мобиле»; (2) добавлен переключатель режима фильтров «Секции / Компактно» (аккордеон) в `AllFiltersBody` — общий для desktop-drawer и mobile-sheet; блоки перемонтируются по `key={grouping}`; (3) тумблер «Искать при движении карты» теперь работает как фильтр: ON → список = участки в окне карты, OFF → список = ВСЕ результаты (кнопку «Искать в этой области» убрал, `visibleIds` применяется только при ON); (4) в карточке строка «тип · локация» показывает `cityOf(l)` (без «…обл.»), бейдж «смотрели» перенесён из этой строки вниз к дате — меньше обрезки; (5) избранное/сравнение диспатчат `bookmarks-updated`/`compare-updated` и пишут `6sotok_compare`, поэтому счётчики в хедере обновляются сразу (раньше только при перезагрузке); сравнение синхронизируется с LS при маунте.
- Правки после ревью #3: (1) «просмотренные» ВЕРНУЛ в localStorage (`6sotok_viewed`) — переход в объявление = перезагрузка, память сбрасывалась и метка терялась; визуал остаётся читаемым (фото `opacity-70` + бейдж «смотрели»); на карте просмотренный пин серый (`.cpin.is-viewed`, виден при разворошённом кластере). (2) Заголовок объявления генерируем МЫ — `lib/listing-title.ts` `generateTitle()`: компактное «{рельеф}{площадь} соток{особенность}» (напр. «Ровный 6 соток с актом», «12 соток у воды»); применён в каталоге (карточки/деталь/ховер) поверх stored-title и в форме `add-listing` (`autoTitle`). Старое правило `{тип}·{площадь}·{локация}` было длинным и дублировало строку «тип·локация».
- Правки после ревью #2: (1) фильтр-бар и TypeGrid показывают ВСЕ категории `LAND_CATEGORIES` с реальными счётчиками (0 допускается) — `landTypeCounts()`; (2) коммуникации в карточке отдельными тегами (Свет/Вода/Газ/Канализация), без схлопывания в «Все коммуникации»; (3) «просмотренные» — только сессия (НЕ пишем в localStorage, сбрасываются при F5), приглушается лишь фото (`opacity-70`), текст читаем + бейдж «смотрели»; (4) звезда/пульс ТОЛЬКО на активном (кликнутом/наведённом) пине — рекламный пин кластеризуется как все, постоянной звезды нет; (5) клик по пину на десктопе НЕ ведёт на объявление, а показывает карточку `MapCard` (activeId), клик по пустой карте закрывает; карточка позиционируется умно (снизу→сверху→справа→слева, стрелка к пину, кнопка × при закреплении), позиция обновляется каждые 120мс при перетаскивании карты. Заголовки объявлений могут быть длинными (авто-генерация вида «МЖС · 200 сот. · …») — это данные, layout обрезает `line-clamp-2`.

---

## Последние изменения (2026-07-09)

- **Хедер/футер**: перенесены web-компоненты `site-header.js`/`site-footer.js` (макет AIDA) в React → `components/layout/header.tsx` и `footer.tsx`. Shadow DOM → scoped `<style>` (`.sixsotok-header`/`.sixsotok-footer`). i18n RU/KZ/EN, авто-курс $→₸, мобильное раскрытие хедера, счётчик избранного из `6sotok_bookmarks`, «Войти/Профиль» через `useAuth`.
- **Глобальная валюта**: `context/currency-context.tsx` (`CurrencyProvider`/`useCurrency`) — единый источник языка+валюты+курса. Подключён в `(site)/layout.tsx`. Компонент `components/ui/price.tsx` `<Price value compact perSotka/>`. Цены динамически пересчитываются ₸↔$ при переключении в хедере. Подключено в: `listing-card`, `business-card`, `contact-card`, `mobile-contact-bar`, главная.
- **Главная**: полностью заменена на порт макета «index (Главная AIDA)» → `app/(site)/page.tsx` (server, тянет данные) + `components/home/home-client.tsx` (client) + `components/home/home.css`. Живое: ротация рекламной hero-карточки, live-тикер, 3-шаговый мастер подбора (бюджет-слайдер + поиск по регионам). Старые home-компоненты (split-view, home-filter и т.д.) больше не используются.
- **globals.css**: в `@theme` добавлены токены макета (`--color-brand-*`, `--color-ink-*`, `--color-paper-*`, `--color-util-*`, `--tracking-tightest`), чтобы Tailwind-классы макета резолвились.
- **categories-grid.tsx**: `Cow` → `Tractor` (иконка переименована в новых lucide).

---

## Последние изменения (2026-05-07)

- **payload.config.ts**: `push: NODE_ENV !== 'production'` — в проде ВЫКЛЮЧЕН навсегда. Данные в Neon больше не будут теряться при деплое.
- **Изменение схемы**: всегда через Neon SQL Editor — см. раздел ниже.
- **profile/page.tsx**: кнопки "Продано" и редактирования, 24h countdown для черновиков.
- **edit-listing/[id]/page.tsx**: страница редактирования с предзаполненной формой.
- **add-listing/page.tsx**: scroll to error, видимые точки при рисовании, авто-редирект после сабмита.
- **Vercel деплой**: https://6sotok.vercel.app. Neon PostgreSQL (unpooled URL). Vercel Blob для медиа.
- **api.ts**: Payload JS API напрямую (`getPayload({config})`), не HTTP — устраняет Turbopack panic.

---

## ⚠️ Изменение схемы БД (обязательно читать)

`push: true` в продакшене **стёр все данные** при деплое. Теперь `push` работает только локально.

### Правило: любое изменение полей в `Listings.ts` (или других коллекциях) требует двух шагов:

**Шаг 1 — локально** (автоматически через push):
```bash
systemctl --user restart 6sotok-dev.service
```
Payload сам применит изменения к локальному Docker Postgres.

**Шаг 2 — Neon (вручную)** перед или после деплоя на Vercel:

| Действие в коллекции | SQL на Neon |
|---|---|
| Добавить поле `myField` (text) | `ALTER TABLE listings ADD COLUMN IF NOT EXISTS my_field text;` |
| Добавить поле `myFlag` (checkbox) | `ALTER TABLE listings ADD COLUMN IF NOT EXISTS my_flag boolean DEFAULT false;` |
| Добавить поле `myNum` (number) | `ALTER TABLE listings ADD COLUMN IF NOT EXISTS my_num numeric;` |
| Удалить поле | `ALTER TABLE listings DROP COLUMN IF EXISTS old_field;` |
| Переименовать поле | `ALTER TABLE listings RENAME COLUMN old_name TO new_name;` |

Neon SQL Editor: https://console.neon.tech → проект → SQL Editor

### Маппинг имён: Payload (camelCase) → Postgres (snake_case)
- `dealType` → `deal_type`
- `listingCategory` → `listing_category`
- `hasElectricity` → `has_electricity`
- `sellerHasWhatsApp` → `seller_has_whats_app`

### НИКОГДА не делать:
- Не добавлять `PAYLOAD_DB_PUSH=true` в Vercel env vars — это опасно
- Не менять `push: false` в prod на `push: true`

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
