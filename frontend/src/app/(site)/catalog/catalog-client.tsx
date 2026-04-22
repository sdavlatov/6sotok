'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { List, Map, SlidersHorizontal } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { ListingCard } from '@/components/listings/listing-card';
import { CatalogFilters } from '@/components/catalog/filters';
import { CatalogSort } from '@/components/catalog/sort';
import { MapView } from '@/components/catalog/map-view';
import type { Listing } from '@/types/listing';

type ViewMode = 'list' | 'map';

interface CatalogClientProps {
  initialType: string;
  initialLocation: string;
  initialPriceFrom: string;
  initialPriceTo: string;
  initialAreaFrom: string;
  initialAreaTo: string;
  initialHasElectricity: boolean;
  initialHasGas: boolean;
  initialHasWater: boolean;
  initialHasSewer: boolean;
  initialHasRoadAccess: boolean;
  initialIsPledged: boolean;
  initialIsOnRedLine: boolean;
  initialIsDivisible: boolean;
  initialViewMode?: 'list' | 'map';
  allListings: Listing[];
}

export function CatalogClient({
  initialType, initialLocation,
  initialPriceFrom, initialPriceTo,
  initialAreaFrom, initialAreaTo,
  initialHasElectricity, initialHasGas, initialHasWater,
  initialHasSewer, initialHasRoadAccess,
  initialIsPledged, initialIsOnRedLine, initialIsDivisible,
  initialViewMode = 'list',
  allListings,
}: CatalogClientProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('Сначала новые');
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialType ? [initialType] : []);
  const [location, setLocation] = useState(initialLocation);
  const [areaFrom, setAreaFrom] = useState(initialAreaFrom);
  const [areaTo, setAreaTo] = useState(initialAreaTo);
  const [priceFrom, setPriceFrom] = useState(initialPriceFrom);
  const [priceTo, setPriceTo] = useState(initialPriceTo);
  const [hasElectricity, setHasElectricity] = useState(initialHasElectricity);
  const [hasGas, setHasGas] = useState(initialHasGas);
  const [hasWater, setHasWater] = useState(initialHasWater);
  const [hasSewer, setHasSewer] = useState(initialHasSewer);
  const [hasRoadAccess, setHasRoadAccess] = useState(initialHasRoadAccess);
  const [isPledged, setIsPledged] = useState(initialIsPledged);
  const [isOnRedLine, setIsOnRedLine] = useState(initialIsOnRedLine);
  const [isDivisible, setIsDivisible] = useState(initialIsDivisible);

  const cardRefs       = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredListings = useMemo(() => {
    let result = [...allListings];

    if (selectedCategories.length > 0)
      result = result.filter(l => selectedCategories.includes(l.landType) || (l.purpose != null && selectedCategories.includes(l.purpose)));
    if (location.trim())
      result = result.filter(l => l.location.toLowerCase().includes(location.trim().toLowerCase()));
    if (areaFrom) { const v = parseFloat(areaFrom); if (v > 0) result = result.filter(l => l.area >= v); }
    if (areaTo)   { const v = parseFloat(areaTo);   if (v > 0) result = result.filter(l => l.area <= v); }
    if (priceFrom) { const v = parseInt(priceFrom.replace(/\D/g, '')); if (v) result = result.filter(l => l.price >= v); }
    if (priceTo)   { const v = parseInt(priceTo.replace(/\D/g, ''));   if (v) result = result.filter(l => l.price <= v); }
    if (isPledged)      result = result.filter(l => l.isPledged === false);
    if (isOnRedLine)    result = result.filter(l => l.isOnRedLine === false);
    if (isDivisible)    result = result.filter(l => l.isDivisible === true);
    if (hasElectricity) result = result.filter(l => l.hasElectricity === true);
    if (hasGas)         result = result.filter(l => l.hasGas === true);
    if (hasWater)       result = result.filter(l => l.hasWater === true);
    if (hasSewer)       result = result.filter(l => l.hasSewer === true);
    if (hasRoadAccess)  result = result.filter(l => l.hasRoadAccess === true);

    result.sort((a, b) => {
      if (sortOrder === 'Сначала дешевые') return a.price - b.price;
      if (sortOrder === 'Сначала дорогие') return b.price - a.price;
      if (sortOrder === 'Дешевле за сотку') return (a.price / a.area) - (b.price / b.area);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [selectedCategories, location, areaFrom, areaTo, priceFrom, priceTo,
      sortOrder, isPledged, isOnRedLine, isDivisible,
      hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess]);

  const activeFilterCount = useMemo(() => [
    selectedCategories.length > 0, !!location,
    !!areaFrom || !!areaTo, !!priceFrom || !!priceTo,
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible,
  ].filter(Boolean).length, [selectedCategories, location, areaFrom, areaTo,
    priceFrom, priceTo, hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible]);

  const filterProps = {
    selectedCategories, onChangeCategories: setSelectedCategories,
    location, setLocation,
    areaFrom, setAreaFrom, areaTo, setAreaTo,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    hasElectricity, setHasElectricity,
    hasGas, setHasGas, hasWater, setHasWater,
    hasSewer, setHasSewer, hasRoadAccess, setHasRoadAccess,
    isPledged, setIsPledged, isOnRedLine, setIsOnRedLine, isDivisible, setIsDivisible,
    resultCount: filteredListings.length,
    viewMode,
    onViewModeChange: setViewMode,
  };

  const resetAll = () => {
    setSelectedCategories([]); setLocation('');
    setAreaFrom(''); setAreaTo(''); setPriceFrom(''); setPriceTo('');
    setHasElectricity(false); setHasGas(false); setHasWater(false);
    setHasSewer(false); setHasRoadAccess(false);
    setIsPledged(false); setIsOnRedLine(false); setIsDivisible(false);
  };

  const handleMarkerClick = useCallback((listing: Listing) => {
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
      highlightTimer.current = null;
      Object.values(cardRefs.current).forEach(el => {
        if (el) { el.style.outline = ''; el.style.outlineOffset = ''; }
      });
    }
    requestAnimationFrame(() => {
      const el = cardRefs.current[listing.id];
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.outline = '3px solid var(--color-primary)';
      el.style.outlineOffset = '4px';
      el.style.borderRadius = '16px';
      highlightTimer.current = setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        highlightTimer.current = null;
      }, 2000);
    });
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Закрываем фильтры при переключении на карту с мобильного
    if (isMobileFiltersOpen) setIsMobileFiltersOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      <div className="py-8 pb-20">
        <Container>

          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Каталог участков</h1>
            <p className="mt-2 text-base font-medium text-zinc-500">
              Найдено <span className="text-zinc-900 font-bold">{filteredListings.length}</span> объявлений в Казахстане
            </p>
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row">

            {/* Desktop sidebar */}
            <aside className="w-full shrink-0 lg:w-80 hidden lg:block">
              <CatalogFilters {...filterProps} />
            </aside>

            <div className="flex-1 w-full min-w-0">

              {/* Mobile control bar */}
              <div className="lg:hidden mb-4 flex items-center gap-2">

                {/* Фильтры */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-[13px] font-bold text-zinc-900 shadow-sm active:scale-95 transition-transform shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={2.5} />
                  Фильтры
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-black leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Список / Карта */}
                <div className="flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm p-0.5 gap-0.5">
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-all ${
                      viewMode === 'list' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" strokeWidth={2} />
                    Список
                  </button>
                  <button
                    onClick={() => handleViewModeChange('map')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-all ${
                      viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" strokeWidth={2} />
                    Карта
                  </button>
                </div>

                {/* Сортировка — только в режиме списка */}
                {viewMode === 'list' && (
                  <div className="ml-auto shrink-0">
                    <CatalogSort value={sortOrder} onChange={setSortOrder} />
                  </div>
                )}
              </div>

              {/* Desktop sort bar */}
              {viewMode === 'list' && (
                <div className="hidden lg:flex items-center justify-end mb-6">
                  <CatalogSort value={sortOrder} onChange={setSortOrder} />
                </div>
              )}

              {/* Map mode */}
              {viewMode === 'map' && (
                <div
                  className="flex flex-col gap-8"
                  style={isMobileFiltersOpen ? { pointerEvents: 'none' } : undefined}
                >
                  <MapView listings={filteredListings} onMarkerClick={handleMarkerClick} />
                  {filteredListings.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredListings.map(listing => (
                        <div
                          key={listing.id}
                          ref={el => { cardRefs.current[listing.id] = el; }}
                          className="rounded-2xl transition-shadow duration-300"
                        >
                          <ListingCard listing={listing} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* List mode */}
              {viewMode === 'list' && (
                <>
                  {filteredListings.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredListings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-20 px-4 text-center">
                      <div className="rounded-full bg-zinc-100 p-4 text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/>
                        </svg>
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-zinc-900">Ничего не найдено</h3>
                      <p className="mt-2 text-zinc-500">Попробуйте изменить параметры фильтра</p>
                      {activeFilterCount > 0 && (
                        <button onClick={resetAll}
                          className="mt-6 rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
                          Сбросить все фильтры
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Mobile filter drawer */}
      {isMobileFiltersOpen && (
        <>
          {/* Overlay — z выше Leaflet (1000) */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
            style={{ zIndex: 1050 }}
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          {/* Drawer — z выше overlay */}
          <div
            className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl lg:hidden"
            style={{ zIndex: 1100, maxHeight: '92dvh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-zinc-300" />
            </div>
            {/* CatalogFilters управляет своим scroll-ом внутри */}
            <CatalogFilters
              {...filterProps}
              onViewModeChange={handleViewModeChange}
              onClose={() => setIsMobileFiltersOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
