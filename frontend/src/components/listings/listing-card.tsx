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
      
      {/* 1. Блок Изображения (Уменьшен приоритет, соотношение 16:9) */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 shrink-0">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 pr-4">
          <span className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black tracking-wider text-white shadow-sm backdrop-blur-md uppercase">
            {listing.purpose || listing.landType}
          </span>
          <span className="rounded-xl bg-white/95 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-900 shadow-sm backdrop-blur-md uppercase">
            {listing.area} сот.
          </span>
        </div>
      </div>

      {/* 2. Контентный блок (Увеличен приоритет сухих цифр) */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        
        {/* Цена: Отдельный акцентный блок с пересчетом за сотку */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4 rounded-2xl bg-zinc-50/80 p-4 border border-zinc-100/80">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Полная стоимость</div>
            <div className="text-2xl sm:text-[22px] font-black tracking-tight text-zinc-900">{formattedPrice} ₸</div>
          </div>
          <div className="text-right">
             <div className="text-lg font-black text-primary">{pricePerSotka} ₸</div>
             <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">за сотку</div>
          </div>
        </div>

        {/* Заголовок */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800 mb-4">
          {listing.title}
        </h3>

        {/* Информационные слои (Коммуникации + Юридический статус) */}
        <div className="space-y-2 mt-auto">
          
          {/* Коммуникации: Строгие цвета по типу */}
          <div className="flex flex-wrap gap-1.5">
            {listing.hasElectricity && (
              <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2.5 py-1 text-[10px] font-bold text-yellow-700 uppercase tracking-wider">
                Свет
              </span>
            )}
            {listing.hasGas && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Газ
              </span>
            )}
            {listing.hasWater && (
              <span className="inline-flex items-center gap-1 rounded bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                Вода
              </span>
            )}
          </div>

          {/* Юридические статусы */}
          <div className="flex flex-wrap gap-1.5">
            {listing.isPledged === false && (
              <span className="inline-flex items-center rounded border border-green-200/50 bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                Без залога
              </span>
            )}
            {listing.isOnRedLine === true && (
              <span className="inline-flex items-center rounded border border-red-200/50 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 uppercase tracking-wider">
                Красная линия
              </span>
            )}
            {listing.isDivisible && (
              <span className="inline-flex items-center rounded border border-purple-200/50 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                Делимый
              </span>
            )}
            {listing.hasStateAct !== false && (
              <span className="inline-flex items-center rounded border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                Госакт
              </span>
            )}
          </div>
        </div>

        {/* Локация (Футер) */}
        <div className="mt-5 pt-4 border-t border-zinc-100 flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 truncate mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate flex-1">{listing.location}</span>
          </div>
          <div className="shrink-0 rounded-full bg-zinc-50 p-1.5 text-zinc-400 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
