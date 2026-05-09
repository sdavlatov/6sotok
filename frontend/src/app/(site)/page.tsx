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
    price: l.price, area: l.area, landType: l.landType, location: l.location, image: l.image,
  }));
  const premiumSlugs = landListings.slice(0, 2).map(l => l.slug);
  const landCount = landListings.length;
  const filterData = landListings.map(l => ({
    landType: l.landType ?? '',
    location: l.location ?? '',
    price: l.price ?? 0,
    area: l.area ?? 0,
  }));
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

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-6 sm:pb-8">
          <div className="max-w-5xl mb-7 sm:mb-10">
            <HeroBadge />

            <HeroTitle />

            <p className="mt-5 sm:mt-7 text-[15px] sm:text-[18px] text-zinc-600 leading-snug max-w-2xl tracking-tight">
              Покупайте и продавайте участки удобно — быстро находите на карте и легко размещайте объявления.
            </p>
          </div>

          {/* Filter bar — full width */}
          <HomeFilter locations={locations} totalCount={landCount} countByType={countByType} filterData={filterData} />
        </div>

        {/* Marquee */}
        <CityMarquee />
      </section>

      {/* ═══ SPLIT VIEW ═══ */}
      <SplitViewSection
        carouselListings={carouselListings}
        cards1={cards1}
        cards2={cards2}
        cards3={cards3}
        mapDots={mapDots}
        landCount={landCount}
        premiumSlugs={premiumSlugs}
      />

      {/* ═══ AUDIENCE BLOCKS ═══ */}
      <section className="border-t border-zinc-200/70 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">

            {/* Покупателям */}
            <Link href="/catalog" className="tile group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-50 border border-zinc-200 sm:p-10 sm:min-h-[440px] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-60 pointer-events-none hidden sm:block"
                style={{ backgroundImage: 'linear-gradient(rgba(6,111,54,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,111,54,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 60% at 80% 20%, black, transparent)' }} />

              {/* Desktop floating mini-map */}
              <div className="drift hidden sm:block absolute top-7 right-7 w-44 h-44 rounded-2xl map-bg border border-zinc-200/60 shadow-lg overflow-hidden pointer-events-none">
                <span className="absolute top-[30%] left-[40%] flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-black text-[11px] border-2 border-white shadow-md">
                  {Math.max(1, Math.min(99, landCount))}
                </span>
                <span className="absolute top-[60%] left-[65%] w-3 h-3 rounded-full bg-zinc-800 border-2 border-white shadow-sm" />
                <span className="absolute top-[20%] left-[70%] w-3 h-3 rounded-full bg-zinc-800 border-2 border-white shadow-sm" />
              </div>

              {/* Mobile map preview */}
              <div className="sm:hidden relative map-bg overflow-hidden" style={{ height: 160 }}>
                {/* pins */}
                {([
                  [35, 30, true], [55, 65, false], [25, 72, false], [65, 20, false], [70, 55, false],
                ] as [number, number, boolean][]).map(([top, left, pulse], i) => (
                  <span key={i} className="absolute flex" style={{ top: `${top}%`, left: `${left}%`, transform: 'translate(-50%,-50%)' }}>
                    {pulse ? (
                      <span className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary border-2 border-white shadow-md text-white font-black text-[10px]">
                          {Math.max(1, Math.min(99, landCount))}
                        </span>
                      </span>
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-zinc-700 border-2 border-white shadow-sm" />
                    )}
                  </span>
                ))}
                {/* bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, #f4f4f5 0%, transparent 100%)' }} />
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[11px] font-mono text-zinc-500">{landCount} участков</span>
                </div>
              </div>

              {/* Text */}
              <div className="relative p-6 sm:p-0">
                <div className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest text-primary">→ покупателям</div>
                <h3 className="mt-3 sm:mt-4 font-black tracking-[-0.04em] text-[34px] sm:text-[52px] leading-[0.95] text-zinc-900">
                  Ищите участки<br />прямо<br />на карте.
                </h3>
              </div>
              <div className="relative p-6 pt-0 sm:p-0">
                <p className="text-[13.5px] sm:text-[14.5px] text-zinc-600 leading-snug max-w-md">
                  Каждое объявление привязано к точке на карте. Фильтруйте участки по площади, цене, документам и категории земли.
                </p>
                <div className="mt-5 sm:mt-7 flex items-center gap-3 flex-wrap">
                  <span className="px-4 sm:px-5 h-10 sm:h-11 rounded-xl bg-zinc-900 text-white font-semibold text-[13px] sm:text-[13.5px] tracking-tight flex items-center gap-2 group-hover:bg-primary transition">
                    Открыть карту →
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3 text-[11.5px] sm:text-[12px] text-zinc-500 font-mono">
                    <span><b className="text-zinc-900">{landCount.toLocaleString('ru-RU')}</b> объявл.</span>
                    <span className="text-zinc-300">·</span>
                    <span><b className="text-zinc-900">{locations.length}</b> областей</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Продавцам */}
            <Link href="/add-listing" className="tile group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#021A0E] text-white p-6 sm:p-10 min-h-[320px] sm:min-h-[440px] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
              <div className="drift absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(44,166,78,0.45) 0%, transparent 60%)' }} />
              <div className="relative">
                <div className="font-mono text-[11px] sm:text-[12px] uppercase tracking-widest" style={{ color: '#2CA64E' }}>→ продавцам</div>
                <h3 className="mt-3 sm:mt-4 font-black tracking-[-0.04em] text-[36px] sm:text-[52px] leading-[0.95]">
                  Разместите<br />участок<br />за&nbsp;3&nbsp;минуты.
                </h3>
              </div>
              <div className="relative">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 pt-4">
                  {[['01','Укажите кадастр'],['02','Фото и видео'],['03','Принимайте заявки']].map(([n,t], i) => (
                    <div key={n} className={`border-l pl-2 sm:pl-3 ${i === 2 ? 'border-[#2CA64E]' : 'border-white/20'}`}>
                      <div className="font-mono text-[10px]" style={{ color: '#2CA64E' }}>{n}</div>
                      <div className="mt-0.5 text-[11.5px] sm:text-[12.5px] font-semibold leading-tight">{t}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] text-white/60 leading-snug max-w-md">
                  Публикация бесплатна, а заявки от покупателей приходят напрямую в WhatsApp и по звонку.
                </p>
                <div className="mt-5 sm:mt-7">
                  <span className="px-4 sm:px-5 h-10 sm:h-11 rounded-xl bg-white text-zinc-900 font-semibold text-[13px] sm:text-[13.5px] tracking-tight inline-flex items-center gap-2 group-hover:bg-primary group-hover:text-white transition">
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-20">

          <div className="flex items-start sm:items-end justify-between gap-4 sm:gap-6 flex-wrap mb-7 sm:mb-10">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-amber-600 mb-3">→ отдельная категория</div>
              <h2 className="font-black tracking-[-0.05em] text-[38px] sm:text-[56px] md:text-[64px] leading-[0.95] text-zinc-900">
                Готовый бизнес.<br />
                <span className="text-zinc-400">Не только земля.</span>
              </h2>
              <p className="mt-4 sm:mt-5 text-[14px] sm:text-[16px] text-zinc-600 leading-snug tracking-tight max-w-xl">
                Кафе на трассе, СТО, пасеки, базы отдыха, фермерские хозяйства — с P&L, оборудованием и участком в собственности.
              </p>
            </div>
            <Link href="/business"
              className="px-5 h-11 rounded-xl bg-zinc-900 text-white text-[13.5px] font-semibold tracking-tight flex items-center gap-2 hover:bg-primary transition shrink-0">
              Все {businessCount} объектов →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
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
                  <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Цена</div>
                      <div className="mt-0.5 font-black tracking-[-0.035em] text-[16px] text-zinc-900">
                        {l.price ? `${fmtM(l.price)} млн ₸` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Выручка</div>
                      <div className="mt-0.5 font-black tracking-[-0.035em] text-[16px] text-zinc-900">
                        {l.monthlyRevenue ? `${fmtM(l.monthlyRevenue)} м/мес` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Окуп.</div>
                      <div className="mt-0.5 font-black tracking-[-0.035em] text-[16px] text-primary">
                        {l.paybackMonths ? `${l.paybackMonths} мес` : '—'}
                      </div>
                    </div>
                  </div>
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
