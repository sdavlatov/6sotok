import { getListingById, getListings } from '@/lib/api';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { SLUG_LANDTYPE, listingUrl } from '@/lib/listing-url';
import { ViewTracker } from '@/components/listings/view-tracker';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ListingView, type PdpData, type PdpSimilar } from './listing-view';
import type { Listing } from '@/types/listing';
import type { Metadata } from 'next';

export const revalidate = 300;

/* ─── Расстояние до похожих объявлений ───────────────────────────────────── */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`; }

/* ─── Форматтеры ──────────────────────────────────────────────────────────── */
function mlnPrice(n: number): string {
  const m = n / 1_000_000;
  if (m >= 1) return `${(Math.round(m * 10) / 10).toLocaleString('ru-RU')} млн ₸`;
  return `${new Intl.NumberFormat('ru-RU').format(n)} ₸`;
}
function mlnPer(n: number): string {
  const m = n / 1_000_000;
  if (m >= 1) return `${m.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} млн / сотка`;
  return `${new Intl.NumberFormat('ru-RU').format(n)} ₸ / сотка`;
}
function fmtDate(s?: string): string {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }); }
  catch { return '—'; }
}

interface Props { params: Promise<{ type: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return {};
  return {
    title: `${listing.title} — 6sotok.kz`,
    description: `${listing.area} соток, ${listing.location}. Цена ${new Intl.NumberFormat('ru-RU').format(listing.price)} ₸`,
    openGraph: listing.image ? { images: [listing.image] } : undefined,
  };
}

export default async function ListingPage({ params }: Props) {
  const { type, id } = await params;
  const apiListing = await getListingById(id);
  const listing = apiListing ?? mockListings.find(l => String(l.id) === id);
  if (!listing) notFound();

  const landTypeLabel = SLUG_LANDTYPE[type] ?? listing.landType ?? 'Участок';
  const pool = await getListings({ limit: '100' });
  const source = pool.length > 0 ? pool : mockListings;

  /* Похожие */
  const similarRaw = source.filter(l => l.id !== listing.id).slice(0, 3);
  const similar: PdpSimilar[] = similarRaw.map((l, idx) => {
    const per = Math.round(l.price / l.area);
    const dist = listing.lat && listing.lng && l.lat && l.lng
      ? fmtDist(haversine(listing.lat, listing.lng, l.lat, l.lng)) : undefined;
    const tags: { label: string; green?: boolean }[] = [];
    if (l.hasElectricity) tags.push({ label: 'Свет' });
    if (l.hasGas) tags.push({ label: 'Газ' });
    if (l.hasStateAct) tags.push({ label: 'Акт', green: true });
    return {
      id: l.id,
      href: listingUrl(l),
      cover: l.image || undefined,
      placeholder: `plot-img-${(idx % 5) + 1}`,
      type: `${l.landType ?? 'Участок'}${l.location ? ` · ${l.location}` : ''}`,
      title: l.title,
      price: mlnPrice(l.price),
      per: mlnPer(per),
      dist,
      photos: l.images?.length || 1,
      tags: tags.slice(0, 3),
    };
  });
  const similarTotal = Math.max(similar.length, source.filter(l => l.id !== listing.id).length);

  /* Продавец: счётчик его объявлений в пуле */
  const sellerName = listing.seller?.name;
  const listingsCount = sellerName ? source.filter(l => l.seller?.name === sellerName).length : 0;

  /* Локация */
  const hasMap = !!(listing.lat && listing.lng);
  // POI больше НЕ ждём на сервере: Overpass отвечает 7–9 с и часто падает, из-за
  // чего TTFB карточки был 10–14 с. Клиент догрузит их сам через /api/poi.
  const loc = { mapPOIs: [], travel: [] };

  const utilities = [
    { key: 'el',    label: 'Электричество', on: !!listing.hasElectricity },
    { key: 'gas',   label: 'Газ',           on: !!listing.hasGas },
    { key: 'water', label: 'Вода',          on: !!listing.hasWater },
    { key: 'road',  label: 'Дорога',        on: !!listing.hasRoadAccess },
    { key: 'sewer', label: 'Канализация',   on: !!listing.hasSewer },
  ];

  const data: PdpData = {
    id: String(listing.id),
    publicId: `6S-${listing.id}`,
    type,
    title: listing.title,
    landTypeLabel,
    location: listing.location ?? '',
    publishedAt: fmtDate(listing.createdAt),

    price: listing.price,
    pricePerSotka: Math.round(listing.price / listing.area),
    area: listing.area,
    elevationM: undefined,
    purpose: listing.purpose,
    landType: listing.landType,
    landCategory: listing.landCategory,
    plotShape: listing.plotShape,
    frontWidth: listing.frontWidth,
    depth: listing.depth,
    reliefType: listing.reliefType,
    cadastralNumber: listing.cadastralNumber,
    isPledged: listing.isPledged,
    hasEncumbrances: listing.hasEncumbrances,
    hasStateAct: listing.hasStateAct,
    readyToBuild: !!(listing.hasStateAct && listing.hasElectricity),
    urgent: false,

    utilities,
    locationType: listing.locationType,

    description: listing.description,

    images: listing.images?.length ? listing.images : (listing.image ? [listing.image] : []),
    videos: listing.videos ?? [],
    videoDuration: undefined,

    hasMap,
    lat: listing.lat,
    lng: listing.lng,
    mapPOIs: loc.mapPOIs,
    travel: loc.travel,

    seller: listing.seller ? {
      name: listing.seller.name,
      phone: listing.seller.phone,
      isAgency: listing.seller.isAgency,
      hasWhatsApp: !!listing.seller.hasWhatsApp,
      registerYear: listing.createdAt ? new Date(listing.createdAt).getFullYear() : new Date().getFullYear(),
      listingsCount,
    } : null,

    similar,
    similarTotal,
    listingUrl: `https://6sotok.kz/catalog/${type}/${listing.id}`,
  };

  return (
    <>
      <div className="pdp-page">
        <div className="max-w-[1180px] mx-auto px-5 pt-6">
          <Breadcrumbs
            trail={[
              { label: 'Каталог', href: '/catalog' },
              { label: landTypeLabel, href: `/catalog?type=${type}` },
              { label: listing.title },
            ]}
          />
        </div>
      </div>
      <ListingView d={data} />
      <ViewTracker id={String(listing.id)} slug={listing.slug} />
    </>
  );
}
