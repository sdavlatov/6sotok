import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Имя',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'isAgency',
      type: 'checkbox',
      label: 'Агентство',
      defaultValue: false,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Аватар',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Роль',
      defaultValue: 'seller',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Продавец', value: 'seller' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
