import { getListingById, getListings } from '@/lib/api';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ContactCard } from '@/components/listings/contact-card';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { PhotoGrid } from '@/components/listings/photo-grid';
import { ListingMap } from '@/components/listings/listing-map';
import { SLUG_LANDTYPE } from '@/lib/listing-url';
import { CopyLinkButton } from '@/components/listings/copy-link-button';
import { ViewTracker } from '@/components/listings/view-tracker';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';

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

/* ── Typography tokens (используются по всей странице) ─────────────────────
   label:  11px / 600 / uppercase / tracking-wide / zinc-400
   value:  15px / 600 / zinc-900
   body:   15px / 400 / zinc-700
   meta:   13px / 400 / zinc-500
   ───────────────────────────────────────────────────────────────────────── */
const T = {
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--ink-400)' },
  value: { fontSize: 15, fontWeight: 600, color: 'var(--ink-900)' },
  body:  { fontSize: 15, fontWeight: 400, color: 'var(--ink-700)', lineHeight: 1.7 },
  meta:  { fontSize: 13, fontWeight: 400, color: 'var(--ink-500)' },
};

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
  const allMedia = listing.images?.length ? listing.images : listing.image ? [listing.image] : [];

  const paramRows = [
    listing.landType      && { k: 'Тип',           v: listing.landType },
    listing.purpose       && { k: 'Назначение',    v: listing.purpose },
    listing.landCategory  && { k: 'Категория',     v: listing.landCategory },
    listing.ownershipType && { k: 'Собственность', v: listing.ownershipType },
    listing.reliefType    && { k: 'Рельеф',        v: listing.reliefType },
    listing.plotShape     && { k: 'Форма',         v: listing.plotShape },
    listing.frontWidth    && { k: 'Ширина фасада', v: `${listing.frontWidth} м` },
    listing.depth         && { k: 'Глубина',       v: `${listing.depth} м` },
                             { k: 'Делимость',     v: listing.isDivisible ? 'Делимый' : 'Неделимый' },
  ].filter(Boolean).slice(0, 4) as { k: string; v: string }[];

  const comms = [
    { icon: 'bolt',  label: 'Электричество', on: !!listing.hasElectricity },
    { icon: 'drop',  label: 'Вода',          on: !!listing.hasWater },
    { icon: 'flame', label: 'Газ',           on: !!listing.hasGas },
    { icon: 'road',  label: 'Дорога',        on: !!listing.hasRoadAccess },
  ];

  const legalOk = [
    listing.hasStateAct !== false && 'Государственный акт',
    !listing.isPledged            && 'Без залога',
    !listing.hasEncumbrances      && 'Без обременений',
    !listing.isOnRedLine          && 'Без красной линии',
  ].filter(Boolean) as string[];

  const legalBad = [
    listing.hasStateAct === false && 'Нет госакта',
    listing.isPledged             && 'В залоге',
    listing.hasEncumbrances       && 'Есть обременения',
    listing.isOnRedLine           && 'Красная линия',
  ].filter(Boolean) as string[];

  const hasMap = listing.lat && listing.lng;

  const iconPath: Record<string, string> = {
    bolt:  'M13 2 3 14h7l-1 8 10-12h-7l1-8z',
    drop:  'M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z',
    flame: 'M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-6-6-11-6-11z',
    road:  'M4 22 8 2h8l4 20M12 6v3M12 13v3M12 20v0',
  };

  const pulseColor: Record<string, string> = {
    bolt:  '#facc15',
    drop:  '#22d3ee',
    flame: '#fb923c',
    road:  '#a8a29e',
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', paddingBottom: 120, fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      <div className="listing-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 64px' }}>

        {/* Breadcrumb JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://6sotok.kz' },
              { '@type': 'ListItem', position: 2, name: 'Каталог', item: 'https://6sotok.kz/catalog' },
              { '@type': 'ListItem', position: 3, name: landTypeLabel, item: `https://6sotok.kz/catalog/${type}` },
              { '@type': 'ListItem', position: 4, name: `№ ${listing.id}`, item: `https://6sotok.kz/catalog/${type}/${listing.id}` },
            ],
          })}}
        />

        {/* Breadcrumb nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <nav aria-label="Хлебные крошки" style={{ flex: 1, minWidth: 0 }}>
            <ol style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0, gap: 0 }}>
              {[
                { href: '/', label: 'Главная' },
                { href: '/catalog', label: 'Каталог' },
                { href: `/catalog/${type}`, label: landTypeLabel },
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <Link href={item.href} className="breadcrumb-link" style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-400)', textDecoration: 'none' }}>
                    {item.label}
                  </Link>
                  <span aria-hidden="true" style={{ margin: '0 6px', color: 'var(--ink-200)', fontSize: 13 }}>/</span>
                </li>
              ))}
              <li aria-current="page" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-700)' }}>
                № {listing.id}
              </li>
            </ol>
          </nav>
          <CopyLinkButton id={listing.id} />
        </div>

        {/* H1 */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="listing-h1" style={{ margin: 0, fontSize: 34, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>
            {listing.location ?? listing.title}
          </h1>
        </div>

        {/* Main grid */}
        <div className="listing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 376px', gap: 28, alignItems: 'start' }}>

          {/* Left column */}
          <div>
            <PhotoGrid images={allMedia} title={listing.title} />

            {/* Dashboard card */}
            <div style={{ marginTop: 20, borderRadius: 20, background: '#fff', border: '1px solid var(--line)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

              {/* Площадь + Параметры */}
              <div className="dashboard-top" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
                <div className="area-panel" style={{ padding: '28px 36px 28px 28px', borderRight: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, #f9fafb 0%, #fff 100%)' }}>
                  <div style={{ ...T.label, marginBottom: 8 }}>Площадь</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="area-number" style={{ fontSize: 80, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.03em', color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                      {listing.area}
                    </span>
                    <span style={{ ...T.meta, fontSize: 15 }}>соток</span>
                  </div>
                </div>

                {paramRows.length > 0 && (
                  <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', alignContent: 'center' }}>
                    {paramRows.map((m, i) => (
                      <div key={i}>
                        <div style={{ ...T.label, marginBottom: 5 }}>{m.k}</div>
                        <div style={{ ...T.value }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Коммуникации */}
              <div style={{ padding: '20px 28px', borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ ...T.label, marginBottom: 14 }}>Коммуникации</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {comms.map((u) => (
                    <div key={u.label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '7px 14px', borderRadius: 999,
                      background: u.on ? 'var(--emerald-50)' : '#f5f5f5',
                      border: `1px solid ${u.on ? 'rgba(6,111,54,0.18)' : '#e8e8e8'}`,
                      opacity: u.on ? 1 : 0.55,
                    }}>
                      {u.on && (
                        <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6, flexShrink: 0 }}>
                          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: pulseColor[u.icon], opacity: 0.5, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                          <span style={{ borderRadius: '50%', width: 6, height: 6, background: pulseColor[u.icon], display: 'block' }} />
                        </span>
                      )}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={u.on ? 'var(--color-primary)' : '#bbb'}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconPath[u.icon]} />
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: u.on ? 600 : 400, color: u.on ? 'var(--ink-900)' : 'var(--ink-400)' }}>{u.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Юридика */}
              <div style={{ padding: '20px 28px', borderTop: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ ...T.label }}>Юридика</div>
                  {listing.cadastralNumber && (
                    <span style={{ ...T.meta }}>
                      Кадастр: <span style={{ color: 'var(--ink-900)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{listing.cadastralNumber}</span>
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
                  {legalOk.map((t) => (
                    <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'var(--emerald-50)', border: '1.5px solid rgba(6,111,54,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </span>
                      <span style={{ ...T.value, fontSize: 14 }}>{t}</span>
                    </div>
                  ))}
                  {legalBad.map((t) => (
                    <div key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: '#fef2f2', border: '1.5px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Описание */}
            {listing.description && (
              <div style={{ marginTop: 20, padding: '24px 28px', borderRadius: 20, background: '#fff', border: '1px solid var(--line)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ ...T.label, marginBottom: 16 }}>Об участке</div>
                <p style={{ ...T.body, margin: 0, letterSpacing: '-0.003em' }}>{listing.description}</p>
              </div>
            )}

            {/* Карта */}
            {hasMap && (
              <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--line)', marginTop: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'relative', zIndex: 0, isolation: 'isolate' }}>
                <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--line-soft)' }}>
                  <div style={{ ...T.label, marginBottom: 4 }}>Расположение</div>
                  <div style={{ ...T.value, fontSize: 14, fontWeight: 500 }}>{listing.location}</div>
                </div>
                <div style={{ height: 320 }}>
                  <ListingMap lat={listing.lat!} lng={listing.lng!} title={listing.title} />
                </div>
              </div>
            )}

          </div>

          {/* Right rail */}
          <div className="contact-rail" style={{ position: 'sticky', top: 88 }}>
            <ContactCard
              price={listing.price}
              pricePerSotka={pricePerSotka}
              seller={listing.seller}
              slug={listing.slug}
              title={listing.title}
              listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
              createdAt={listing.createdAt}
              views={listing.views}
            />
          </div>

        </div>

        {/* Похожие участки */}
        {similarListings.length > 0 && (
          <div style={{ marginTop: 72 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ ...T.label, marginBottom: 6 }}>Смотрите также</p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>Похожие участки</h2>
              </div>
              <Link href="/catalog" style={{ ...T.meta, color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
                Все участки →
              </Link>
            </div>
            <div className="similar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {similarListings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}

      </div>

      <ViewTracker id={String(listing.id)} />
      <MobileContactBar
        price={listing.price}
        pricePerSotka={pricePerSotka}
        seller={listing.seller}
        slug={listing.slug}
        title={listing.title}
        listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
      />

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        .breadcrumb-link:hover { color: var(--ink-700) !important; }

        /* Tablet: скрыть правую колонку, растянуть контент */
        @media (max-width: 1023px) {
          .listing-grid { grid-template-columns: 1fr !important; }
          .contact-rail { display: none !important; }
          .similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .listing-page { padding: 16px 16px 120px !important; }
          .listing-h1  { font-size: 22px !important; }
          .dashboard-top { grid-template-columns: 1fr !important; }
          .area-panel  {
            padding: 20px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--line-soft) !important;
          }
          .area-number { font-size: 56px !important; }
          .similar-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
