import Link from 'next/link';
import Image from 'next/image';
import { SearchX } from 'lucide-react';

const PLOT = ['plot-img', 'plot-img-2', 'plot-img-3', 'plot-img-4', 'plot-img-5', 'plot-img-6'];
const fmt = (n: number) => n.toLocaleString('ru-RU');

interface ListingItem {
  id: string | number;
  slug: string;
  title: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
  image?: string | null;
}

interface Props {
  listings: ListingItem[];
}

export function FreshListings({ listings }: Props) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1.5">Свежие</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Новые объявления</h2>
        </div>
        <Link href="/catalog" className="text-sm font-medium text-primary hover:underline shrink-0">
          Смотреть все →
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 px-4 text-center">
          <div className="bg-zinc-100 p-4 rounded-2xl mb-4">
            <SearchX className="size-8 text-zinc-400" />
          </div>
          <p className="text-base font-semibold text-zinc-700 mb-1">Объявлений пока нет</p>
          <p className="text-sm text-zinc-400 mb-6">Станьте первым — разместите участок бесплатно</p>
          <Link
            href="/add-listing"
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150"
          >
            Разместить объявление →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {listings.map((l, idx) => {
            const pc = l.price && l.area ? Math.round(l.price / l.area) : null;
            return (
              <Link
                key={l.id}
                href={`/listing/${l.slug}`}
                className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`relative aspect-[4/3] overflow-hidden bg-zinc-100 ${PLOT[idx % 6]}`}>
                  {l.image && (
                    <Image
                      src={l.image}
                      alt={l.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm text-zinc-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {l.landType ?? 'ИЖС'}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-zinc-900 text-[13px] sm:text-[14px] leading-snug line-clamp-2 mb-1.5">
                    {l.title}
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-zinc-500 truncate">{l.location}</p>
                    {l.area && <p className="text-[11px] text-zinc-400 shrink-0 ml-2">{l.area} сот.</p>}
                  </div>
                  {l.price && (
                    <div>
                      <p className="font-bold text-zinc-900 text-[14px] sm:text-[15px] tabular-nums">{fmt(l.price)} ₸</p>
                      {pc && <p className="text-[10px] text-zinc-400 tabular-nums mt-0.5">{fmt(pc)} ₸/сот.</p>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
