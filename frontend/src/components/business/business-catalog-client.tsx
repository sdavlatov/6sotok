'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { List, Map, SlidersHorizontal, X, Building2, Coffee, ShoppingBag, Briefcase, Warehouse, Factory, Fuel, Hotel, LayoutGrid } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { BusinessCard } from './business-card';
import { MapView, type MapItem } from '@/components/catalog/map-view';
import type { Listing } from '@/types/listing';

type ViewMode = 'list' | 'map';

const BUSINESS_CATEGORIES = [
  { value: '',           label: 'Все',            Icon: LayoutGrid },
  { value: 'cafe',       label: 'Кафе',           Icon: Coffee },
  { value: 'shop',       label: 'Магазин',        Icon: ShoppingBag },
  { value: 'office',     label: 'Офис',           Icon: Briefcase },
  { value: 'warehouse',  label: 'Склад',          Icon: Warehouse },
  { value: 'production', label: 'Производство',   Icon: Factory },
  { value: 'service',    label: 'Автосервис',     Icon: Fuel },
  { value: 'hotel',      label: 'Отель',          Icon: Hotel },
  { value: 'other',      label: 'Другое',         Icon: Building2 },
];

interface Props {
  allListings: Listing[];
}

const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const raw = (v: string) => Number(v.replace(/\s/g, ''));

const inputCls = 'w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';
const selectCls = inputCls + ' cursor-pointer appearance-none';
const checkPill = (active: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer select-none transition-all ${
    active ? 'bg-primary-soft border-primary text-primary' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
  }`;

function BusinessFilters({
  dealType, setDealType,
  bizType, setBizType,
  location, setLocation,
  locations,
  priceFrom, setPriceFrom,
  priceTo, setPriceTo,
  areaFrom, setAreaFrom,
  areaTo, setAreaTo,
  isOperational, setIsOperational,
  hasParking, setHasParking,
  hasElectricity, setHasElectricity,
  hasGas, setHasGas,
  hasWater, setHasWater,
  resultCount,
  onClose,
}: {
  dealType: string; setDealType: (v: 'all' | 'sale' | 'rent') => void;
  bizType: string; setBizType: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  locations: string[];
  priceFrom: string; setPriceFrom: (v: string) => void;
  priceTo: string; setPriceTo: (v: string) => void;
  areaFrom: string; setAreaFrom: (v: string) => void;
  areaTo: string; setAreaTo: (v: string) => void;
  isOperational: boolean; setIsOperational: (v: boolean) => void;
  hasParking: boolean; setHasParking: (v: boolean) => void;
  hasElectricity: boolean; setHasElectricity: (v: boolean) => void;
  hasGas: boolean; setHasGas: (v: boolean) => void;
  hasWater: boolean; setHasWater: (v: boolean) => void;
  resultCount: number;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 shrink-0">
          <p className="text-base font-bold text-zinc-900">Фильтры</p>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className={`${onClose ? 'overflow-y-auto flex-1 p-5 space-y-5' : 'space-y-5'}`}>

        {/* Тип сделки */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Тип сделки</p>
          <div className="flex rounded-xl bg-zinc-100 p-1 gap-1">
            {([['all', 'Все'], ['sale', 'Продажа'], ['rent', 'Аренда']] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setDealType(v)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  dealType === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Тип бизнеса */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Тип бизнеса</label>
          <select value={bizType} onChange={e => setBizType(e.target.value)} className={selectCls}>
            <option value="">Все типы</option>
            {BUSINESS_CATEGORIES.filter(c => c.value).map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Город */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Город</label>
          <select value={location} onChange={e => setLocation(e.target.value)} className={selectCls}>
            <option value="">Все города</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Площадь */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Площадь (м²)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="От" value={areaFrom} onChange={e => setAreaFrom(e.target.value)} className={inputCls} />
            <input type="number" placeholder="До" value={areaTo} onChange={e => setAreaTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Цена */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Цена (₸)</label>
          <div className="flex gap-2">
            <input placeholder="От" value={priceFrom} onChange={e => setPriceFrom(fmt(e.target.value))} className={inputCls} />
            <input placeholder="До" value={priceTo} onChange={e => setPriceTo(fmt(e.target.value))} className={inputCls} />
          </div>
        </div>

        {/* Особенности */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Особенности</label>
          <div className="flex flex-col gap-2">
            <label className={checkPill(isOperational)}>
              <input type="checkbox" className="hidden" checked={isOperational} onChange={e => setIsOperational(e.target.checked)} />
              Действующий бизнес
            </label>
            <label className={checkPill(hasParking)}>
              <input type="checkbox" className="hidden" checked={hasParking} onChange={e => setHasParking(e.target.checked)} />
              Парковка
            </label>
            <label className={checkPill(hasElectricity)}>
              <input type="checkbox" className="hidden" checked={hasElectricity} onChange={e => setHasElectricity(e.target.checked)} />
              Электричество
            </label>
            <label className={checkPill(hasGas)}>
              <input type="checkbox" className="hidden" checked={hasGas} onChange={e => setHasGas(e.target.checked)} />
              Газ
            </label>
            <label className={checkPill(hasWater)}>
              <input type="checkbox" className="hidden" checked={hasWater} onChange={e => setHasWater(e.target.checked)} />
              Вода
            </label>
          </div>
        </div>
      </div>

      {onClose && (
        <div className="shrink-0 px-5 pb-6 pt-4 border-t border-zinc-100">
          <button onClick={onClose}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-2xl transition-colors">
            Показать {resultCount} объявлений
          </button>
        </div>
      )}
    </div>
  );
}

export function BusinessCatalogClient({ allListings }: Props) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'new' | 'price_asc' | 'price_desc'>('new');

  const [dealType, setDealType] = useState<'all' | 'sale' | 'rent'>('all');
  const [bizType, setBizType] = useState(() => searchParams.get('type') ?? '');
  const [location, setLocation] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [areaFrom, setAreaFrom] = useState('');
  const [areaTo, setAreaTo] = useState('');
  const [isOperational, setIsOperational] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasGas, setHasGas] = useState(false);
  const [hasWater, setHasWater] = useState(false);

  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setDrawerVisible(true));
    } else {
      document.body.style.overflow = '';
      setDrawerVisible(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileFiltersOpen]);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locations = useMemo(() =>
    [...new Set(allListings.map(l => l.location).filter(Boolean))].sort(), [allListings]);

  const filtered = useMemo(() => {
    let result = allListings.filter(l => {
      if (dealType !== 'all' && l.dealType !== dealType) return false;
      if (bizType && l.businessType !== bizType) return false;
      if (location && l.location !== location) return false;
      if (priceFrom && l.price < raw(priceFrom)) return false;
      if (priceTo && l.price > raw(priceTo)) return false;
      if (areaFrom && (l.buildingArea ?? 0) < Number(areaFrom)) return false;
      if (areaTo && (l.buildingArea ?? 0) > Number(areaTo)) return false;
      if (isOperational && !l.isOperational) return false;
      if (hasParking && !l.hasParking) return false;
      if (hasElectricity && !l.hasElectricity) return false;
      if (hasGas && !l.hasGas) return false;
      if (hasWater && !l.hasWater) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price;
      if (sortOrder === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [allListings, dealType, bizType, location, priceFrom, priceTo, areaFrom, areaTo,
      isOperational, hasParking, hasElectricity, hasGas, hasWater, sortOrder]);

  const activeFilterCount = useMemo(() => [
    dealType !== 'all', !!bizType, !!location,
    !!priceFrom || !!priceTo, !!areaFrom || !!areaTo,
    isOperational, hasParking, hasElectricity, hasGas, hasWater,
  ].filter(Boolean).length, [dealType, bizType, location, priceFrom, priceTo, areaFrom, areaTo,
    isOperational, hasParking, hasElectricity, hasGas, hasWater]);

  const reset = () => {
    setDealType('all'); setBizType(''); setLocation('');
    setPriceFrom(''); setPriceTo(''); setAreaFrom(''); setAreaTo('');
    setIsOperational(false); setHasParking(false);
    setHasElectricity(false); setHasGas(false); setHasWater(false);
  };

  const filterProps = {
    dealType, setDealType, bizType, setBizType, location, setLocation, locations,
    priceFrom, setPriceFrom, priceTo, setPriceTo,
    areaFrom, setAreaFrom, areaTo, setAreaTo,
    isOperational, setIsOperational,
    hasParking, setHasParking,
    hasElectricity, setHasElectricity,
    hasGas, setHasGas,
    hasWater, setHasWater,
    resultCount: filtered.length,
  };

  const handleMarkerClick = useCallback((listing: MapItem) => {
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Hero */}
      <div className="bg-gradient-to-br from-white via-white to-primary-soft/20 border-b border-zinc-100">
        <Container>
          <div className="py-10 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Готовый бизнес</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 mb-3">
              Бизнес в Казахстане
            </h1>
            <p className="text-[15px] md:text-base text-zinc-500 max-w-xl">
              {allListings.length > 0
                ? `${allListings.length} объявлений — кафе, магазины, офисы и производства`
                : 'Покупка и продажа действующего бизнеса'}
            </p>
          </div>
        </Container>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-zinc-100 sticky top-[64px] z-30">
        <Container>
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {BUSINESS_CATEGORIES.map(({ value, label, Icon }) => {
              const active = bizType === value;
              return (
                <button
                  key={value}
                  onClick={() => setBizType(value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Catalog */}
      <div className="py-8 pb-24">
        <Container>
          <div className="flex flex-col lg:flex-row items-start gap-8">

            {/* Desktop sidebar */}
            <aside className="w-80 shrink-0 hidden lg:block">
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-5 sticky top-[132px]">
                <BusinessFilters {...filterProps} />
                {activeFilterCount > 0 && (
                  <button onClick={reset} className="w-full text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-1">
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </aside>

            <div className="flex-1 w-full min-w-0">

              {/* Mobile + desktop top bar */}
              <div className="flex items-center gap-2 mb-5">

                {/* Mobile filter button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-3.5 py-2.5 text-[13px] font-bold text-zinc-900 shadow-sm active:scale-95 transition-transform shrink-0"
                >
                  <SlidersHorizontal className="size-4" strokeWidth={2.5} />
                  Фильтры
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-black leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Count */}
                <p className="text-sm text-zinc-500 mr-auto">
                  {filtered.length === 0
                    ? 'Ничего не найдено'
                    : <><span className="text-zinc-900 font-bold">{filtered.length}</span> объявлений</>
                  }
                </p>

                {/* List / Map toggle */}
                <div className="flex items-center rounded-xl border border-zinc-200 bg-white shadow-sm p-0.5 gap-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center justify-center rounded-lg w-9 h-9 transition-all ${
                      viewMode === 'list' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <List className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center justify-center rounded-lg w-9 h-9 transition-all ${
                      viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <Map className="size-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Sort */}
                {viewMode === 'list' && (
                  <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                    className="hidden sm:block text-sm border border-zinc-200 rounded-xl bg-white px-3 py-2.5 text-zinc-700 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="new">Сначала новые</option>
                    <option value="price_asc">Сначала дешевле</option>
                    <option value="price_desc">Сначала дороже</option>
                  </select>
                )}
              </div>

              {/* Map mode */}
              {viewMode === 'map' && (
                <div className="flex flex-col gap-8">
                  <MapView listings={filtered} onMarkerClick={handleMarkerClick} />
                  {filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filtered.map(listing => (
                        <div key={listing.id} ref={el => { cardRefs.current[listing.id] = el; }}>
                          <BusinessCard listing={listing} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* List mode */}
              {viewMode === 'list' && (
                <>
                  {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filtered.map(listing => (
                        <BusinessCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20 px-4 text-center">
                      <div className="bg-zinc-100 p-4 rounded-2xl mb-4">
                        <Building2 className="size-8 text-zinc-400" />
                      </div>
                      <p className="text-base font-semibold text-zinc-700 mb-1">Ничего не найдено</p>
                      <p className="text-sm text-zinc-400 mb-4">Попробуйте изменить фильтры</p>
                      {activeFilterCount > 0 && (
                        <button onClick={reset}
                          className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors">
                          Сбросить фильтры
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
          <div
            className={`fixed inset-0 lg:hidden transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 1050, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div
            className={`fixed inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl lg:hidden transition-transform duration-300 ease-out ${drawerVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ zIndex: 1100, maxHeight: '92dvh' }}
          >
            <BusinessFilters {...filterProps} onClose={() => setIsMobileFiltersOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
