import Link from 'next/link'
import { LineChart, ArrowRight } from 'lucide-react'
import { Container } from '@/components/layout/container'

export const metadata = {
  title: 'Аналитика рынка — 6sotok.kz',
  description: 'Аналитика цен на земельные участки по городам и районам Казахстана. Скоро.',
}

export default function AnalyticsPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center bg-[var(--paper)]">
      <Container>
        <div className="mx-auto max-w-xl py-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-2xl bg-primary-soft p-4">
            <LineChart className="size-8 text-primary" />
          </div>
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            Скоро
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[var(--ink-900)] sm:text-4xl">
            Аналитика рынка земли
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-500)]">
            Средние цены за сотку по городам и районам, динамика рынка и отчёты по участкам.
            Готовим раздел — скоро откроем.
          </p>
          <Link
            href="/catalog"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Пока — смотреть участки
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </div>
  )
}
