'use client';

import { useState, useMemo } from 'react';
import { Container } from '@/components/layout/container';
import { ListingCard } from '@/components/listings/listing-card';
import { CatalogFilters } from '@/components/catalog/filters';
import { CatalogSort } from '@/components/catalog/sort';
import { mockListings } from '@/lib/mock-data';

interface CatalogClientProps {
  initialType: string;
  initialPriceFrom: string;
  initialPriceTo: string;
}

export function CatalogClient({ initialType, initialPriceFrom, initialPriceTo }: CatalogClientProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(
    initialType ? [initialType] : []
  );
  const [priceFrom, setPriceFrom] = useState(initialPriceFrom);
  const [priceTo, setPriceTo] = useState(initialPriceTo);
  const [sortOrder, setSortOrder] = useState('Сначала новые');

  const [isPledged, setIsPledged] = useState(false);
  const [isOnRedLine, setIsOnRedLine] = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasGas, setHasGas] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [hasRoadAccess, setHasRoadAccess] = useState(false);

  const baseListings = useMemo(() => [
    ...mockListings,
    ...mockListings.map(l => ({...l, id: l.id + '-dup1', price: l.price * 1.1})),
    ...mockListings.map(l => ({...l, id: l.id + '-dup2', price: l.price * 0.9})),
    ...mockListings.map(l => ({...l, id: l.id + '-dup3', area: l.area + 2})),
  ], []);

  const filteredListings = useMemo(() => {
    let result = [...baseListings];

    if (selectedTypes.length > 0) {
      result = result.filter(l => selectedTypes.includes(l.landType));
    }
    if (selectedPurposes.length > 0) {
      result = result.filter(l => l.purpose && selectedPurposes.includes(l.purpose));
    }
    if (priceFrom) {
      const from = parseInt(priceFrom.replace(/\D/g, ''));
      if (from) result = result.filter(l => l.price >= from);
    }
    if (priceTo) {
      const to = parseInt(priceTo.replace(/\D/g, ''));
      if (to) result = result.filter(l => l.price <= to);
    }
    if (isPledged) result = result.filter(l => l.isPledged === false);
    if (isOnRedLine) result = result.filter(l => l.isOnRedLine === false);
    if (hasElectricity) result = result.filter(l => l.hasElectricity === true);
    if (hasGas) result = result.filter(l => l.hasGas === true);
    if (hasWater) result = result.filter(l => l.hasWater === true);
    if (hasRoadAccess) result = result.filter(l => l.hasRoadAccess === true);

    result.sort((a, b) => {
      if (sortOrder === 'Сначала дешевые') return a.price - b.price;
      if (sortOrder === 'Сначала дорогие') return b.price - a.price;
      if (sortOrder === 'Дешевле за сотку') return (a.price/a.area) - (b.price/b.area);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [baseListings, selectedTypes, selectedPurposes, priceFrom, priceTo, sortOrder, isPledged, isOnRedLine, hasElectricity, hasGas, hasWater, hasRoadAccess]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      <main className="py-8 pb-20">
        <Container>

          <div className="mb-8 lg:mb-10">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Каталог участков</h1>
            <p className="mt-3 text-lg font-medium text-zinc-500">
              Найдено <span className="text-zinc-900 font-bold">{filteredListings.length}</span> объявлений в Казахстане
            </p>
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <aside className={`w-full shrink-0 lg:w-80 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
              <CatalogFilters
                selectedTypes={selectedTypes}
                onChangeTypes={setSelectedTypes}
                priceFrom={priceFrom}
                setPriceFrom={setPriceFrom}
                priceTo={priceTo}
                setPriceTo={setPriceTo}
                selectedPurposes={selectedPurposes}
                onChangePurposes={setSelectedPurposes}
                isPledged={isPledged} setIsPledged={setIsPledged}
                isOnRedLine={isOnRedLine} setIsOnRedLine={setIsOnRedLine}
                hasElectricity={hasElectricity} setHasElectricity={setHasElectricity}
                hasGas={hasGas} setHasGas={setHasGas}
                hasWater={hasWater} setHasWater={setHasWater}
                hasRoadAccess={hasRoadAccess} setHasRoadAccess={setHasRoadAccess}
              />
            </aside>

            <div className="flex-1 w-full min-w-0">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className="lg:hidden flex items-center gap-2 rounded-2xl bg-white border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-900 shadow-sm active:scale-95 transition-transform"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  <span>{isMobileFiltersOpen ? 'Скрыть фильтры' : 'Фильтры'}</span>
                </button>

                <div className="ml-auto">
                  <CatalogSort value={sortOrder} onChange={setSortOrder} />
                </div>
              </div>

              {filteredListings.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 px-4 text-center">
                  <div className="rounded-full bg-zinc-100 p-4 shrink-0 text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/></svg>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-zinc-900">Ничего не найдено</h3>
                  <p className="mt-2 text-zinc-500">Попробуйте изменить параметры фильтра</p>
                </div>
              )}
            </div>
          </div>

        </Container>
      </main>
    </div>
  );
}
