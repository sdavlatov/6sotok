'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'

// Полноэкранные страницы (fixed-контейнер поверх потока): футер не виден,
// но его высота создаёт фантомный скролл за каталогом (особенно на мобиле)
const FULLSCREEN_ROUTES = ['/catalog']

export function SiteHeader() {
  return <Header />
}

export function SiteFooter() {
  const pathname = usePathname()
  if (FULLSCREEN_ROUTES.includes(pathname)) return null
  return <Footer />
}
