import { getListingById } from '@/lib/api';
import type { Listing } from '@/types/listing';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { CompareClient } from './compare-client';

// Страница читает searchParams, поэтому рендерится динамически в любом случае.
// Дорогая часть — запрос к БД — закеширована в lib/api.ts (тег 'listings').
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const idList = (ids ?? '').split(',').filter(Boolean).slice(0, 4);
  const listings = (await Promise.all(idList.map(id => getListingById(id)))).filter(Boolean) as Listing[];

  if (listings.length === 0) {
    return (
      <div className="min-h-[60vh] bg-zinc-50 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-2xl">⚖️</div>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-zinc-900 mb-1">Нет участков для сравнения</p>
          <p className="text-[14px] text-zinc-400">Добавьте участки из каталога нажав «Сравнить»</p>
        </div>
        <Link href="/catalog" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-colors text-[14px]">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-5 pt-6 pb-24">

        <Breadcrumbs
          trail={[{ label: 'Каталог', href: '/catalog' }, { label: 'Сравнение' }]}
          className="mb-8"
        />

        <CompareClient initialListings={listings} />

      </div>
    </div>
  );
}
