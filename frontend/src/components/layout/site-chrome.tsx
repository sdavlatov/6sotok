'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'

// На страницах авторизации — сфокусированный экран без шапки/футера сайта
const AUTH_ROUTES = ['/login', '/register']

// Полноэкранные страницы (fixed-контейнер поверх потока): футер не виден,
// но его высота создаёт фантомный скролл за каталогом (особенно на мобиле)
const FULLSCREEN_ROUTES = ['/catalog']

export function SiteHeader() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname)) return null
  return <Header />
}

export function SiteFooter() {
  const pathname = usePathname()
  if (AUTH_ROUTES.includes(pathname) || FULLSCREEN_ROUTES.includes(pathname)) return null
  return <Footer />
}
