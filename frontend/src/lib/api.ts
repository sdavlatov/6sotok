import type { Listing } from '@/types/listing'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface PayloadMedia {
  url?: string
}

interface PayloadListing {
  id: string
  slug: string
  title: string
  price: number
  area: number
  landType: string
  location: string
  address?: string
  lat?: number
  lng?: number
  description?: unknown
  status: string
  createdAt: string
  images?: { image?: PayloadMedia }[]
  hasElectricity?: boolean
  hasGas?: boolean
  hasWater?: boolean
  hasSewer?: boolean
  hasRoadAccess?: boolean
  cadastralNumber?: string
  ownershipType?: string
  purpose?: string
  hasStateAct?: boolean
  isPledged?: boolean
  hasEncumbrances?: boolean
  isDivisible?: boolean
  isOnRedLine?: boolean
  canChangePurpose?: boolean
  landCategory?: string
  reliefType?: string
  plotShape?: string
  frontWidth?: number
  depth?: number
  isNegotiable?: boolean
  locationType?: string[]
  sellerName?: string
  sellerPhone?: string
  sellerHasWhatsApp?: boolean
  sellerIsAgency?: boolean
}

function mapListing(p: PayloadListing): Listing {
  const imageUrls = (p.images ?? [])
    .map(i => i.image?.url)
    .filter(Boolean) as string[]

  const communications: string[] = []
  if (p.hasElectricity) communications.push('Свет')
  if (p.hasGas) communications.push('Газ')
  if (p.hasWater) communications.push('Вода')
  if (p.hasSewer) communications.push('Канализация')
  if (p.hasRoadAccess) communications.push('Дорога')

  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    price: p.price,
    area: p.area,
    landType: p.landType as Listing['landType'],
    location: p.location,
    image: imageUrls[0] ?? '',
    images: imageUrls,
    communications,
    description: typeof p.description === 'string' ? p.description : undefined,
    createdAt: p.createdAt,
    isNegotiable: p.isNegotiable,
    locationType: p.locationType,
    lat: p.lat,
    lng: p.lng,
    cadastralNumber: p.cadastralNumber,
    ownershipType: p.ownershipType as Listing['ownershipType'],
    purpose: p.purpose as Listing['purpose'],
    hasStateAct: p.hasStateAct,
    isPledged: p.isPledged,
    hasEncumbrances: p.hasEncumbrances,
    isDivisible: p.isDivisible,
    isOnRedLine: p.isOnRedLine,
    canChangePurpose: p.canChangePurpose,
    landCategory: p.landCategory,
    hasElectricity: p.hasElectricity,
    hasGas: p.hasGas,
    hasWater: p.hasWater,
    hasSewer: p.hasSewer,
    hasRoadAccess: p.hasRoadAccess,
    reliefType: p.reliefType as Listing['reliefType'],
    plotShape: p.plotShape,
    frontWidth: p.frontWidth,
    depth: p.depth,
    seller: p.sellerName ? {
      name: p.sellerName,
      phone: p.sellerPhone ?? '',
      isAgency: p.sellerIsAgency ?? false,
      hasWhatsApp: p.sellerHasWhatsApp ?? false,
      registerDate: '',
    } : undefined,
  }
}

export async function getListings(params: Record<string, string> = {}): Promise<Listing[]> {
  const qs = new URLSearchParams({
    'where[status][equals]': 'published',
    limit: '100',
    depth: '1',
    ...params,
  })
  const res = await fetch(`${API_BASE}/api/listings?${qs}`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.docs as PayloadListing[]).map(mapListing)
}

export async function getListingById(id: string): Promise<Listing | null> {
  const res = await fetch(`${API_BASE}/api/listings/${id}?depth=1`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.id) return null
  return mapListing(data as PayloadListing)
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const qs = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '1',
    limit: '1',
  })
  const res = await fetch(`${API_BASE}/api/listings?${qs}`, { next: { revalidate: 60 } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.docs?.length) return null
  return mapListing(data.docs[0] as PayloadListing)
}
