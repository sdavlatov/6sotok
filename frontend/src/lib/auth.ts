export type AccountType = 'owner' | 'agent' | 'business'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  isAgency?: boolean
  accountType?: AccountType
  role: 'admin' | 'seller'
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Неверный email или пароль')
  return data.user
}

export async function register(payload: {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
  accountType?: AccountType
}): Promise<void> {
  const body = {
    ...payload,
    isAgency: payload.accountType === 'agent',
  }
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Ошибка регистрации')
}

export async function logout(): Promise<void> {
  await fetch('/api/users/logout', {
    method: 'POST',
    credentials: 'include',
  })
}

export async function getMe(): Promise<User | null> {
  const res = await fetch('/api/users/me', { credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json()
  return data.user ?? null
}

export async function updateMe(id: string, fields: Partial<Pick<User, 'name' | 'phone'>>): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('Ошибка сохранения')
  const data = await res.json()
  return data.doc
}
