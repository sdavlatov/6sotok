import Link from 'next/link';
import { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import { CardMediaSlider } from './card-media-slider';
import { UTILITY_DOTS, plotClass } from '@/lib/listing-card-utils';

interface ListingCardProps {
  listing: Listing;
  mediaAspect?: string;
}

const fmt  = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

export function ListingCard({ listing, mediaAspect = '4/3' }: ListingCardProps) {
  const perSotka = listing.area > 0 ? Math.round(listing.price / listing.area) : 0;
  const allMedia = (listing.images && listing.images.length > 0) ? listing.images : listing.image ? [listing.image] : [];
  const typeLabel = listing.purpose || listing.landType;
  const dots = UTILITY_DOTS.filter(d => listing[d.key as keyof Listing]);

  // 3 stats strip
  const statCols: Array<{ label: string; value: string; accent?: boolean }> = [];
  if (listing.area > 0) statCols.push({ label: 'Площадь', value: `${listing.area} сот` });
  if (typeLabel) statCols.push({ label: 'Назначение', value: typeLabel });
  if (listing.hasStateAct !== undefined) {
    statCols.push({ label: 'Кадастр', value: listing.hasStateAct ? 'проверен' : 'нет акта', accent: listing.hasStateAct });
  } else {
    const comms = [listing.hasElectricity && 'Свет', listing.hasGas && 'Газ', listing.hasWater && 'Вода'].filter(Boolean) as string[];
    if (comms.length) statCols.push({ label: 'Коммуникации', value: comms.join(', ') });
  }
  const stats = statCols.slice(0, 3);

  return (
    <Link
      href={listingUrl(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] bg-white border border-[var(--line)] shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] transition-all duration-200"
    >
      {/* Image */}
      <div className={`relative w-full overflow-hidden shrink-0 ${plotClass(listing.landType)}`} style={{ aspectRatio: mediaAspect }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <CardMediaSlider images={allMedia} title={listing.title} />
        </div>
        {listing.isNegotiable && (
          <span className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 rounded-[var(--r-xs)] bg-[var(--color-warning-soft)] text-[var(--color-warning)] text-[9px] font-bold uppercase tracking-wide">
            Торг
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">

        {/* Type · Location */}
        <p className="text-[10.5px] font-medium text-[var(--ink-400)] uppercase tracking-wider truncate">
          {[typeLabel, listing.address || listing.location].filter(Boolean).join(' · ')}
        </p>

        {/* Title */}
        <h3 className="mt-0.5 font-semibold text-[14.5px] leading-snug text-[var(--ink-900)] line-clamp-2">
          {listing.title}
        </h3>

        {/* Price + CTA */}
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <div className="font-black tracking-tight text-[19px] text-[var(--ink-900)] leading-none tabular-nums">
              {fmtM(listing.price)} млн ₸
            </div>
            {perSotka > 0 && (
              <div className="mt-0.5 text-[10.5px] font-mono text-[var(--ink-400)] tabular-nums">
                {fmt(perSotka)} / сотка
              </div>
            )}
          </div>
          <span className="shrink-0 h-8 px-3.5 rounded-[var(--r-md)] bg-[var(--ink-900)] text-white text-[11px] font-semibold flex items-center gap-1 group-hover:bg-[var(--brand-600)] transition-colors">
            Открыть →
          </span>
        </div>

        {/* Utility dots */}
        {dots.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--line-soft)] flex flex-wrap gap-x-3 gap-y-1">
            {dots.map(d => (
              <span key={d.key} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink-500)' }}>
                <span className="size-2 rounded-full shrink-0" style={{ background: d.color }} />
                {d.label}
              </span>
            ))}
          </div>
        )}

        {/* Stats strip (only if no dots) */}
        {dots.length === 0 && stats.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[var(--line-soft)] grid gap-x-2" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
            {stats.map(s => (
              <div key={s.label}>
                <div className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-400)] mb-0.5">{s.label}</div>
                <div className="text-[12px] font-bold tabular-nums leading-tight" style={{ color: s.accent ? 'var(--brand)' : 'var(--ink-700)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
