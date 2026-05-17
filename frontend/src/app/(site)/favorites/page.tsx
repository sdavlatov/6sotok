'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { ListingCard } from '@/components/listings/listing-card';

const LS_BOOKMARKS = '6sotok_bookmarks';

function Skeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white border border-zinc-100 animate-pulse">
      <div className="aspect-[4/3] bg-zinc-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-zinc-100 rounded-full w-1/3" />
        <div className="h-5 bg-zinc-100 rounded-full w-2/3" />
        <div className="h-3 bg-zinc-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[] | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw: string[] = JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? '[]');
      setIds(raw);
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    if (ids === null) return;
    if (ids.length === 0) { setLoading(false); return; }
    fetch(`/api/listings?ids=${ids.join(',')}`)
      .then(r => r.json())
      .then((data: Listing[]) => { setListings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ids]);

  const isEmpty = !loading && listings.length === 0;

  return (
    <div className="bg-[var(--paper)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-8">
          <Link href="/" className="text-zinc-400 hover:text-zinc-700 transition-colors">Главная</Link>
          <ChevronRight className="size-3.5 text-zinc-300" />
          <Link href="/catalog" className="text-zinc-400 hover:text-zinc-700 transition-colors">Каталог</Link>
          <ChevronRight className="size-3.5 text-zinc-300" />
          <span className="text-zinc-900 font-medium">Избранное</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">Сохранённые участки</p>
            <h1 className="font-black tracking-tight text-[40px] sm:text-[52px] leading-[0.95] text-zinc-900">
              Избранное
              {!loading && listings.length > 0 && (
                <span className="text-zinc-300"> · {listings.length}</span>
              )}
            </h1>
          </div>
          {!isEmpty && (
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-200 text-[13px] font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
            >
              + Добавить ещё
            </Link>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-24 px-4 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5">
              <Bookmark className="size-7 text-zinc-400" />
            </div>
            <p className="text-[17px] font-semibold text-zinc-900 mb-2">Здесь пока пусто</p>
            <p className="text-[14px] text-zinc-400 max-w-sm leading-relaxed mb-7">
              Нажмите на закладку на карточке в каталоге, чтобы сохранить участок в избранное.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors text-[14px]"
            >
              Смотреть участки
            </Link>
          </div>
        )}

        {/* Listing grid */}
        {!loading && listings.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-zinc-200 text-[13px] font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                Перейти в каталог →
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
