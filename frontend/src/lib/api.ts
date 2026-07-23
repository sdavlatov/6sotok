import { getPayload, type Where } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import type { Listing } from '@/types/listing'
import { LISTINGS_TAG } from './cache-tags'

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
  isFeatured?: boolean
  isUrgent?: boolean
  oldPrice?: number
  promoUntil?: string
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
    isFeatured: p.isFeatured ?? false,
    isUrgent: p.isUrgent ?? false,
    oldPrice: p.oldPrice,
    promoUntil: p.promoUntil,
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

/**
 * Тег кеша объявлений. Все чтения ниже помечены им, а хук afterChange/afterDelete
 * в коллекции Listings дёргает revalidateTag(LISTINGS_TAG) — поэтому новое или
 * отредактированное объявление появляется на сайте сразу, не дожидаясь TTL.
 */
export { LISTINGS_TAG }

/** TTL как страховка на случай правок мимо Payload (SQL-правка в Neon и т.п.). */
const LISTINGS_TTL = 300

const LAND_WHERE: Where = {
  and: [
    { status: { equals: 'published' } },
    { or: [
      { listingCategory: { equals: 'land' } },
      { listingCategory: { exists: false } },
    ]},
  ],
}

const BUSINESS_WHERE: Where = {
  and: [
    { status: { equals: 'published' } },
    { listingCategory: { equals: 'business' } },
  ],
}

export const getListings = unstable_cache(
  async (params: Record<string, string> = {}): Promise<Listing[]> => {
    try {
      const limit = parseInt(params.limit ?? '100')
      const p = await payload()
      const result = await p.find({
        collection: 'listings',
        where: LAND_WHERE,
        limit,
        depth: 1,
      })
      return (result.docs as unknown as PayloadListing[]).map(mapListing)
    } catch {
      return []
    }
  },
  ['listings-land'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)

/** Счётчики для главной — без выгрузки самих документов. */
export const getListingCounts = unstable_cache(
  async (): Promise<{ land: number; business: number }> => {
    try {
      const p = await payload()
      const [land, business] = await Promise.all([
        p.count({ collection: 'listings', where: LAND_WHERE }),
        p.count({ collection: 'listings', where: BUSINESS_WHERE }),
      ])
      return { land: land.totalDocs, business: business.totalDocs }
    } catch {
      return { land: 0, business: 0 }
    }
  },
  ['listings-counts'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)

/** Уникальные локации (для счётчика «городов» на главной) — только поле location. */
export const getListingLocations = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const p = await payload()
      const result = await p.find({
        collection: 'listings',
        where: { status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        select: { location: true },
      })
      const set = new Set<string>()
      for (const d of result.docs as unknown as { location?: string }[]) {
        if (d.location) set.add(d.location)
      }
      return [...set]
    } catch {
      return []
    }
  },
  ['listings-locations'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)

/**
 * Списочные страницы (каталог, витрина бизнеса) показывают карточки, но не
 * описания — а описание самое тяжёлое поле объявления (до 1500–2000 знаков) и
 * уезжало в RSC-пейлоад впустую. Карточка объявления и /business/[slug] берут
 * данные через getListingById/getListingBySlug и описание получают полностью.
 */
export function stripDescription(listings: Listing[]): Listing[] {
  return listings.map(l => (l.description === undefined ? l : { ...l, description: undefined }))
}

export const getBusinessListings = unstable_cache(
  async (): Promise<Listing[]> => {
    try {
      const p = await payload()
      const result = await p.find({
        collection: 'listings',
        where: BUSINESS_WHERE,
        limit: 200,
        depth: 1,
      })
      return (result.docs as unknown as PayloadListing[]).map(mapListing)
    } catch {
      return []
    }
  },
  ['listings-business'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)

export const getListingById = unstable_cache(
  async (id: string): Promise<Listing | null> => {
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
  },
  ['listing-by-id'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)

export const getListingBySlug = unstable_cache(
  async (slug: string): Promise<Listing | null> => {
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
  },
  ['listing-by-slug'],
  { tags: [LISTINGS_TAG], revalidate: LISTINGS_TTL },
)
