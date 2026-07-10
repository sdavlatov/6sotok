// Google OAuth 2.0 helper — серверная часть.
// Требует env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

export interface GoogleProfile {
  sub: string // стабильный Google ID пользователя
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}

export function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
}

/**
 * Origin из заголовков запроса. req.nextUrl.origin в dev возвращает hostname
 * сервера (0.0.0.0) и ломает совпадение redirect_uri с Google. Host-заголовок
 * (или APP_ORIGIN) надёжнее — работает и на localhost, и на Vercel.
 */
export function originFromRequest(req: Request): string {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  const proto =
    req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/** Redirect URI строим от origin запроса — работает и на localhost, и на проде. */
export function redirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`
}

/** URL согласия Google, на который редиректим пользователя. */
export function buildAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/** Обмен authorization code на access token. */
export async function exchangeCode(origin: string, code: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(origin),
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Google token exchange failed: ${txt}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error('No access_token from Google')
  return data.access_token
}

/** Профиль пользователя по access token. */
export async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Google profile')
  return (await res.json()) as GoogleProfile
}
