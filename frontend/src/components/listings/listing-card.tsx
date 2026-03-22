import Link from 'next/link';
import { Listing } from '@/types/listing';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(listing.price);
  const pricePerSotka = new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.area));

  return (
    <Link href={`/listing/${listing.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(6,111,54,0.1)]">
      {/* Image Block */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 shrink-0">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 pr-4">
          <span className="rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-900 shadow-sm backdrop-blur-md">
            {listing.landType}
          </span>
          <span className="rounded-xl bg-primary/90 px-3 py-1.5 text-xs font-bold tracking-wide text-white shadow-sm backdrop-blur-md">
            {listing.area} сот.
          </span>
        </div>
      </div>

      {/* Content Block */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Pricing */}
        <div>
          <div className="text-2xl font-black tracking-tight text-zinc-900">{formattedPrice} ₸</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
             <span>{pricePerSotka} ₸ за сотку</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug text-zinc-800">
          {listing.title}
        </h3>

        {/* Communications Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {listing.communications?.slice(0, 3).map((comm, idx) => (
            <span key={idx} className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
              {comm}
            </span>
          ))}
          {listing.communications?.length > 3 && (
            <span className="inline-flex items-center rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-400">
              +{listing.communications.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto pt-6 flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 truncate mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate">{listing.location}</span>
          </div>
          <div className="shrink-0 rounded-full bg-zinc-50 p-2 text-zinc-400 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
