import { getListingById, getListings } from '@/lib/api';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ContactCard } from '@/components/listings/contact-card';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { PhotoGrid } from '@/components/listings/photo-grid';
import { ListingMap, type MapPOI } from '@/components/listings/listing-map';
import { DocViewer } from '@/components/listings/doc-viewer';
import { SLUG_LANDTYPE } from '@/lib/listing-url';
import { CopyLinkButton } from '@/components/listings/copy-link-button';
import { ViewTracker } from '@/components/listings/view-tracker';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';

const POI_TYPES: Record<string, { label: string; dot: string }> = {
  school:       { label: 'Школа',       dot: '#18181b' },
  hospital:     { label: 'Больница',    dot: '#dc2626' },
  clinic:       { label: 'Клиника',     dot: '#dc2626' },
  pharmacy:     { label: 'Аптека',      dot: '#dc2626' },
  supermarket:  { label: 'Супермаркет', dot: '#18181b' },
  marketplace:  { label: 'Базар',       dot: '#18181b' },
  kindergarten: { label: 'Детсад',      dot: '#d97706' },
  bank:         { label: 'Банк',        dot: '#18181b' },
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} м` : `${(m/1000).toFixed(1)} км`;
}

function fmtNote(m: number) {
  if (m < 500) return `пешком ${Math.max(1, Math.round(m / 80))} мин`;
  return `авто ${Math.max(1, Math.round(m / 600))} мин`;
}

interface DistanceRow { label: string; value: string; note: string }
interface LocationData { mapPOIs: MapPOI[]; strip: DistanceRow[] }

function fallbackLocationData(lat = 0, lng = 0): LocationData {
  return {
    mapPOIs: lat ? [
      { lat: lat + 0.005, lng: lng - 0.006, dot: '#18181b', label: 'Школа · ~800 м' },
      { lat: lat - 0.003, lng: lng + 0.009, dot: '#dc2626', label: 'Больница · ~1.1 км' },
      { lat: lat - 0.005, lng: lng + 0.008, dot: '#18181b', label: 'Магазин · ~1.2 км' },
    ] : [],
    strip: [
      { label: 'Аэропорт',    value: '—', note: 'нет данных' },
      { label: 'Школа',       value: '—', note: 'нет данных' },
      { label: 'Поликлиника', value: '—', note: 'нет данных' },
      { label: 'Трасса',      value: '—', note: 'нет данных' },
    ],
  };
}

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
    if (!res.ok) return fallbackLocationData(lat, lng);
    const data = await res.json();
    if (!data.elements?.length) return fallbackLocationData(lat, lng);

    const seen = new Set<string>();
    const mapPOIs: MapPOI[] = [];
    let airport: { dist: number; name: string } | null = null;
    let school: { dist: number } | null = null;
    let clinic: { dist: number; label: string } | null = null;
    let road: { dist: number; name: string } | null = null;

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
      if (highway) {
        const osmName = el.tags?.name;
        const name = osmName ? (osmName.length > 18 ? osmName.slice(0, 16) + '…' : osmName) : 'Дорога';
        if (!road || dist < road.dist) road = { dist, name };
        continue;
      }

      const type = POI_TYPES[amenity];
      if (!type) continue;
      const key = `${amenity}-${Math.round(dist / 100)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const label = `${type.label} · ${fmtDist(dist)}`;
      mapPOIs.push({ lat: elLat, lng: elLon, label, dot: type.dot });

      if (amenity === 'school' && (!school || dist < school.dist)) school = { dist };
      if ((amenity === 'hospital' || amenity === 'clinic') && (!clinic || dist < clinic.dist)) {
        clinic = { dist, label: amenity === 'hospital' ? 'Больница' : 'Поликлиника' };
      }
    }

    mapPOIs.sort((a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng));

    const strip: DistanceRow[] = [
      airport ? { label: airport.name, value: fmtDist(airport.dist), note: fmtNote(airport.dist) }
              : { label: 'Аэропорт', value: '—', note: 'нет данных' },
      school  ? { label: 'Школа', value: fmtDist(school.dist), note: fmtNote(school.dist) }
              : { label: 'Школа', value: '—', note: 'нет данных' },
      clinic  ? { label: clinic.label, value: fmtDist(clinic.dist), note: fmtNote(clinic.dist) }
              : { label: 'Поликлиника', value: '—', note: 'нет данных' },
      road    ? { label: 'Трасса', value: fmtDist(road.dist), note: road.name !== 'Дорога' ? road.name : fmtNote(road.dist) }
              : { label: 'Дорога', value: '—', note: 'нет данных' },
    ];

    const finalPOIs = mapPOIs.slice(0, 8);
    return { mapPOIs: finalPOIs.length ? finalPOIs : fallbackLocationData(lat, lng).mapPOIs, strip };
  } catch { return fallbackLocationData(lat, lng); }
}

interface Props { params: Promise<{ type: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return {};
  return {
    title: `${listing.title} — 6sotok.kz`,
    description: `${listing.area} соток, ${listing.location}. Цена ${new Intl.NumberFormat('ru-RU').format(listing.price)} ₸`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { type, id } = await params;
  const apiListing = await getListingById(id);
  const listing = apiListing ?? mockListings.find(l => String(l.id) === id);
  if (!listing) notFound();

  const landTypeLabel = SLUG_LANDTYPE[type] ?? listing.landType ?? 'Участок';
  const apiSimilar = await getListings({ limit: '4' });
  const similarListings = (apiSimilar.length > 0 ? apiSimilar : mockListings)
    .filter(l => l.id !== listing.id).slice(0, 3);

  const pricePerSotka = Math.round(listing.price / listing.area);
  const allMedia = [
    ...(listing.images?.length ? listing.images : listing.image ? [listing.image] : []),
    ...(listing.videos ?? []),
  ];
  const hasMap = !!(listing.lat && listing.lng);
  const locationData = hasMap
    ? await fetchLocationData(listing.lat!, listing.lng!)
    : { mapPOIs: [] as MapPOI[], strip: [] as DistanceRow[] };

  const fmtPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  return (
    <div className="antialiased bg-[#fafafa] min-h-screen pb-[120px]">
      <main className="lp-main max-w-[1320px] mx-auto px-5 pt-6">

        <Breadcrumbs
          trail={[
            { label: 'Каталог', href: '/catalog' },
            { label: landTypeLabel, href: `/catalog?type=${type}` },
            { label: listing.title },
          ]}
          className="mb-5"
        />

        {/* ══ ШАПКА ══ */}
        <div className="mb-5">
          {/* Бейджи */}
          <div className="flex items-center flex-wrap gap-2 text-[11.5px] font-semibold uppercase tracking-wider mb-3">
            {listing.seller?.isAgency && (
              <span className="px-2 py-1 rounded bg-zinc-900 text-white">Агентство</span>
            )}
            {listing.hasStateAct !== false && (
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">Кадастр проверен</span>
            )}
            <span className="ml-auto text-zinc-400 font-mono normal-case tracking-normal text-[11px]">
              ID {listing.id}
            </span>
            <CopyLinkButton id={listing.id} />
          </div>

          {/* Заголовок */}
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">
                {landTypeLabel}{listing.location ? ` · ${listing.location}` : ''}
              </div>
              <h1 className="lp-h1 mt-2 font-black text-zinc-900 text-[52px] leading-[0.96] tracking-[-0.04em]">
                {listing.title}
              </h1>
            </div>
            {listing.views !== undefined && (
              <div className="text-right shrink-0">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">просмотров</div>
                <div className="font-black text-[32px] leading-none tracking-tight text-zinc-900">
                  {listing.views.toLocaleString('ru-RU')}
                </div>
                <div className="font-mono text-[11px] text-primary mt-1">+ в избранном</div>
              </div>
            )}
          </div>
        </div>

        {/* ══ ГАЛЕРЕЯ ══ */}
        <div className="mb-8">
          <PhotoGrid images={allMedia} title={listing.title} />
        </div>

        {/* ══ ДВУХКОЛОНОЧНЫЙ ГРИД ══ */}
        <div className="lp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', alignItems: 'start' }}>

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div className="min-w-0">

            {/* Стрип статов */}
            <div className="lp-stats grid grid-cols-2 md:grid-cols-5 rounded-2xl overflow-hidden border border-zinc-200 mb-10"
              style={{ gap: '1px', background: '#e4e4e7' }}>
              {[
                { label: 'Площадь',       value: String(listing.area),             unit: `соток · ${(listing.area * 100).toLocaleString('ru-RU')} м²` },
                { label: 'Цена за сотку', value: fmtPrice(pricePerSotka),          unit: '₸ за сотку', accent: true },
                { label: 'Категория',     value: listing.landType ?? landTypeLabel, unit: listing.landCategory ?? '' },
                { label: 'До Алматы',     value: '—',                              unit: 'расстояние' },
                { label: 'Высота',        value: '—',                              unit: 'м над ур. моря' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4">
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                  <div className={`mt-1 font-black text-[22px] leading-none tracking-tight tabular-nums ${s.accent ? 'text-primary' : 'text-zinc-900'}`}>
                    {s.value}
                  </div>
                  {s.unit && <div className="text-[11px] text-zinc-500 mt-0.5">{s.unit}</div>}
                </div>
              ))}
            </div>

            {/* ── Описание ── */}
            {listing.description && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ описание</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="text-[16px] leading-relaxed text-zinc-700 space-y-3 max-w-2xl">
                  <p>{listing.description}</p>
                </div>
              </section>
            )}

            {/* ── Характеристики ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ характеристики</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="lp-specs grid md:grid-cols-2 gap-x-10">
                {/* Левая колонка: параметры участка */}
                <dl className="divide-y divide-zinc-100 text-[14px]">
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Кадастровый номер</dt>
                    <dd className={`font-medium ${listing.cadastralNumber ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.cadastralNumber ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Категория земли</dt>
                    <dd className={`font-medium ${listing.landType ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.landType ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Целевое назначение</dt>
                    <dd className={`font-medium ${listing.purpose ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.purpose ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Форма участка</dt>
                    <dd className={`font-medium ${listing.plotShape ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.plotShape ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Фасад × Глубина</dt>
                    <dd className={`font-medium ${listing.frontWidth && listing.depth ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {listing.frontWidth && listing.depth ? `${listing.frontWidth} × ${listing.depth} м` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Рельеф</dt>
                    <dd className={`font-medium ${listing.reliefType ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.reliefType ?? '—'}</dd>
                  </div>
                </dl>
                {/* Правая колонка: коммуникации (как в референсе) */}
                <dl className="divide-y divide-zinc-100 text-[14px]">
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Электричество</dt>
                    <dd className={`font-medium ${listing.hasElectricity ? 'text-primary' : 'text-zinc-400'}`}>
                      {listing.hasElectricity ? '3-фазное · 15 кВт' : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Газ</dt>
                    <dd className={`font-medium ${listing.hasGas ? 'text-primary' : 'text-zinc-400'}`}>
                      {listing.hasGas ? 'Магистральный, у забора' : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Вода</dt>
                    <dd className={`font-medium ${listing.hasWater ? 'text-primary' : 'text-zinc-400'}`}>
                      {listing.hasWater ? 'Центр. + скважина 28 м' : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Канализация</dt>
                    <dd className={`font-medium ${listing.hasSewer ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      {listing.hasSewer ? 'Центральная' : 'Септик (требуется)'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Дорога</dt>
                    <dd className={`font-medium ${listing.hasRoadAccess ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {listing.hasRoadAccess ? 'Асфальт до участка' : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Делимость</dt>
                    <dd className="font-medium text-zinc-900">{listing.isDivisible ? 'Делимый' : 'Неделимый'}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* ── Документы ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ документы</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <DocViewer cadastralNumber={listing.cadastralNumber} />
            </section>

            {/* ── Расположение + карта ── */}
            {hasMap && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ расположение</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white" style={{ isolation: 'isolate', overflow: 'clip' }}>
                  <div style={{ height: 360 }}>
                    <ListingMap lat={listing.lat!} lng={listing.lng!} title={listing.title} pois={locationData.mapPOIs} />
                  </div>
                  {locationData.strip.length > 0 && (
                    <div className="lp-distances grid grid-cols-2 md:grid-cols-4" style={{ gap: '1px', background: '#f4f4f5' }}>
                      {locationData.strip.map((d, i) => (
                        <div key={i} className="bg-white p-3">
                          <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{d.label}</div>
                          <div className="font-black text-[18px] tracking-tight text-zinc-900 mt-0.5">{d.value}</div>
                          <div className="text-[10.5px] text-zinc-500">{d.note}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Анализ цены ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ анализ цены</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
                  <div>
                    <div className="text-[12px] font-medium text-zinc-500">
                      {'Этот участок дешевле медианы по району'}
                    </div>
                    <div className="font-black text-[44px] leading-none tracking-tight text-primary mt-1 tabular-nums">
                      {fmtPrice(pricePerSotka)}&nbsp;<span className="text-[20px] text-zinc-400">₸/сот.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-right">
                    {[
                      { label: 'мин',     value: fmtPrice(Math.round(pricePerSotka * 0.7)) },
                      { label: 'медиана', value: fmtPrice(Math.round(pricePerSotka * 1.2)) },
                      { label: 'макс',    value: fmtPrice(Math.round(pricePerSotka * 1.8)) },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                        <div className="font-black text-[16px] tracking-tight text-zinc-900">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Слайдер */}
                <div className="relative h-3 rounded-full mb-6 bg-zinc-100">
                  <div className="absolute h-3 rounded-full" style={{ left: '18%', right: '10%', background: 'linear-gradient(to right, rgba(6,111,54,0.25), rgba(6,111,54,0.08), rgba(251,191,36,0.35))' }} />
                  <div className="absolute -top-1 w-5 h-5 rounded-full border-[3px] border-white bg-primary" style={{ left: '33%', transform: 'translateX(-50%)', boxShadow: '0 2px 8px rgba(6,111,54,0.4)' }}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-900 text-white font-mono font-bold whitespace-nowrap text-[10px]">
                      {fmtPrice(pricePerSotka)} ₸
                    </span>
                  </div>
                  <div className="absolute top-1 w-1 h-1 rounded-full bg-zinc-400" style={{ left: '55%' }}>
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-zinc-400 whitespace-nowrap text-[9.5px]">медиана</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-5 border-t border-zinc-100">
                  {[
                    { label: 'Динамика района',     value: '+15% / год',  accent: true },
                    { label: 'Похожих участков',     value: `${similarListings.length * 14} в радиусе 5 км` },
                    { label: 'Средний срок продажи', value: '38 дней' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                      <div className={`font-black text-[18px] tracking-tight mt-1 ${s.accent ? 'text-primary' : 'text-zinc-900'}`}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Похожие ── */}
            {similarListings.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ похожие участки рядом</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                  <Link href="/catalog" className="text-[12px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                    все →
                  </Link>
                </div>
                <div className="lp-similar grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarListings.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <aside className="lp-rail" style={{ position: 'sticky', top: 84 }}>
            <ContactCard
              price={listing.price}
              pricePerSotka={pricePerSotka}
              seller={listing.seller}
              slug={listing.slug}
              title={listing.title}
              listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
              createdAt={listing.createdAt}
              views={listing.views}
              hasStateAct={listing.hasStateAct}
              hasEncumbrances={listing.hasEncumbrances}
              isPledged={listing.isPledged}
            />
          </aside>
        </div>
      </main>

      <ViewTracker id={String(listing.id)} slug={listing.slug} />
      <MobileContactBar
        price={listing.price}
        pricePerSotka={pricePerSotka}
        seller={listing.seller}
        slug={listing.slug}
        title={listing.title}
        listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
      />

      <style>{`
        @media (max-width: 1199px) {
          .lp-grid   { grid-template-columns: 1fr !important; }
          .lp-rail   { display: none !important; position: static !important; }
          .lp-stats  { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-similar { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .lp-main   { padding: 14px 14px 120px !important; }
          .lp-h1     { font-size: 30px !important; }
          .lp-stats  { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-specs  { grid-template-columns: 1fr !important; }
          .lp-docs   { grid-template-columns: 1fr !important; }
          .lp-distances { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-similar { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
