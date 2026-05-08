'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface CarouselListing {
  id: number;
  slug: string;
  title: string;
  price?: number;
  area?: number;
  landType?: string;
  location?: string;
  image?: string;
  lat?: number;
  lng?: number;
  description?: string;
}

const PLOT_CLASSES = ['plot-img','plot-img-2','plot-img-3','plot-img-4','plot-img-5','plot-img-6'];

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function FeaturedCardCarousel({ listings }: { listings: CarouselListing[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (listings.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % listings.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(id);
  }, [listings.length]);

  const l = listings[idx];
  if (!l) return null;

  const pc = l.price && l.area ? Math.round(l.price / l.area) : null;
  const plotClass = PLOT_CLASSES[idx % 6];

  return (
    <div
      className="col-span-2 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}>
      <Link href={`/listing/${l.slug}`}
        className="tile group block bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-lg transition-all">
        <div className="grid grid-cols-[1.2fr_1fr]">

          {/* Image */}
          <div className={`relative overflow-hidden ${plotClass}`} style={{ aspectRatio: '5/3' }}>
            {l.image && (
              <img src={l.image} alt={l.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager" />
            )}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <span className="px-2 py-1 rounded-md bg-zinc-900/90 backdrop-blur text-white text-[10.5px] font-bold uppercase tracking-wider">
                Премиум
              </span>
            </div>
            <div className="absolute bottom-3 left-4 font-mono text-[10px] text-zinc-700/70 uppercase tracking-wider">
              ↳ участок · {l.area} соток
            </div>
            {l.lat && l.lng && (
              <div className="absolute bottom-3 right-4 font-mono text-[10px] text-zinc-700/70">
                {l.lat.toFixed(2)}°N {l.lng.toFixed(2)}°E
              </div>
            )}
            {/* Progress dots */}
            <div className="absolute top-4 right-4 flex gap-1">
              {listings.map((_, i) => (
                <button key={i} onClick={e => { e.preventDefault(); setIdx(i); setVisible(true); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-7 flex flex-col">
            <div className="flex items-center gap-2 text-[11.5px] font-medium text-zinc-500 uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              {l.landType ?? 'ИЖС'}{l.location ? ` · ${l.location}` : ''}
            </div>
            <h3 className="mt-2 font-black text-zinc-900 leading-[1]"
              style={{ fontSize: 'clamp(20px, 2vw, 28px)', letterSpacing: '-0.035em' }}>
              {l.title}
            </h3>
            {l.description && (
              <p className="mt-3 text-[13.5px] text-zinc-600 leading-snug line-clamp-3">{l.description}</p>
            )}
            <div className="mt-auto pt-5 flex items-end justify-between">
              {l.price ? (
                <div>
                  <div className="font-black text-zinc-900 leading-none"
                    style={{ fontSize: 'clamp(22px, 2.2vw, 32px)', letterSpacing: '-0.035em' }}>
                    {fmt(l.price)} ₸
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
  );
}
