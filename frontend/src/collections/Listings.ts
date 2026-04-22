import type { CollectionConfig } from 'payload'

export const Listings: CollectionConfig = {
  slug: 'listings',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && typeof doc.slug === 'string' && doc.slug.startsWith('listing-')) {
          try {
            await req.payload.update({
              collection: 'listings',
              id: doc.id,
              data: { slug: String(doc.id) },
              overrideAccess: true,
            })
          } catch { /* silent */ }
        }
      },
    ],
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
  },
  fields: [
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
      name: 'isNegotiable',
      type: 'checkbox',
      label: 'Торг уместен',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'area',
      type: 'number',
      required: true,
      label: 'Площадь (соток)',
      min: 0,
    },
    {
      name: 'landType',
      type: 'select',
      required: true,
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
        { name: 'frontWidth', type: 'number', label: 'Ширина по фасаду (м)' },
        { name: 'depth', type: 'number', label: 'Глубина (м)' },
      ],
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
