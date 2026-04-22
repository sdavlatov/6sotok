import Link from 'next/link';
import type { ReactNode } from 'react';
import { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import { CardMediaSlider } from './card-media-slider';

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0]);

interface ListingCardProps {
  listing: Listing;
}

function Chip({ children, color }: { children: ReactNode; color: 'yellow' | 'blue' | 'cyan' | 'stone' | 'green' | 'purple' }) {
  const cls = {
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-100',
    blue:   'text-blue-700 bg-blue-50 border-blue-100',
    cyan:   'text-cyan-700 bg-cyan-50 border-cyan-100',
    stone:  'text-stone-600 bg-stone-100 border-stone-200',
    green:  'text-green-700 bg-green-50 border-green-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${cls}`}>
      {children}
    </span>
  );
}

export function ListingCard({ listing }: ListingCardProps) {
  const price    = new Intl.NumberFormat('ru-RU').format(listing.price);
  const perSotka = new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.area));
  const priceLen = price.length;
  const allMedia = (listing.images && listing.images.length > 0)
    ? listing.images
    : listing.image ? [listing.image] : [];

  const chips = [
    listing.hasElectricity && { label: 'Свет',      color: 'yellow' as const },
    listing.hasGas         && { label: 'Газ',        color: 'blue'   as const },
    listing.hasWater       && { label: 'Вода',       color: 'cyan'   as const },
    listing.hasRoadAccess  && { label: 'Дорога',     color: 'stone'  as const },
    listing.hasStateAct    && { label: 'Госакт',     color: 'green'  as const },
    listing.isDivisible    && { label: 'Делимый',    color: 'purple' as const },
    listing.isPledged === false && { label: 'Без залога', color: 'green' as const },
  ].filter(Boolean) as { label: string; color: 'yellow' | 'blue' | 'cyan' | 'stone' | 'green' | 'purple' }[];

  return (
    <Link
      href={listingUrl(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:border-zinc-300"
    >
      {/* Медиа */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 shrink-0">
        <CardMediaSlider images={allMedia} title={listing.title} />

        {/* Тип — верх лево */}
        <div className="absolute top-2.5 left-2.5 z-30">
          <span className="rounded-lg bg-zinc-900/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase leading-none">
            {listing.purpose || listing.landType}
          </span>
        </div>

        {/* Торг — верх право */}
        {listing.isNegotiable && (
          <div className="absolute top-2.5 right-2.5 z-30">
            <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-black text-amber-900 uppercase tracking-wider leading-none shadow-sm">
              Торг
            </span>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col px-4 pt-4 pb-4 gap-2.5">

        {/* Заголовок */}
        <p className="text-[13px] font-semibold text-zinc-700 leading-snug line-clamp-2">
          {listing.title}
        </p>

        {/* Цена */}
        <div className="flex items-end justify-between gap-2">
          <span className={`font-black tracking-tight text-zinc-900 leading-none ${priceLen > 11 ? 'text-[16px]' : priceLen > 8 ? 'text-[19px]' : 'text-[22px]'}`}>
            {price} ₸
          </span>
          <span className="text-[11px] font-bold text-primary whitespace-nowrap shrink-0 leading-none mb-0.5">
            {perSotka} ₸/сот.
          </span>
        </div>

        {/* Площадь + Локация */}
        <div className="flex items-center gap-2 text-[12px] text-zinc-400 font-medium">
          <span className="font-extrabold text-zinc-500">{listing.area} сот.</span>
          <span className="text-zinc-200">·</span>
          <span className="truncate flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {listing.location}
          </span>
        </div>

        {/* Коммуникации */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2.5 border-t border-zinc-100">
            {chips.slice(0, 4).map(({ label, color }) => (
              <Chip key={label} color={color}>{label}</Chip>
            ))}
            {chips.length > 4 && (
              <span className="text-[10px] font-bold text-zinc-400 self-center px-1">+{chips.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
