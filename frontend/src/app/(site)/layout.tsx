import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
import { SiteHeader, SiteFooter } from '@/components/layout/site-chrome'
import { AuthProvider } from '@/context/auth-context'
import { CurrencyProvider } from '@/context/currency-context'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
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
        {/* Полные Inter + JetBrains Mono: даёт тонкие глифы ₸ / $ / → , которых нет
            в latin/cyrillic-сабсете next/font (иначе браузер берёт жирный системный) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
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
