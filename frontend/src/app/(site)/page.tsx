import Link from 'next/link';
import { HomeFilter } from '@/components/home/home-filter';
import { CityMarquee } from '@/components/home/city-marquee';
import { HeroTitle } from '@/components/home/hero-title';
import { HeroBadge } from '@/components/home/hero-badge';
import { SplitViewSection } from '@/components/home/split-view-section';
import { getListings, getBusinessListings } from '@/lib/api';
import type { Listing } from '@/types/listing';

export const dynamic = 'force-dynamic';

const PLOT_CLASSES = ['plot-img','plot-img-2','plot-img-3','plot-img-4','plot-img-5','plot-img-6'];
const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

export default async function HomePage() {
  const [landListings, businessListings] = await Promise.all([
    getListings({ limit: '500' }),
    getBusinessListings(),
  ]);

  const locations = [
    ...new Set([...landListings, ...businessListings].map(l => l.location).filter(Boolean)),
  ].sort();

  const mapDots = landListings.filter(l => l.lat && l.lng).map(l => ({
    lat: l.lat!, lng: l.lng!, slug: l.slug, title: l.title,
    price: l.price, area: l.area, landType: l.landType, location: l.location,
  }));
  const landCount   = landListings.length;
  const businessCount = businessListings.length;

  const countByType: Record<string, number> = {};
  for (const l of landListings) {
    if (l.landType) countByType[l.landType] = (countByType[l.landType] || 0) + 1;
    if (l.purpose)  countByType[l.purpose]  = (countByType[l.purpose]  || 0) + 1;
  }

  // Top-10 carousel listings
  const carouselListings = landListings.slice(0, 10).map(l => ({
    id: l.id, slug: l.slug, title: l.title, price: l.price, area: l.area,
    landType: l.landType, location: l.location, image: l.image, description: l.description,
  }));

  const toCard = (l: Listing) => ({
    id: l.id, slug: l.slug, title: l.title, price: l.price, area: l.area,
    landType: l.landType, location: l.location, image: l.image,
  });

  const cards1 = landListings.slice(1, 3).map(toCard);
  const bizCard = businessListings[0] ? {
    id: businessListings[0].id, slug: businessListings[0].slug, title: businessListings[0].title,
    price: businessListings[0].price, area: businessListings[0].area,
    landType: businessListings[0].landType, location: businessListings[0].location,
    image: businessListings[0].image, description: businessListings[0].description,
  } : undefined;
  const cards2 = landListings.slice(3, 5).map(toCard);
  const cards3 = landListings.slice(5, 7).map(toCard);

  // Business preview
  const businessPreview = businessListings.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ═══ HERO ═══ */}
      <section className="relative border-b border-zinc-200/70 bg-white">
        {/* Decorative layer — clipped separately so dropdowns inside aren't cut */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-50"
            style={{ backgroundImage: 'linear-gradient(rgba(6,111,54,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,111,54,0.04) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(44,166,78,0.4) 0%, transparent 60%)' }} />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-6 pt-16 pb-8">
          <div className="max-w-5xl mb-10">
            <HeroBadge />

            <HeroTitle />

            <p className="mt-7 text-[18px] text-zinc-600 leading-snug max-w-2xl tracking-tight">
              Покупайте и продавайте участки удобно — быстро находите на карте и легко размещайте объявления.
            </p>
          </div>

          {/* Filter bar — full width */}
          <HomeFilter locations={locations} totalCount={landCount} countByType={countByType} />
        </div>

        {/* Marquee */}
        <CityMarquee />
      </section>

      {/* ═══ SPLIT VIEW ═══ */}
      <SplitViewSection
        carouselListings={carouselListings}
        cards1={cards1}
        bizCard={bizCard}
        cards2={cards2}
        cards3={cards3}
        mapDots={mapDots}
        landCount={landCount}
      />

      {/* ═══ AUDIENCE BLOCKS ═══ */}
      <section className="border-t border-zinc-200/70 bg-white">
        <div className="max-w-[1440px] mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-5">

            {/* Покупателям */}
            <Link href="/catalog" className="tile group relative overflow-hidden rounded-3xl bg-zinc-50 border border-zinc-200 p-10 min-h-[440px] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-60 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(6,111,54,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,111,54,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 60% at 80% 20%, black, transparent)' }} />
              {/* Floating mini-map */}
              <div className="drift absolute top-7 right-7 w-44 h-44 rounded-2xl map-bg border border-zinc-200/60 shadow-lg overflow-hidden pointer-events-none">
                <span className="absolute top-[30%] left-[40%] flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-black text-[11px] border-2 border-white shadow-md">
                  {Math.max(1, Math.min(99, landCount))}
                </span>
                <span className="absolute top-[60%] left-[65%] w-3 h-3 rounded-full bg-zinc-800 border-2 border-white shadow-sm" />
                <span className="absolute top-[20%] left-[70%] w-3 h-3 rounded-full bg-zinc-800 border-2 border-white shadow-sm" />
              </div>

              <div className="relative">
                <div className="text-[13px] font-semibold uppercase tracking-widest text-primary">→ Покупателям</div>
                <h3 className="mt-4 font-black tracking-[-0.04em] text-[48px] md:text-[52px] leading-[0.95] text-zinc-900">
                  Вся земля<br />Казахстана —<br /><span className="text-zinc-400">на одной карте.</span>
                </h3>
              </div>
              <div className="relative">
                <p className="text-[15px] text-zinc-600 leading-snug max-w-md">
                  Все участки страны — на одной карте. Цены, площади и документы без звонков агентам и спама.
                </p>
                <div className="mt-7 flex items-center gap-3 flex-wrap">
                  <span className="px-5 h-11 rounded-xl bg-zinc-900 text-white font-semibold text-[13.5px] tracking-tight flex items-center gap-2 group-hover:bg-primary transition">
                    Открыть карту →
                  </span>
                  <div className="flex items-center gap-3 text-[12.5px] text-zinc-500 font-mono">
                    <span><b className="text-zinc-900">{landCount.toLocaleString('ru-RU')}</b> объявлений</span>
                    <span className="text-zinc-300">·</span>
                    <span><b className="text-zinc-900">{locations.length}</b> городов</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Продавцам */}
            <Link href="/add-listing" className="tile group relative overflow-hidden rounded-3xl bg-[#021A0E] text-white p-10 min-h-[440px] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
              <div className="drift absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(44,166,78,0.45) 0%, transparent 60%)' }} />
              <div className="relative">
                <div className="text-[13px] font-semibold uppercase tracking-widest text-primary">→ Продавцам</div>
                <h3 className="mt-4 font-black tracking-[-0.04em] text-[48px] md:text-[52px] leading-[0.95]">
                  Разместите<br />участок<br /><span className="text-primary">за 3 минуты.</span>
                </h3>
              </div>
              <div className="relative">
                <div className="grid grid-cols-3 gap-4 mb-7">
                  {[['01','Кадастровый номер'],['02','Фото и описание'],['03','WhatsApp и звонки']].map(([n,t]) => (
                    <div key={n} className="border-l-2 border-primary/40 pl-3">
                      <div className="font-mono text-[11.5px] font-bold text-primary">{n}</div>
                      <div className="mt-1 text-[13.5px] font-semibold leading-tight">{t}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[15px] text-white/60 leading-snug max-w-md">
                  Бесплатно, без скрытых комиссий. Покупатели находят через карту и поиск — в среднем 14 дней до сделки.
                </p>
                <div className="mt-7">
                  <span className="px-5 h-11 rounded-xl bg-white text-zinc-900 font-semibold text-[13.5px] tracking-tight inline-flex items-center gap-2 group-hover:bg-primary group-hover:text-white transition">
                    Разместить объявление →
                  </span>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ═══ BUSINESS SECTION ═══ */}
      <section className="bg-zinc-50 border-t border-zinc-200/70">
        <div className="max-w-[1440px] mx-auto px-6 py-20">

          <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-amber-600 mb-3">→ отдельная категория</div>
              <h2 className="font-black tracking-[-0.05em] text-[56px] md:text-[64px] leading-[0.95] text-zinc-900">
                Готовый бизнес.<br />
                <span className="text-zinc-400">Не только земля.</span>
              </h2>
              <p className="mt-5 text-[16px] text-zinc-600 leading-snug tracking-tight max-w-xl">
                Кафе на трассе, СТО, пасеки, базы отдыха, фермерские хозяйства — с P&L, оборудованием и участком в собственности.
              </p>
            </div>
            <Link href="/business"
              className="px-5 h-11 rounded-xl bg-zinc-900 text-white text-[13.5px] font-semibold tracking-tight flex items-center gap-2 hover:bg-primary transition shrink-0">
              Все {businessCount} объектов →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {businessPreview.map((l, idx) => (
              <Link key={l.id} href={`/business/${l.slug}`}
                className="tile group bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:border-zinc-400 transition">
                <div className={`relative aspect-[4/3] overflow-hidden ${PLOT_CLASSES[(idx + 4) % 6]}`}>
                  {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                  <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">Бизнес</span>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono text-[10px] text-zinc-700/70">
                    {l.area && <span>↳ {l.area} га</span>}
                    {l.location && <span>{l.location}</span>}
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{l.landType ?? 'Готовый бизнес'}</div>
                  <h3 className="mt-1.5 font-black tracking-[-0.035em] text-[22px] leading-tight text-zinc-900 line-clamp-2">{l.title}</h3>
                  {l.price && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Цена</div>
                      <div className="mt-0.5 font-black tracking-[-0.035em] text-[18px] text-zinc-900">{fmtM(l.price)} млн ₸</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="text-zinc-500 mr-1 font-medium">Категории:</span>
            {[
              ['Кафе и рестораны', '/business?type=cafe'],
              ['СТО и автосервис', '/business?type=service'],
              ['Базы отдыха', '/business?type=hotel'],
              ['Фермы и пасеки', '/business?type=farm'],
              ['Производство', '/business?type=production'],
              ['Магазины', '/business?type=shop'],
              ['Склады и промка', '/business?type=warehouse'],
            ].map(([label, href]) => (
              <Link key={label} href={href}
                className="px-3.5 h-9 rounded-full bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition flex items-center">
                {label}
              </Link>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
