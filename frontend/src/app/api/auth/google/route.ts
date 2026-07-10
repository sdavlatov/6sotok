import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { buildAuthUrl, googleConfigured, originFromRequest } from '@/lib/google-oauth'

export async function GET(req: NextRequest) {
  const origin = originFromRequest(req)

  if (!googleConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Вход через Google не настроен')}`,
    )
  }

  // next — куда вернуть после успешного входа
  const next = req.nextUrl.searchParams.get('next') || '/profile'
  const nonce = randomBytes(16).toString('hex')
  const state = Buffer.from(JSON.stringify({ nonce, next })).toString('base64url')

  const res = NextResponse.redirect(buildAuthUrl(origin, state))
  // nonce кладём в httpOnly cookie — проверим на колбэке (защита от CSRF)
  res.cookies.set('g_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  })
  return res
}
