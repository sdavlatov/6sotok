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
  avatar?: string   // URL картинки (media)
}

/**
 * Payload отдаёт avatar как id (depth 0) или объект media (depth 1). Приводим
 * к URL, чтобы фронт всегда работал со строкой.
 */
function mapUser<T extends { avatar?: unknown } | null | undefined>(u: T): T {
  if (u && typeof u === 'object') {
    const a = (u as { avatar?: unknown }).avatar
    ;(u as { avatar?: string }).avatar =
      a && typeof a === 'object' && 'url' in a ? ((a as { url?: string }).url ?? undefined) : undefined
  }
  return u
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
  // depth=1 — чтобы avatar пришёл объектом media с url, а не голым id
  const res = await fetch('/api/users/me?depth=1', { credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json()
  return mapUser(data.user ?? null)
}

export type UserPatch = Partial<Pick<User, 'name' | 'phone' | 'city'>> & { avatar?: string | number | null }

export async function updateMe(id: string, fields: UserPatch): Promise<User> {
  const res = await fetch(`/api/users/${id}?depth=1`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('Ошибка сохранения')
  const data = await res.json()
  return mapUser(data.doc)
}

/** Загрузка файла в media → { id, url }. Используется для аватара. */
export async function uploadMedia(file: File): Promise<{ id: string; url: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/media', { method: 'POST', credentials: 'include', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Ошибка загрузки файла')
  return { id: String(data.doc.id), url: data.doc.url }
}
