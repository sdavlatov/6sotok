import type { CollectionConfig } from 'payload'

/**
 * Жалобы на объявления. Модель модерации «авто + жалобы»: объявления
 * публикуются сразу, а посетители могут пожаловаться. Админ видит жалобы в
 * /admin и может снять объявление (status → 'blocked').
 */
export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['listing', 'reason', 'status', 'createdAt'],
  },
  access: {
    // Жаловаться может кто угодно (в т.ч. неавторизованный посетитель).
    create: () => true,
    // Читать и разбирать — только админ.
    read: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'listing',
      type: 'relationship',
      relationTo: 'listings',
      required: true,
      label: 'Объявление',
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      label: 'Причина',
      options: [
        { label: 'Мошенничество / обман', value: 'fraud' },
        { label: 'Объявление уже продано / неактуально', value: 'stale' },
        { label: 'Неверная информация', value: 'wrong_info' },
        { label: 'Дубликат', value: 'duplicate' },
        { label: 'Спам / реклама', value: 'spam' },
        { label: 'Другое', value: 'other' },
      ],
    },
    {
      name: 'comment',
      type: 'textarea',
      label: 'Комментарий',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Статус разбора',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'Рассмотрена', value: 'reviewed' },
        { label: 'Отклонена', value: 'dismissed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'reporterContact',
      type: 'text',
      label: 'Контакт заявителя (необязательно)',
    },
  ],
}
