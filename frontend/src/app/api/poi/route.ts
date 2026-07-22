import { NextRequest, NextResponse } from 'next/server'
import { fetchLocationDataCached } from '@/lib/poi'

/**
 * POI вокруг точки для карточки объявления. Клиент дёргает этот роут после
 * загрузки страницы, чтобы медленный Overpass (7–9 с, часто 429/504) не держал
 * TTFB самой карточки. Успешный результат закеширован на сутки в lib/poi.ts,
 * поэтому платит им только первый посетитель конкретного объявления.
 */
export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'))
  const lng = Number(request.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ mapPOIs: [], travel: [] }, { status: 400 })
  }

  // округление до ~100 м: соседние объявления в одном посёлке делят кеш
  const key = (n: number) => Math.round(n * 1000) / 1000

  try {
    const data = await fetchLocationDataCached(key(lat), key(lng))
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch {
    // Overpass не ответил. Отдаём пустой блок, но БЕЗ кеш-заголовков: иначе CDN
    // прибьёт неудачу на сутки и POI у объявления не появятся, сколько ни
    // перезагружай (ровно это и случилось при первом деплое).
    return NextResponse.json({ mapPOIs: [], travel: [] }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
