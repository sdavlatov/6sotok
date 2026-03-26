import { CatalogClient } from './catalog-client';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; priceFrom?: string; priceTo?: string }>;
}) {
  const params = await searchParams;

  return (
    <CatalogClient
      initialType={params.type ?? ''}
      initialPriceFrom={params.priceFrom ?? ''}
      initialPriceTo={params.priceTo ?? ''}
    />
  );
}
