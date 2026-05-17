import { NextRequest, NextResponse } from 'next/server'
import { getListingById } from '@/lib/api'

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) return NextResponse.json([])
  const idList = ids.split(',').filter(Boolean).slice(0, 50)
  const listings = (await Promise.all(idList.map(id => getListingById(id)))).filter(Boolean)
  return NextResponse.json(listings)
}
