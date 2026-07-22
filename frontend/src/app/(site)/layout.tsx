import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
import { SiteHeader, SiteFooter } from '@/components/layout/site-chrome'
import { AuthProvider } from '@/context/auth-context'
import { CurrencyProvider } from '@/context/currency-context'

// latin-ext даёт ₸ (U+20B8) и прочие валютные глифы — раньше ради них тянули
// дополнительный CSS с fonts.googleapis.com. Веса — только реально используемые
// (100/200/300 у Inter и 800 у mono в разметке не встречаются).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

// ВАЖНО: переменная называется --font-jetbrains, а не --font-mono.
// --font-mono — это токен Tailwind @theme; при совпадении имён в globals.css
// получалась циклическая ссылка `--font-mono: var(--font-mono)`, переменная не
// резолвилась, и моно-шрифт приходилось хардкодить по имени семейства.
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '6sotok.kz — Земля и бизнес в Казахстане',
  description: 'Маркетплейс земельных участков и готового бизнеса в Казахстане. Напрямую от собственников и проверенных агентств.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans selection:bg-primary-soft selection:text-primary-dark" suppressHydrationWarning>
        <AuthProvider>
          <CurrencyProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
