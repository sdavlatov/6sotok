import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import { CardMediaSlider } from './card-media-slider';

interface ListingCardProps {
  listing: Listing;
  mediaAspect?: string;
}

const CHIPS = [
  { key: 'hasElectricity', label: 'Свет',    color: 'bg-yellow-400'  },
  { key: 'hasGas',         label: 'Газ',      color: 'bg-orange-400'  },
  { key: 'hasWater',       label: 'Вода',     color: 'bg-cyan-400'    },
  { key: 'hasRoadAccess',  label: 'Дорога',   color: 'bg-stone-400'   },
  { key: 'hasStateAct',    label: 'Госакт',   color: 'bg-emerald-500' },
  { key: 'isDivisible',    label: 'Делимый',  color: 'bg-violet-400'  },
] as const;

export function ListingCard({ listing, mediaAspect = '4/3' }: ListingCardProps) {
  const price    = new Intl.NumberFormat('ru-RU').format(listing.price);
  const perSotka = new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.area));
  const allMedia = (listing.images && listing.images.length > 0) ? listing.images : listing.image ? [listing.image] : [];
  const typeLabel = listing.purpose || listing.landType;
  const address   = (listing as Listing & { address?: string }).address || listing.location;

  const chips = CHIPS.filter(c => listing[c.key]);

  return (
    <Link
      href={listingUrl(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white border border-zinc-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Фото */}
      <div className="relative w-full overflow-hidden bg-zinc-100 shrink-0" style={{ aspectRatio: mediaAspect }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <CardMediaSlider images={allMedia} title={listing.title} />
        </div>

        {/* Градиент снизу */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />

        {/* Счётчик фото — всегда виден (touch-устройства не поддерживают hover) */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            {allMedia.length}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3 gap-2 sm:px-4 sm:pt-4 sm:pb-4 sm:gap-3">

        {/* Тип · Площадь */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 font-medium">
          {typeLabel && <span className="text-zinc-600 font-semibold">{typeLabel}</span>}
          {typeLabel && <span>·</span>}
          <span>{listing.area} сот.</span>
        </div>

        {/* Цена */}
        <div className="-mt-0.5">
          <p className="text-lg sm:text-2xl font-black text-primary leading-none tabular-nums tracking-tight">
            {price} ₸
          </p>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 tabular-nums">{perSotka} ₸/сот.</p>
        </div>

        {/* Адрес */}
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="size-3 sm:size-3.5 shrink-0 text-zinc-400" />
          <span className="text-[11px] sm:text-[12.5px] text-zinc-500 truncate">{address}</span>
        </div>

        {/* Коммуникации с pulse-точками */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1.5 pt-2 border-t border-zinc-100 sm:gap-x-3 sm:pt-2.5">
            {chips.slice(0, 4).map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-zinc-500">
                <span className="relative flex size-1.5 sm:size-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />
                  <span className={`relative inline-flex size-full rounded-full ${color}`} />
                </span>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
