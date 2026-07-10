'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'

// На страницах авторизации — сфокусированный экран без шапки/футера сайта
const AUTH_ROUTES = ['/login', '/register']

export function SiteHeader() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null
  return <Header />
}

export function SiteFooter() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null
  return <Footer />
}
