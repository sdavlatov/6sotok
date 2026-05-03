import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '6sotok.kz — Маркетплейс земельных участков Казахстана',
  description: 'Покупка и продажа земельных участков в Казахстане. Напрямую от собственников и проверенных агентств.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-primary-soft selection:text-primary-dark">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
