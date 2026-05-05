import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/profile', '/add-listing', '/add-business']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PROTECTED.some(p => pathname.startsWith(p))) {
    const token = request.cookies.get('payload-token')
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/add-listing/:path*', '/add-business/:path*'],
}
