import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { exchangeCode, fetchProfile, googleConfigured, originFromRequest } from '@/lib/google-oauth'

function fail(origin: string, msg: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
}

export async function GET(req: NextRequest) {
  const origin = originFromRequest(req)
  const { searchParams } = req.nextUrl

  if (!googleConfigured()) return fail(origin, 'Вход через Google не настроен')

  // Пользователь отказал в доступе
  if (searchParams.get('error')) return fail(origin, 'Вход через Google отменён')

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  if (!code || !state) return fail(origin, 'Некорректный ответ Google')

  // Проверка nonce (CSRF)
  let next = '/profile'
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
      nonce: string
      next: string
    }
    const cookieNonce = req.cookies.get('g_oauth_nonce')?.value
    if (!cookieNonce || cookieNonce !== decoded.nonce) {
      return fail(origin, 'Сессия входа устарела, попробуйте снова')
    }
    if (decoded.next?.startsWith('/')) next = decoded.next
  } catch {
    return fail(origin, 'Некорректный state')
  }

  try {
    const accessToken = await exchangeCode(origin, code)
    const profile = await fetchProfile(accessToken)

    if (!profile.email || !profile.email_verified) {
      return fail(origin, 'Google не подтвердил вашу почту')
    }

    const payload = await getPayload({ config })
    const email = profile.email.toLowerCase()

    // Найти-или-создать пользователя по email
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    // Случайный пароль — нужен для выдачи Payload-сессии через login().
    // OAuth-пользователь паролем не пользуется; ротация безопасна.
    const password = randomBytes(24).toString('base64url')

    if (existing.docs.length > 0) {
      const user = existing.docs[0]
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { password, googleId: profile.sub },
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'users',
        data: {
          email,
          password,
          name: profile.name || email.split('@')[0],
          googleId: profile.sub,
          role: 'seller',
        },
        overrideAccess: true,
      })
    }

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.token) return fail(origin, 'Не удалось создать сессию')

    const res = NextResponse.redirect(`${origin}${next}`)
    res.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: result.exp ? Math.max(0, result.exp - Math.floor(Date.now() / 1000)) : 60 * 60 * 24 * 7,
    })
    res.cookies.delete('g_oauth_nonce')
    return res
  } catch (err) {
    console.error('[google-oauth]', err)
    return fail(origin, 'Ошибка входа через Google')
  }
}
