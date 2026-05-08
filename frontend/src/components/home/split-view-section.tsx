'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroMap } from './hero-map';

interface CarouselItem {
  id: string | number;
  slug: string;
  title: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
  image?: string | null;
  description?: string | null;
}

interface SmallItem {
  id: string | number;
  slug: string;
  title: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
  image?: string | null;
}

interface BizItem extends SmallItem {
  description?: string | null;
}

interface MapDot {
  lat: number;
  lng: number;
  slug?: string;
  title?: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
}

interface Props {
  carouselListings: CarouselItem[];
  cards1: SmallItem[];
  bizCard?: BizItem;
  cards2: SmallItem[];
  cards3: SmallItem[];
  mapDots: MapDot[];
  landCount: number;
}

const PLOT = ['plot-img','plot-img-2','plot-img-3','plot-img-4','plot-img-5','plot-img-6'];
const fmt  = (n: number) => n.toLocaleString('ru-RU');
const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

function SmallCard({ l, idx }: { l: SmallItem; idx: number }) {
  const pc = l.price && l.area ? Math.round(l.price / l.area) : null;
  return (
    <Link href={`/listing/${l.slug}`}
      className="tile group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all">
      <div className={`relative aspect-[4/3] overflow-hidden ${PLOT[idx % 6]}`}>
        {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
        <div className="absolute bottom-3 left-3 font-mono text-[10px] text-zinc-700/70">↳ {l.area} соток</div>
      </div>
      <div className="p-5">
        <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {l.landType ?? 'ИЖС'}{l.location ? ` · ${l.location}` : ''}
        </div>
        <h3 className="mt-1.5 font-black tracking-[-0.035em] text-[19px] leading-tight text-zinc-900 line-clamp-2">{l.title}</h3>
        {l.price && (
          <div className="mt-3">
            <div className="font-black tracking-[-0.035em] text-[20px] text-zinc-900">{fmt(l.price)} ₸</div>
            {pc && <div className="text-[10.5px] font-mono text-zinc-500 mt-0.5">{fmt(pc)} ₸ / сотка</div>}
          </div>
        )}
      </div>
    </Link>
  );
}

function BusinessCard({ l }: { l: BizItem }) {
  return (
    <Link href={`/business/${l.slug}`}
      className="tile group col-span-2 bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all">
      <div className="grid grid-cols-[1fr_1.2fr]">
        <div className="p-7 flex flex-col order-2 md:order-1">
          <div className="flex items-center gap-2 text-[11.5px] font-medium text-zinc-500 uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
            Готовый бизнес{l.location ? ` · ${l.location}` : ''}
          </div>
          <h3 className="mt-2 font-black tracking-[-0.035em] text-[26px] leading-[1.02] text-zinc-900">{l.title}</h3>
          {l.description && <p className="mt-3 text-[13.5px] text-zinc-600 leading-snug line-clamp-3">{l.description}</p>}
          <div className="mt-auto pt-5 flex items-end justify-between">
            {l.price && (
              <div className="font-black tracking-[-0.035em] text-[28px] text-zinc-900 leading-none">{fmt(l.price)} ₸</div>
            )}
            <span className="px-4 h-10 rounded-xl bg-zinc-100 text-zinc-900 text-[13px] font-medium flex items-center gap-1 group-hover:bg-primary group-hover:text-white transition">
              P&L →
            </span>
          </div>
        </div>
        <div className="relative plot-img-5 overflow-hidden order-1 md:order-2" style={{ aspectRatio: '5/3' }}>
          {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[10.5px] font-bold uppercase tracking-wider">Бизнес</span>
          </div>
          {l.area && <div className="absolute bottom-3 left-4 font-mono text-[10px] text-zinc-700/70">↳ участок {l.area} га</div>}
        </div>
      </div>
    </Link>
  );
}

const LAYERS = [
  { key: 'schema',    label: 'Схема'   },
  { key: 'satellite', label: 'Спутник' },
  { key: 'cadastre',  label: 'Кадастр' },
] as const;

export function SplitViewSection({ carouselListings, cards1, bizCard, cards2, cards3, mapDots, landCount }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [layer, setLayer] = useState<'schema' | 'satellite' | 'cadastre'>('schema');
  const [visibleCount, setVisibleCount] = useState(landCount);

  useEffect(() => {
    if (carouselListings.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % carouselListings.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselListings.length]);

  const cl = carouselListings[idx];
  const pc = cl?.price && cl?.area ? Math.round(cl.price / cl.area) : null;

  return (
    <section className="max-w-[1440px] mx-auto px-6 py-10">

      {/* Section header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="font-black tracking-[-0.04em] text-[44px] leading-[1] text-zinc-900">
          {landCount.toLocaleString('ru-RU')} участков
          <span className="text-zinc-400 block">по всему Казахстану</span>
        </h2>
        <div className="flex items-center gap-2 self-center">
          <Link href="/catalog"
            className="px-3.5 h-9 rounded-lg border border-zinc-200 bg-white text-[12.5px] font-medium text-zinc-700 hover:border-zinc-400 transition flex items-center gap-2">
            Все фильтры
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-bold">3</span>
          </Link>
          <Link href="/catalog?sort=new"
            className="px-3.5 h-9 rounded-lg border border-zinc-200 bg-white text-[12.5px] font-medium text-zinc-700 hover:border-zinc-400 transition flex items-center">
            Сначала новые ↓
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">

        {/* ── Listings column ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Featured rotating card (col-span-2) */}
          {cl && (
            <div className="col-span-2 transition-opacity duration-300" style={{ opacity: visible ? 1 : 0 }}>
              <Link href={`/listing/${cl.slug}`}
                className="tile group block bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all">
                <div className="grid grid-cols-[1.2fr_1fr]">
                  <div className={`relative overflow-hidden ${PLOT[idx % 6]}`} style={{ aspectRatio: '5/3' }}>
                    {cl.image && <img src={cl.image} alt={cl.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />}
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 rounded-md bg-zinc-900/90 backdrop-blur text-white text-[10.5px] font-bold uppercase tracking-wider">Премиум</span>
                    </div>
                    <div className="absolute bottom-3 left-4 font-mono text-[10px] text-zinc-700/70">↳ участок · {cl.area} соток</div>
                    {/* Progress dots */}
                    <div className="absolute top-4 right-4 flex gap-1">
                      {carouselListings.map((_, i) => (
                        <button key={i} onClick={e => { e.preventDefault(); setIdx(i); setVisible(true); }}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="p-7 flex flex-col">
                    <div className="flex items-center gap-2 text-[11.5px] font-medium text-zinc-500 uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      {cl.landType ?? 'ИЖС'}{cl.location ? ` · ${cl.location}` : ''}
                    </div>
                    <h3 className="mt-2 font-black text-zinc-900 leading-[1]"
                      style={{ fontSize: 'clamp(20px, 2vw, 28px)', letterSpacing: '-0.035em' }}>
                      {cl.title}
                    </h3>
                    {cl.description && (
                      <p className="mt-3 text-[13.5px] text-zinc-600 leading-snug line-clamp-3">{cl.description}</p>
                    )}
                    <div className="mt-auto pt-5 flex items-end justify-between">
                      {cl.price ? (
                        <div>
                          <div className="font-black text-zinc-900 leading-none"
                            style={{ fontSize: 'clamp(22px, 2.2vw, 32px)', letterSpacing: '-0.035em' }}>
                            {fmt(cl.price)} ₸
                          </div>
                          {pc && <div className="mt-1.5 text-[11.5px] font-mono text-zinc-500">{fmt(pc)} ₸ / сотка</div>}
                        </div>
                      ) : <div />}
                      <span className="px-4 h-10 rounded-xl bg-zinc-900 text-white text-[13px] font-medium flex items-center gap-1 group-hover:bg-primary transition shrink-0">
                        Смотреть →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {cards1.map((l, i) => <SmallCard key={l.id} l={l} idx={i + 1} />)}
          {bizCard && <BusinessCard l={bizCard} />}
          {cards2.map((l, i) => <SmallCard key={l.id} l={l} idx={i + 3} />)}
          {cards3.map((l, i) => <SmallCard key={l.id} l={l} idx={i + 5} />)}

          <div className="col-span-2 flex items-center justify-center pt-2">
            <Link href="/catalog"
              className="px-5 h-11 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 text-[13.5px] font-medium text-zinc-700 transition flex items-center gap-2">
              Показать все {landCount.toLocaleString('ru-RU')} участков
              <span className="font-mono text-[11px] text-zinc-400">→</span>
            </Link>
          </div>
        </div>

        {/* ── Map column (sticky) ── */}
        <div className="hidden lg:block lg:sticky lg:top-20" style={{ height: 820 }}>
          <div className="relative h-full w-full rounded-3xl overflow-hidden border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.10)]">

            {/* Leaflet map */}
            <HeroMap dots={mapDots} layer={layer} onCountChange={setVisibleCount} />

            {/* Counter badge */}
            <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur rounded-xl border border-zinc-200/60 px-3 py-2 shadow-sm pointer-events-none">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500">в окне карты</div>
              <div className="text-[15px] font-black tracking-[-0.035em] text-zinc-900">{visibleCount.toLocaleString('ru-RU')} участков</div>
            </div>

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
              <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 font-bold text-lg shadow-sm hover:bg-zinc-50 flex items-center justify-center">+</Link>
              <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 font-bold text-lg shadow-sm hover:bg-zinc-50 flex items-center justify-center">−</Link>
              <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 shadow-sm hover:bg-zinc-50 flex items-center justify-center font-mono text-[11px] font-bold">⊕</Link>
            </div>

            {/* Layer toggle */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur rounded-xl border border-zinc-200/60 p-1 flex gap-0.5 shadow-sm text-[11.5px] font-medium">
              {LAYERS.map(({ key, label }) => (
                <button key={key} onClick={() => setLayer(key)}
                  className={`px-2.5 h-7 rounded-lg flex items-center transition-colors ${layer === key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Compass */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-[400] hidden xl:flex flex-col items-center gap-2 font-mono text-[9px] text-zinc-600 tracking-widest pointer-events-none">
              <div className="text-zinc-700 font-bold">N</div>
              <div className="w-px h-16 bg-zinc-400/40" />
              <div>S</div>
            </div>


          </div>
        </div>

      </div>
    </section>
  );
}
