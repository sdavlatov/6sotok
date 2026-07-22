import { NextRequest, NextResponse } from 'next/server'
import { getListingById } from '@/lib/api'

/**
 * Точечная выборка объявлений по списку id — для «Избранного», которое хранит
 * id в localStorage.
 *
 * Лежит на /api/listings/by-ids, а НЕ на /api/listings: статический роут по
 * последнему пути перекрывал бы catch-all Payload'а `(payload)/api/[...slug]`,
 * из-за чего ломались POST (подача объявления) и GET с `where` (личный кабинет).
 */
export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) return NextResponse.json([])
  const idList = ids.split(',').filter(Boolean).slice(0, 50)
  const listings = (await Promise.all(idList.map(id => getListingById(id)))).filter(Boolean)
  return NextResponse.json(listings)
}
