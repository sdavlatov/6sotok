import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { getBusinessListings } from '@/lib/api';
import { BusinessCatalogClient } from '@/components/business/business-catalog-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Готовый бизнес — 6sotok.kz',
  description: 'Покупка и продажа готового бизнеса в Казахстане — кафе, магазины, автосервисы, производства.',
};

export default async function BusinessPage() {
  const listings = await getBusinessListings();

  return (
    <div className="min-h-screen bg-zinc-50">
      <Container>
        <div className="py-8 md:py-12">

          {/* Шапка */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Готовый бизнес</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
                Бизнес в Казахстане
              </h1>
              <p className="mt-2 text-[15px] text-zinc-500">
                {listings.length > 0
                  ? `${listings.length} объявлений — кафе, магазины, сервисы и производства`
                  : 'Покупка и продажа действующего бизнеса'}
              </p>
            </div>
            <Link
              href="/add-listing"
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 shrink-0"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Подать объявление
            </Link>
          </div>

          {/* Каталог с фильтрами */}
          <BusinessCatalogClient allListings={listings} />

          {/* Мобильная кнопка */}
          <div className="fixed bottom-6 right-4 left-4 z-40 md:hidden">
            <Link
              href="/add-listing"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/25 transition-colors duration-150"
            >
              <Plus className="size-5" strokeWidth={2.5} />
              Подать объявление
            </Link>
          </div>

        </div>
      </Container>
    </div>
  );
}
