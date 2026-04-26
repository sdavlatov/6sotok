'use client';

import { Search, MapPin, Ruler, Wallet, List, Map } from 'lucide-react';
import { Container } from '../layout/container';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { pushDataLayer } from '@/lib/analytics';
import { LAND_CATEGORIES, UTILITIES, LEGAL_FILTERS, FilterKey } from '@/lib/listing-constants';
import { MapView, type MapItem } from '@/components/catalog/map-view';

type ViewMode = 'list' | 'map';

const PURPOSES = [
  { label: 'Все участки', value: '' },
  ...LAND_CATEGORIES.map(c => ({ label: c, value: c })),
];

export const INITIAL_FILTERS: Record<FilterKey, boolean> = {
  hasElectricity: false,
  hasGas: false,
  hasWater: false,
  hasSewer: false,
  hasRoadAccess: false,
  isPledged: false,
  isOnRedLine: false,
  isDivisible: false,
};

interface FilterValues {
  purpose: string;
  areaFrom: string;
  areaTo: string;
  priceFrom: string;
  priceTo: string;
  activeFilters: Record<FilterKey, boolean>;
}

interface SearchBarProps {
  // Серверно-вычисленные мета-данные (лёгкие, без полных объектов)
  countByType?: Record<string, number>;
  locations?: string[];
  totalCount?: number;
  initialValues?: Partial<FilterValues>;
  onApply?: (values: FilterValues) => void;
}

type MapListingFull = MapItem & {
  area: number
  landType: string
  purpose?: string
  hasElectricity?: boolean
  hasGas?: boolean
  hasWater?: boolean
  hasSewer?: boolean
  hasRoadAccess?: boolean
  isPledged?: boolean
  isOnRedLine?: boolean
  isDivisible?: boolean
}

export function SearchBar({ countByType: propCountByType, locations: propLocations, totalCount, initialValues, onApply }: SearchBarProps = {}) {
  const router = useRouter();
  const isCatalogMode = !!onApply;

  const [purpose, setPurpose] = useState(initialValues?.purpose ?? '');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [areaFrom, setAreaFrom] = useState(initialValues?.areaFrom ?? '');
  const [areaTo, setAreaTo] = useState(initialValues?.areaTo ?? '');
  const [priceFrom, setPriceFrom] = useState(initialValues?.priceFrom ?? '');
  const [priceTo, setPriceTo] = useState(initialValues?.priceTo ?? '');
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, boolean>>(
    initialValues?.activeFilters ?? INITIAL_FILTERS
  );
  const [mounted, setMounted] = useState(false);
  const [mapListings, setMapListings] = useState<MapListingFull[]>([]);
  const mapFetchedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (viewMode !== 'map' || mapFetchedRef.current) return;
    mapFetchedRef.current = true;
    fetch('/api/map-listings')
      .then(r => r.json())
      .then(data => setMapListings(data))
      .catch(() => {});
  }, [viewMode]);

  const locationRef = useRef<HTMLDivElement>(null);

  const allLocations = useMemo(
    () => propLocations ?? [],
    [propLocations]
  );

  const countByType = useMemo(
    () => propCountByType ?? {},
    [propCountByType]
  );

  const suggestions = useMemo(() => {
    const q = location.trim().toLowerCase();
    if (q.length === 0) return allLocations.slice(0, 8);
    return allLocations.filter(loc => loc.toLowerCase().includes(q)).slice(0, 8);
  }, [location, allLocations]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  const filteredMapListings = useMemo(() => {
    let result = mapListings;
    if (purpose) result = result.filter(l => l.landType === purpose || l.purpose === purpose);
    if (areaFrom) { const v = parseFloat(areaFrom); if (v > 0) result = result.filter(l => l.area >= v); }
    if (areaTo)   { const v = parseFloat(areaTo);   if (v > 0) result = result.filter(l => l.area <= v); }
    if (priceFrom) { const v = parseInt(priceFrom.replace(/\D/g, '')); if (v) result = result.filter(l => l.price >= v); }
    if (priceTo)   { const v = parseInt(priceTo.replace(/\D/g, ''));   if (v) result = result.filter(l => l.price <= v); }
    if (activeFilters.isPledged)      result = result.filter(l => l.isPledged === false);
    if (activeFilters.isOnRedLine)    result = result.filter(l => l.isOnRedLine === false);
    if (activeFilters.isDivisible)    result = result.filter(l => l.isDivisible === true);
    if (activeFilters.hasElectricity) result = result.filter(l => l.hasElectricity === true);
    if (activeFilters.hasGas)         result = result.filter(l => l.hasGas === true);
    if (activeFilters.hasWater)       result = result.filter(l => l.hasWater === true);
    if (activeFilters.hasSewer)       result = result.filter(l => l.hasSewer === true);
    if (activeFilters.hasRoadAccess)  result = result.filter(l => l.hasRoadAccess === true);
    return result;
  }, [mapListings, purpose, areaFrom, areaTo, priceFrom, priceTo, activeFilters]);

  const matchCount = purpose ? (countByType[purpose] ?? 0) : (totalCount ?? 0);

  const handleSearch = () => {
    if (isCatalogMode) {
      onApply!({ purpose, areaFrom, areaTo, priceFrom, priceTo, activeFilters });
      return;
    }
    pushDataLayer('search_submit', { type: purpose || null, location: location || null, view_mode: viewMode });
    const params = new URLSearchParams();
    if (purpose) params.set('type', purpose);
    if (priceFrom) params.set('priceFrom', priceFrom);
    if (priceTo) params.set('priceTo', priceTo);
    if (areaFrom) params.set('areaFrom', areaFrom);
    if (areaTo) params.set('areaTo', areaTo);
    if (location) params.set('location', location);
    if (viewMode === 'map') params.set('view', 'map');
    (Object.entries(activeFilters) as [FilterKey, boolean][]).forEach(([key, value]) => {
      if (value) params.set(key, 'true');
    });
    router.push(`/catalog${params.toString() ? '?' + params.toString() : ''}`);
  };

  const widget = (
    <div className="mx-auto max-w-7xl rounded-2xl bg-white shadow-[0_8px_48px_-8px_rgba(0,0,0,0.14)] border border-zinc-200">

      {/* Строка 1: Вкладки назначения + List/Map (только главная) */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-5 pb-0">
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {PURPOSES.map(p => {
              const cnt = p.value === '' ? (totalCount ?? 0) : (countByType[p.value] ?? 0);
              return (
                <button
                  key={p.value}
                  onClick={() => setPurpose(p.value)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-5 py-2.5 text-[13px] sm:text-[14px] font-bold rounded-t-xl border-b-2 transition-all ${
                    purpose === p.value
                      ? 'border-primary text-primary bg-primary-soft/30'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  {p.label}
                  {mounted && cnt > 0 && (
                    <span className={`text-[11px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md ${
                      purpose === p.value ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>

        {!isCatalogMode && (
          <div className="flex items-center shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-1 gap-1 ml-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-[13px] font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <List className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Список</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-[13px] font-semibold transition-all ${
                viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Map className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Карта</span>
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-zinc-100 mx-6" />

      {/* Строка 2: Основные поля */}
      <div className={`grid gap-4 px-6 pt-5 pb-4 ${isCatalogMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>

        {/* Локация (только главная) */}
        {!isCatalogMode && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Локация</label>
            <div ref={locationRef} className="relative">
              <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Город, район, трасса..."
                  value={location}
                  onChange={e => { setLocation(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none"
                />
                {location && (
                  <button onClick={() => { setLocation(''); setShowSuggestions(false); }} tabIndex={-1} className="shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto" style={{ zIndex: 9999 }}>
                  {suggestions.map(loc => (
                    <button key={loc} onMouseDown={e => e.preventDefault()} onClick={() => { setLocation(loc); setShowSuggestions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 text-left transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Площадь */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Площадь, сот.</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
              <Ruler className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input type="number" placeholder="От" value={areaFrom} onChange={e => setAreaFrom(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
            <span className="text-zinc-300 text-lg shrink-0">—</span>
            <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
              <input type="number" placeholder="До" value={areaTo} onChange={e => setAreaTo(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
          </div>
        </div>

        {/* Цена */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Цена, ₸</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
              <Wallet className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input type="number" placeholder="От" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
            <span className="text-zinc-300 text-lg shrink-0">—</span>
            <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
              <input type="number" placeholder="До" value={priceTo} onChange={e => setPriceTo(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
          </div>
        </div>

      </div>

      {/* Строка 3: Коммуникации + Юр. чистота + Кнопка */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 px-6 pb-5 border-t border-zinc-100 pt-4">

        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Коммуникации на участке</span>
            <div className="flex flex-wrap gap-2">
              {UTILITIES.map(({ key, icon: Icon, label, active }) => (
                <button key={key} onClick={() => toggleFilter(key as FilterKey)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition-all active:scale-95 select-none ${
                    activeFilters[key as FilterKey] ? active : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-white'
                  }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px bg-zinc-100 self-stretch mx-1" />

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Юридическая чистота</span>
            <div className="flex flex-wrap gap-2">
              {LEGAL_FILTERS.map(({ key, icon: Icon, label, active }) => (
                <button key={key} onClick={() => toggleFilter(key as FilterKey)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition-all active:scale-95 select-none ${
                    activeFilters[key as FilterKey] ? active : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:bg-white'
                  }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSearch}
          className="flex w-full lg:w-auto shrink-0 items-center justify-center gap-2.5 rounded-xl bg-primary px-10 py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95">
          <Search className="w-5 h-5" strokeWidth={2.5} />
          {isCatalogMode
            ? `Показать ${matchCount} объявлений`
            : (activeCount > 0 || purpose || areaFrom || areaTo || priceFrom || priceTo)
              ? `Найти · ${matchCount} объявлений`
              : 'Найти участки'}
        </button>

      </div>

      {/* Карта — только отфильтрованные */}
      {!isCatalogMode && viewMode === 'map' && (
        <div className="mx-6 mb-6 -mt-1">
          <MapView listings={filteredMapListings} />
        </div>
      )}

    </div>
  );

  if (isCatalogMode) return widget;

  return (
    <Container className="relative z-20 -mt-12 mb-16">
      {widget}
    </Container>
  );
}
