import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { LISTINGS_TAG } from '@/lib/cache-tags'

/**
 * Сбрасывает кеш чтений объявлений (см. lib/api.ts). Вызывается из хуков Payload,
 * которые могут выполняться и вне запросного контекста Next (скрипты, сиды),
 * — там revalidateTag кидает, поэтому глушим.
 */
function flushListingsCache() {
  try {
    // Второй аргумент в Next 16 обязателен. Именованные профили ('max', 'hours'…)
    // дают stale-while-revalidate: следующий запрос ещё получит старые данные, а
    // обновление уйдёт в фон. Продавцу, который только что опубликовал объявление,
    // это выглядит как «ничего не появилось», поэтому expire: 0 — сброс сразу.
    revalidateTag(LISTINGS_TAG, { expire: 0 })
  } catch { /* вне контекста запроса — кеш сам истечёт по TTL */ }
}

/** Изменились только `views` (и служебный updatedAt)? Тогда кеш трогать незачем. */
function isViewsOnlyChange(prev: Record<string, unknown>, next: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const k of keys) {
    if (k === 'views' || k === 'updatedAt') continue
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) return false
  }
  return true
}

export const Listings: CollectionConfig = {
  slug: 'listings',
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (operation === 'create' && typeof doc.slug === 'string' && doc.slug.startsWith('listing-')) {
          try {
            await req.payload.update({
              collection: 'listings',
              id: doc.id,
              data: { slug: String(doc.id) },
              overrideAccess: true,
              context: { skipCacheFlush: true },
            })
          } catch { /* silent */ }
        }
        // Счётчик просмотров (api/view) меняет документ на каждом открытии карточки —
        // сбрасывать из-за этого кеш всего каталога нельзя.
        if (context?.skipCacheFlush) return
        if (operation === 'update' && previousDoc && isViewsOnlyChange(previousDoc, doc)) return
        flushListingsCache()
      },
    ],
    afterDelete: [() => { flushListingsCache() }],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'area', 'landType', 'location', 'status', 'createdAt'],
  },
  endpoints: [
    {
      path: '/bulk-publish',
      method: 'post',
      handler: async (req) => {
        const body = await req.json?.() ?? {}
        const ids: string[] = body?.ids ?? []
        if (!ids.length) return Response.json({ updated: 0 })
        let updated = 0
        for (const id of ids) {
          try {
            await req.payload.update({
              collection: 'listings',
              id,
              data: { status: 'published' },
              overrideAccess: true,
            })
            updated++
          } catch { /* пропускаем невалидный id */ }
        }
        return Response.json({ updated })
      },
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as { role?: string }).role === 'admin') return true
      return { seller: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if ((user as { role?: string }).role === 'admin') return true
      return { seller: { equals: user.id } }
    },
  },
  fields: [
    // ─── Категория листинга ──────────────────────────────────────────────────
    {
      name: 'listingCategory',
      type: 'select',
      label: 'Категория',
      defaultValue: 'land',
      required: true,
      options: [
        { label: 'Земельный участок', value: 'land' },
        { label: 'Бизнес', value: 'business' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'dealType',
      type: 'select',
      label: 'Тип сделки',
      defaultValue: 'sale',
      required: true,
      options: [
        { label: 'Продажа', value: 'sale' },
        { label: 'Аренда', value: 'rent' },
      ],
      admin: { position: 'sidebar' },
    },

    // ─── Основное ────────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Заголовок',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug (URL)',
      admin: {
        description: 'Уникальный идентификатор для URL. Генерируется автоматически.',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            }
            return value
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Статус',
      defaultValue: 'draft',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликовано', value: 'published' },
        { label: 'Продано', value: 'sold' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Цена (₸)',
      min: 0,
    },
    {
      name: 'area',
      type: 'number',
      label: 'Площадь (соток) — для земли',
      min: 0,
    },
    {
      name: 'buildingArea',
      type: 'number',
      label: 'Площадь (м²) — для бизнеса',
      min: 0,
    },
    {
      name: 'businessType',
      type: 'select',
      label: 'Тип бизнеса',
      options: [
        { label: 'Кафе / Ресторан', value: 'cafe' },
        { label: 'Магазин / Торговля', value: 'shop' },
        { label: 'Офис', value: 'office' },
        { label: 'Склад', value: 'warehouse' },
        { label: 'Производство', value: 'production' },
        { label: 'АЗС / Сервис', value: 'service' },
        { label: 'Отель / Хостел', value: 'hotel' },
        { label: 'Земля под бизнес', value: 'land' },
        { label: 'Другое', value: 'other' },
      ],
    },
    {
      name: 'landType',
      type: 'select',
      label: 'Тип участка',
      options: [
        { label: 'ИЖС', value: 'ИЖС' },
        { label: 'Дача', value: 'Дача' },
        { label: 'Коммерция', value: 'Коммерция' },
        { label: 'Сельхоз', value: 'Сельхоз' },
        { label: 'МЖС', value: 'МЖС' },
        { label: 'ЛПХ', value: 'ЛПХ' },
      ],
    },

    // ─── Бизнес: характеристики объекта ─────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Характеристики объекта (бизнес)',
      fields: [
        { name: 'floor', type: 'number', label: 'Этаж', min: 0 },
        { name: 'totalFloors', type: 'number', label: 'Этажей в здании', min: 1 },
        { name: 'ceilingHeight', type: 'number', label: 'Высота потолков (м)', min: 0 },
        { name: 'yearBuilt', type: 'number', label: 'Год постройки', min: 1900, max: 2100 },
        {
          name: 'condition',
          type: 'select',
          label: 'Состояние',
          options: [
            { label: 'Свежий ремонт', value: 'renovated' },
            { label: 'Хорошее', value: 'good' },
            { label: 'Требует ремонта', value: 'needs_repair' },
            { label: 'Под чистовую', value: 'shell' },
          ],
        },
        { name: 'electricPower', type: 'number', label: 'Выделенная мощность (кВт)', min: 0 },
        { name: 'hasParking', type: 'checkbox', label: 'Собственная парковка', defaultValue: false },
        { name: 'hasSeparateEntrance', type: 'checkbox', label: 'Отдельный вход', defaultValue: false },
        { name: 'isOperational', type: 'checkbox', label: 'Действующий бизнес', defaultValue: false },
        { name: 'isTenanted', type: 'checkbox', label: 'Есть арендаторы', defaultValue: false },
        { name: 'monthlyRevenue', type: 'number', label: 'Выручка в месяц (₸)', min: 0 },
        { name: 'paybackMonths', type: 'number', label: 'Срок окупаемости (мес)', min: 0 },
      ],
    },

    // ─── Изображения ─────────────────────────────────────────────────────────
    {
      name: 'images',
      type: 'array',
      label: 'Фотографии',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // ─── Описание ────────────────────────────────────────────────────────────
    {
      name: 'description',
      type: 'richText',
      label: 'Описание',
    },

    // ─── Местоположение ──────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Местоположение',
      fields: [
        {
          name: 'location',
          type: 'text',
          required: true,
          label: 'Регион / Город',
        },
        {
          name: 'address',
          type: 'text',
          label: 'Адрес',
        },
        {
          name: 'locationType',
          type: 'select',
          label: 'Тип местоположения',
          hasMany: true,
          options: [
            { label: 'В городе', value: 'city' },
            { label: 'В пригороде', value: 'suburb' },
            { label: 'Вдоль трассы', value: 'highway' },
            { label: 'Возле водоёма', value: 'water' },
            { label: 'В предгорьях', value: 'foothills' },
            { label: 'В дачном массиве', value: 'dacha' },
          ],
        },
        {
          name: 'lat',
          type: 'number',
          label: 'Широта',
        },
        {
          name: 'lng',
          type: 'number',
          label: 'Долгота',
        },
      ],
    },

    // ─── Коммуникации ────────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Коммуникации',
      fields: [
        { name: 'hasElectricity', type: 'checkbox', label: 'Электричество', defaultValue: false },
        { name: 'hasGas', type: 'checkbox', label: 'Газ', defaultValue: false },
        { name: 'hasWater', type: 'checkbox', label: 'Вода', defaultValue: false },
        { name: 'hasSewer', type: 'checkbox', label: 'Канализация', defaultValue: false },
        { name: 'hasRoadAccess', type: 'checkbox', label: 'Дорога', defaultValue: false },
      ],
    },

    // ─── Юридические данные ──────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Юридические данные',
      fields: [
        { name: 'cadastralNumber', type: 'text', label: 'Кадастровый номер' },
        {
          name: 'ownershipType',
          type: 'select',
          label: 'Право собственности',
          options: [
            { label: 'Частная собственность', value: 'Частная собственность' },
            { label: 'Аренда', value: 'Аренда' },
          ],
        },
        {
          name: 'purpose',
          type: 'select',
          label: 'Назначение',
          options: [
            { label: 'ИЖС', value: 'ИЖС' },
            { label: 'ЛПХ', value: 'ЛПХ' },
            { label: 'Коммерция', value: 'Коммерция' },
            { label: 'Сельхоз', value: 'Сельхоз' },
          ],
        },
        { name: 'hasStateAct', type: 'checkbox', label: 'Гос. акт', defaultValue: false },
        { name: 'isPledged', type: 'checkbox', label: 'В залоге', defaultValue: false },
        { name: 'hasEncumbrances', type: 'checkbox', label: 'Обременения', defaultValue: false },
        { name: 'isDivisible', type: 'checkbox', label: 'Возможно деление', defaultValue: false },
        { name: 'isOnRedLine', type: 'checkbox', label: 'На красной линии', defaultValue: false },
        { name: 'canChangePurpose', type: 'checkbox', label: 'Можно изменить назначение', defaultValue: false },
        { name: 'landCategory', type: 'text', label: 'Категория земли' },
      ],
    },

    // ─── Геометрия участка ───────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Геометрия участка',
      fields: [
        {
          name: 'reliefType',
          type: 'select',
          label: 'Рельеф',
          options: [
            { label: 'Ровный', value: 'Ровный' },
            { label: 'Под уклон', value: 'Под уклон' },
          ],
        },
        { name: 'plotShape', type: 'text', label: 'Форма участка' },
        { name: 'plotBoundary', type: 'text', label: 'Границы участка (JSON)', admin: { description: 'JSON: [{lat,lng},...] — рисуется пользователем на карте' } },
      ],
    },

    // ─── Статистика ──────────────────────────────────────────────────────────
    {
      name: 'views',
      type: 'number',
      label: 'Просмотры',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },

    // ─── Контакт продавца ────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'Контакт продавца',
      fields: [
        {
          name: 'seller',
          type: 'relationship',
          relationTo: 'users',
          label: 'Продавец (аккаунт)',
          admin: {
            description: 'Привязать к аккаунту или заполнить поля ниже',
          },
        },
        { name: 'sellerName', type: 'text', label: 'Имя продавца' },
        { name: 'sellerPhone', type: 'text', label: 'Телефон продавца' },
        { name: 'sellerHasWhatsApp', type: 'checkbox', label: 'Есть WhatsApp', defaultValue: false },
        { name: 'sellerIsAgency', type: 'checkbox', label: 'Агентство', defaultValue: false },
      ],
    },
  ],
}
