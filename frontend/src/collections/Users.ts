import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    // Публичная саморегистрация (вход по email/паролю)
    create: () => true,
    // Читать список/чужих может только админ; себя — через /api/users/me
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) return { id: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) return { id: { equals: user.id } }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
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
      name: 'city',
      type: 'text',
      label: 'Город / регион',
    },
    {
      name: 'googleId',
      type: 'text',
      label: 'Google ID',
      admin: { readOnly: true, description: 'Заполняется при входе через Google' },
      index: true,
    },
    {
      name: 'accountType',
      type: 'select',
      label: 'Тип аккаунта',
      defaultValue: 'owner',
      options: [
        { label: 'Хозяин', value: 'owner' },
        { label: 'Агент', value: 'agent' },
        { label: 'Бизнес', value: 'business' },
      ],
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
        // нельзя выставить себе роль при саморегистрации — только админ
        create: ({ req: { user } }) => user?.role === 'admin',
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
}
