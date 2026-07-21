import { getListingById, getListings } from '@/lib/api';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { SLUG_LANDTYPE, listingUrl } from '@/lib/listing-url';
import { ViewTracker } from '@/components/listings/view-tracker';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ListingView, type PdpData, type PdpSimilar, type PdpTravel } from './listing-view';
import type { MapPOI } from '@/components/listings/listing-map';
import type { Listing } from '@/types/listing';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

/* ─── POI / расстояния (Overpass) ─────────────────────────────────────────── */
const POI_TYPES: Record<string, { label: string; dot: string }> = {
  school:       { label: 'Школа',       dot: '#18181b' },
  hospital:     { label: 'Больница',    dot: '#18181b' },
  clinic:       { label: 'Клиника',     dot: '#18181b' },
  pharmacy:     { label: 'Аптека',      dot: '#18181b' },
  supermarket:  { label: 'Супермаркет', dot: '#18181b' },
  kindergarten: { label: 'Детсад',      dot: '#18181b' },
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`; }
function fmtMin(m: number) { return m < 500 ? `${Math.max(1, Math.round(m / 80))} мин` : `${Math.max(1, Math.round(m / 600))} мин`; }

interface LocationData { mapPOIs: MapPOI[]; travel: PdpTravel[] }

async function fetchLocationData(lat: number, lng: number): Promise<LocationData> {
  try {
    const q = `[out:json][timeout:20];(
node[amenity~"^(school|hospital|clinic|pharmacy|kindergarten)$"](around:3000,${lat},${lng});
node[shop=supermarket](around:3000,${lat},${lng});
node[aeroway=aerodrome](around:120000,${lat},${lng});
way[highway~"^(trunk|primary|motorway)$"](around:5000,${lat},${lng});
);out center;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(q)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': '6sotok-kz/1.0' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return { mapPOIs: [], travel: [] };
    const data = await res.json();
    if (!data.elements?.length) return { mapPOIs: [], travel: [] };

    const seen = new Set<string>();
    const mapPOIs: MapPOI[] = [];
    let airport: { dist: number; name: string } | null = null;
    let school: { dist: number } | null = null;
    let clinic: { dist: number; label: string } | null = null;
    let road: { dist: number } | null = null;

    for (const el of data.elements as any[]) {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) continue;
      const dist = haversine(lat, lng, elLat, elLon);
      const aeroway = el.tags?.aeroway;
      const highway = el.tags?.highway;
      const amenity = el.tags?.amenity || el.tags?.shop;

      if (aeroway === 'aerodrome') {
        const name = el.tags?.iata ? `Аэропорт ${el.tags.iata}` : (el.tags?.name || 'Аэропорт');
        if (!airport || dist < airport.dist) airport = { dist, name };
        continue;
      }
      if (highway) { if (!road || dist < road.dist) road = { dist }; continue; }

      const type = POI_TYPES[amenity];
      if (!type) continue;
      const key = `${amenity}-${Math.round(dist / 100)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      mapPOIs.push({ lat: elLat, lng: elLon, label: `${type.label} · ${fmtDist(dist)}`, dot: type.dot });
      if (amenity === 'school' && (!school || dist < school.dist)) school = { dist };
      if ((amenity === 'hospital' || amenity === 'clinic') && (!clinic || dist < clinic.dist)) {
        clinic = { dist, label: amenity === 'hospital' ? 'Больница' : 'Поликлиника' };
      }
    }
    mapPOIs.sort((a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng));

    const travel: PdpTravel[] = [];
    if (airport) travel.push({ label: airport.name, value: fmtMin(airport.dist) });
    if (school) travel.push({ label: 'Школа', value: fmtDist(school.dist) });
    if (clinic) travel.push({ label: clinic.label, value: fmtDist(clinic.dist) });
    if (road) travel.push({ label: 'Трасса', value: fmtDist(road.dist) });

    return { mapPOIs: mapPOIs.slice(0, 8), travel };
  } catch { return { mapPOIs: [], travel: [] }; }
}

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
  const loc = hasMap ? await fetchLocationData(listing.lat!, listing.lng!) : { mapPOIs: [], travel: [] };

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
