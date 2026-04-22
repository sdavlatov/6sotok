import { CatalogClient } from './catalog-client';
import { getListings } from '@/lib/api';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    location?: string;
    priceFrom?: string;
    priceTo?: string;
    areaFrom?: string;
    areaTo?: string;
    hasElectricity?: string;
    hasGas?: string;
    hasWater?: string;
    hasSewer?: string;
    hasRoadAccess?: string;
    isPledged?: string;
    isOnRedLine?: string;
    isDivisible?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const listings = await getListings();

  return (
    <CatalogClient
      allListings={listings}
      initialType={params.type ?? ''}
      initialLocation={params.location ?? ''}
      initialPriceFrom={params.priceFrom ?? ''}
      initialPriceTo={params.priceTo ?? ''}
      initialAreaFrom={params.areaFrom ?? ''}
      initialAreaTo={params.areaTo ?? ''}
      initialHasElectricity={params.hasElectricity === 'true'}
      initialHasGas={params.hasGas === 'true'}
      initialHasWater={params.hasWater === 'true'}
      initialHasSewer={params.hasSewer === 'true'}
      initialHasRoadAccess={params.hasRoadAccess === 'true'}
      initialIsPledged={params.isPledged === 'true'}
      initialIsOnRedLine={params.isOnRedLine === 'true'}
      initialIsDivisible={params.isDivisible === 'true'}
      initialViewMode={params.view === 'map' ? 'map' : 'list'}
    />
  );
}
