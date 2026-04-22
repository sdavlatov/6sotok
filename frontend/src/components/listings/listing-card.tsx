import Link from 'next/link';
import type { ReactNode } from 'react';
import { Listing } from '@/types/listing';

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0]);

interface ListingCardProps {
  listing: Listing;
}

function Chip({ children, color }: { children: ReactNode; color: 'yellow' | 'blue' | 'cyan' | 'stone' | 'green' | 'purple' | 'red' }) {
  const cls = {
    yellow: 'text-yellow-700 bg-yellow-50',
    blue:   'text-blue-700 bg-blue-50',
    cyan:   'text-cyan-700 bg-cyan-50',
    stone:  'text-stone-600 bg-stone-100',
    green:  'text-green-700 bg-green-50',
    purple: 'text-purple-700 bg-purple-50',
    red:    'text-red-600 bg-red-50',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const price      = new Intl.NumberFormat('ru-RU').format(listing.price);
  const perSotka   = new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.area));
  const mainIsVideo = listing.image && isVideo(listing.image);
  const mediaCount  = listing.images?.length ?? 0;
  const hasVideo    = listing.images?.some(isVideo) ?? mainIsVideo;

  const chips = [
    listing.hasElectricity  && { label: 'Свет',      color: 'yellow' as const },
    listing.hasGas          && { label: 'Газ',       color: 'blue'   as const },
    listing.hasWater        && { label: 'Вода',      color: 'cyan'   as const },
    listing.hasRoadAccess   && { label: 'Дорога',    color: 'stone'  as const },
    listing.hasStateAct     && { label: 'Госакт',    color: 'green'  as const },
    listing.isDivisible     && { label: 'Делимый',   color: 'purple' as const },
    listing.isPledged === false && { label: 'Без залога', color: 'green' as const },
  ].filter(Boolean) as { label: string; color: 'yellow' | 'blue' | 'cyan' | 'stone' | 'green' | 'purple' | 'red' }[];

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:border-zinc-300"
    >
      {/* ── Медиа ─────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 shrink-0">

        {/* Контент */}
        {mainIsVideo ? (
          <>
            <video src={listing.image}
              className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-40"
              muted playsInline loop autoPlay aria-hidden />
            <video src={listing.image}
              className="relative z-10 h-full w-full object-contain"
              muted playsInline loop autoPlay />
          </>
        ) : listing.image ? (
          <img src={listing.image} alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
            </svg>
          </div>
        )}

        {/* Градиент снизу */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Тип участка — верх лево */}
        <div className="absolute top-3 left-3">
          <span className="rounded-xl bg-zinc-900/75 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase leading-none">
            {listing.purpose || listing.landType}
          </span>
        </div>

        {/* Торг — верх право */}
        {listing.isNegotiable && (
          <div className="absolute top-3 right-3">
            <span className="rounded-xl bg-amber-400 px-2.5 py-1 text-[10px] font-black text-amber-900 uppercase tracking-wider leading-none shadow-sm">
              Торг
            </span>
          </div>
        )}

        {/* Медиа счётчик — низ право */}
        {mediaCount > 1 && (
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1 z-10">
            {hasVideo ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="white" opacity="0.9"><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" opacity="0.9"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            )}
            <span className="text-[11px] font-bold text-white/90">{mediaCount}</span>
          </div>
        )}
      </div>

      {/* ── Контент ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4 gap-0">

        {/* Цена */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">
            {price} ₸
          </span>
          <span className="text-[12px] font-bold text-primary whitespace-nowrap shrink-0 leading-none">
            {perSotka} ₸/сот.
          </span>
        </div>

        {/* Площадь */}
        <div className="text-[13px] font-extrabold text-zinc-500 mb-2">
          {listing.area} соток
        </div>

        {/* Локация */}
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Коммуникации */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-zinc-100">
            {chips.slice(0, 5).map(({ label, color }) => (
              <Chip key={label} color={color}>{label}</Chip>
            ))}
            {chips.length > 5 && (
              <span className="text-[10px] font-bold text-zinc-400 px-1 py-0.5">+{chips.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
