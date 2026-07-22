import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getBusinessListings, stripDescription } from '@/lib/api';
import { BusinessCatalogClient } from '@/components/business/business-catalog-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Готовый бизнес — 6sotok.kz',
  description: 'Покупка и продажа готового бизнеса в Казахстане — кафе, магазины, автосервисы, производства.',
};

export default async function BusinessPage() {
  const listings = stripDescription(await getBusinessListings());
  return (
    <Suspense>
      <BusinessCatalogClient allListings={listings} />
    </Suspense>
  );
}
