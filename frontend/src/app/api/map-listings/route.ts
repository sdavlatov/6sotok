import { NextResponse } from 'next/server'
import { getListings } from '@/lib/api'

export async function GET() {
  const listings = await getListings({ limit: '500' })
  const data = listings.map(l => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    area: l.area,
    location: l.location,
    image: l.image,
    lat: l.lat,
    lng: l.lng,
    landType: l.landType,
    purpose: l.purpose,
    hasElectricity: l.hasElectricity,
    hasGas: l.hasGas,
    hasWater: l.hasWater,
    hasSewer: l.hasSewer,
    hasRoadAccess: l.hasRoadAccess,
    isPledged: l.isPledged,
    isOnRedLine: l.isOnRedLine,
    isDivisible: l.isDivisible,
  }))
  return NextResponse.json(data)
}
