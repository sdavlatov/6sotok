import type { Metadata } from 'next';
import { CatalogClient } from './catalog-client';
import { getListings } from '@/lib/api';
import { PMAX, AMAX } from './catalog-utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Каталог участков — 6 соток',
  description: 'Земельные участки на карте Казахстана: ИЖС, дачи, сельхоз. Фильтры по цене, площади, коммуникациям и документам.',
};

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
  }>;
}) {
  const params = await searchParams;
  const listings = await getListings();

  // параметры глубоких ссылок (главная, поиск) → единая модель фильтров
  const utils: string[] = [];
  if (params.hasElectricity === 'true') utils.push('Свет');
  if (params.hasWater === 'true') utils.push('Вода');
  if (params.hasGas === 'true') utils.push('Газ');
  if (params.hasSewer === 'true') utils.push('Канализация');
  if (params.hasRoadAccess === 'true') utils.push('Дорога');
  const legal: string[] = [];
  if (params.isPledged === 'true') legal.push('Не в залоге');
  if (params.isOnRedLine === 'true') legal.push('Не на красной линии');

  const toMln = (v?: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n / 1e6), PMAX) : undefined;
  };
  const toSot = (v?: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.min(n, AMAX) : undefined;
  };

  return (
    <CatalogClient
      allListings={listings}
      initialFilters={{
        type: params.type || undefined,
        city: params.location || undefined,
        pLo: toMln(params.priceFrom),
        pHi: toMln(params.priceTo),
        aLo: toSot(params.areaFrom),
        aHi: toSot(params.areaTo),
        utils: utils.length ? utils : undefined,
        legal: legal.length ? legal : undefined,
      }}
    />
  );
}
