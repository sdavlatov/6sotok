import { NextResponse } from 'next/server'

/**
 * Курс USD→KZT для хедера и всех цен.
 *
 * Раньше браузер ходил на nationalbank.kz напрямую: запрос падал по CORS на
 * каждой странице у каждого посетителя, и только после этого шёл фолбэк на
 * open.er-api.com — два лишних round-trip'а до появления цен. Теперь всё
 * происходит на сервере и кешируется, клиенту остаётся один быстрый запрос.
 */

export const revalidate = 3600

type Fx = { usdKzt: number; t: number; src: string }

const FALLBACK: Fx = { usdKzt: 525, t: 0, src: 'fallback' }

async function fromNationalBank(): Promise<number | null> {
  const d = new Date()
  const fdate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  const r = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${fdate}`, {
    next: { revalidate: 3600 },
  })
  if (!r.ok) return null
  const xml = await r.text()
  // Без DOMParser (его нет в node-рантайме) — RSS плоский, регулярки достаточно.
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = m[1]
    const title = /<title>\s*(?:<!\[CDATA\[)?\s*([^<\]]+)/.exec(item)?.[1]?.trim().toUpperCase()
    if (title !== 'USD') continue
    const desc = /<description>\s*(?:<!\[CDATA\[)?\s*([^<\]]+)/.exec(item)?.[1]?.trim()
    const v = parseFloat((desc ?? '').replace(',', '.'))
    return Number.isFinite(v) && v > 0 ? v : null
  }
  return null
}

async function fromErApi(): Promise<number | null> {
  const r = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 3600 } })
  if (!r.ok) return null
  const j = await r.json()
  const kzt = j?.rates?.KZT
  return typeof kzt === 'number' && kzt > 0 ? Math.round(kzt * 100) / 100 : null
}

export async function GET() {
  let fx: Fx = FALLBACK

  try {
    const nbk = await fromNationalBank()
    if (nbk) fx = { usdKzt: nbk, t: Date.now(), src: 'nbk' }
  } catch { /* пойдём в резерв */ }

  if (fx.src === 'fallback') {
    try {
      const auto = await fromErApi()
      if (auto) fx = { usdKzt: auto, t: Date.now(), src: 'auto' }
    } catch { /* останется fallback */ }
  }

  if (fx.src === 'fallback') fx = { ...FALLBACK, t: Date.now() }

  return NextResponse.json(fx, {
    headers: {
      // час в CDN + сутки stale — курс не тот показатель, ради которого стоит
      // держать посетителя в ожидании.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
