import type { CollectionConfig } from 'payload'

// Подтверждение email включаем только при наличии ключа Resend — иначе письма
// не уйдут и пользователи не смогут подтвердиться (и залогиниться). Так dev без
// ключа продолжает работать без верификации.
const EMAIL_ON = !!process.env.RESEND_API_KEY
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://6sotok.vercel.app'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: EMAIL_ON
    ? {
        verify: {
          generateEmailSubject: () => 'Подтвердите email — 6sotok.kz',
          generateEmailHTML: ({ token, user }) => {
            const url = `${SERVER_URL}/verify?token=${token}`
            const name = (user as { name?: string })?.name || ''
            return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14160f">
  <div style="font-size:20px;font-weight:800;color:#066F36;margin-bottom:16px">6sotok.kz</div>
  <p style="font-size:15px;line-height:1.5">Здравствуйте${name ? ', ' + name : ''}!</p>
  <p style="font-size:15px;line-height:1.5">Подтвердите ваш email, чтобы завершить регистрацию на 6sotok.kz.</p>
  <a href="${url}" style="display:inline-block;margin:18px 0;background:#066F36;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:12px">Подтвердить email</a>
  <p style="font-size:13px;color:#5b5e54;line-height:1.5">Если кнопка не работает, откройте ссылку:<br><a href="${url}" style="color:#066F36">${url}</a></p>
  <p style="font-size:12px;color:#a3a59a;margin-top:20px">Если вы не регистрировались на 6sotok.kz — просто проигнорируйте это письмо.</p>
</div>`
          },
        },
      }
    : true,
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
