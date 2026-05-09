import { getPayload } from 'payload'
import config from '@payload-config'
import type { Listing } from '@/types/listing'

interface PayloadMedia {
  url?: string
  mimeType?: string
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
  plotBoundary?: string
  dealType?: string
  views?: number
  locationType?: string[]
  listingCategory?: string
  businessType?: string
  buildingArea?: number
  floor?: number
  totalFloors?: number
  ceilingHeight?: number
  yearBuilt?: number
  condition?: string
  electricPower?: number
  hasParking?: boolean
  hasSeparateEntrance?: boolean
  isOperational?: boolean
  isTenanted?: boolean
  monthlyRevenue?: number
  paybackMonths?: number
  sellerName?: string
  sellerPhone?: string
  sellerHasWhatsApp?: boolean
  sellerIsAgency?: boolean
}

const VIDEO_RE = /\.(mp4|mov|webm|ogv|m4v)$/i

function mapListing(p: PayloadListing): Listing {
  const allMediaUrls = (p.images ?? [])
    .map(i => i.image)
    .filter((m): m is PayloadMedia => !!m?.url)

  const imageUrls = allMediaUrls
    .filter(m => !m.mimeType?.startsWith('video/') && !VIDEO_RE.test(m.url ?? ''))
    .map(m => m.url as string)

  const videoUrls = allMediaUrls
    .filter(m => m.mimeType?.startsWith('video/') || VIDEO_RE.test(m.url ?? ''))
    .map(m => m.url as string)

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
    videos: videoUrls,
    communications,
    description: typeof p.description === 'string' ? p.description : undefined,
    createdAt: p.createdAt,
    views: p.views ?? 0,
    locationType: p.locationType,
    dealType: (p.dealType as Listing['dealType']) ?? 'sale',
    listingCategory: (p.listingCategory as Listing['listingCategory']) ?? 'land',
    businessType: p.businessType as Listing['businessType'],
    buildingArea: p.buildingArea,
    address: p.address,
    floor: p.floor,
    totalFloors: p.totalFloors,
    ceilingHeight: p.ceilingHeight,
    yearBuilt: p.yearBuilt,
    condition: p.condition as Listing['condition'],
    electricPower: p.electricPower,
    hasParking: p.hasParking,
    hasSeparateEntrance: p.hasSeparateEntrance,
    isOperational: p.isOperational,
    isTenanted: p.isTenanted,
    monthlyRevenue: p.monthlyRevenue,
    paybackMonths: p.paybackMonths,
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
    plotBoundary: p.plotBoundary,
    seller: p.sellerName ? {
      name: p.sellerName,
      phone: p.sellerPhone ?? '',
      isAgency: p.sellerIsAgency ?? false,
      hasWhatsApp: p.sellerHasWhatsApp ?? false,
      registerDate: '',
    } : undefined,
  }
}

async function payload() {
  return getPayload({ config })
}

export async function getListings(params: Record<string, string> = {}): Promise<Listing[]> {
  try {
    const limit = parseInt(params.limit ?? '100')
    const p = await payload()
    const result = await p.find({
      collection: 'listings',
      where: {
        and: [
          { status: { equals: 'published' } },
          { or: [
            { listingCategory: { equals: 'land' } },
            { listingCategory: { exists: false } },
          ]},
        ],
      },
      limit,
      depth: 1,
    })
    return (result.docs as unknown as PayloadListing[]).map(mapListing)
  } catch {
    return []
  }
}

export async function getBusinessListings(): Promise<Listing[]> {
  try {
    const p = await payload()
    const result = await p.find({
      collection: 'listings',
      where: {
        and: [
          { status: { equals: 'published' } },
          { listingCategory: { equals: 'business' } },
        ],
      },
      limit: 200,
      depth: 1,
    })
    return (result.docs as unknown as PayloadListing[]).map(mapListing)
  } catch {
    return []
  }
}

export async function getListingById(id: string): Promise<Listing | null> {
  try {
    const p = await payload()
    const doc = await p.findByID({
      collection: 'listings',
      id,
      depth: 1,
    })
    if (!doc?.id) return null
    return mapListing(doc as unknown as PayloadListing)
  } catch {
    return null
  }
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const p = await payload()
  const result = await p.find({
    collection: 'listings',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'published' } },
      ],
    },
    depth: 1,
    limit: 1,
  })
  if (!result.docs?.length) return null
  return mapListing(result.docs[0] as unknown as PayloadListing)
}
