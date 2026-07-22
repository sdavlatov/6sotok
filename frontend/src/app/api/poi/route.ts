import { NextRequest, NextResponse } from 'next/server'
import { fetchLocationData } from '@/lib/poi'

/**
 * POI вокруг точки для карточки объявления. Клиент дёргает этот роут после
 * загрузки страницы, чтобы медленный Overpass (7–9 с, часто 429/504) не держал
 * TTFB самой карточки. Результат закеширован на сутки в lib/poi.ts, поэтому
 * платит им только первый посетитель конкретного объявления.
 */
export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'))
  const lng = Number(request.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ mapPOIs: [], travel: [] }, { status: 400 })
  }

  // округление до ~100 м: соседние объявления в одном посёлке делят кеш
  const key = (n: number) => Math.round(n * 1000) / 1000
  const data = await fetchLocationData(key(lat), key(lng))

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
