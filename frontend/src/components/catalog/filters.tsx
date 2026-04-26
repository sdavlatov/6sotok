'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { MapPin, Ruler, Wallet, List, Map } from 'lucide-react';
import { LAND_CATEGORIES, UTILITIES, LEGAL_FILTERS } from '@/lib/listing-constants';
import { allListings } from '@/lib/mock-data';

const QUICK_CITIES = ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Қарағанды', 'Алматинская обл.'];

interface CatalogFiltersProps {
  selectedCategories: string[];
  onChangeCategories: (cats: string[]) => void;
  location: string;
  setLocation: (v: string) => void;
  areaFrom: string; setAreaFrom: (v: string) => void;
  areaTo: string;   setAreaTo: (v: string) => void;
  priceFrom: string; setPriceFrom: (v: string) => void;
  priceTo: string;   setPriceTo: (v: string) => void;
  hasElectricity: boolean; setHasElectricity: (v: boolean) => void;
  hasGas: boolean;         setHasGas: (v: boolean) => void;
  hasWater: boolean;       setHasWater: (v: boolean) => void;
  hasSewer: boolean;       setHasSewer: (v: boolean) => void;
  hasRoadAccess: boolean;  setHasRoadAccess: (v: boolean) => void;
  isPledged: boolean;    setIsPledged: (v: boolean) => void;
  isOnRedLine: boolean;  setIsOnRedLine: (v: boolean) => void;
  isDivisible: boolean;  setIsDivisible: (v: boolean) => void;
  resultCount: number;
  onClose?: () => void;
  viewMode?: 'list' | 'map';
  onViewModeChange?: (v: 'list' | 'map') => void;
}

export function CatalogFilters({
  selectedCategories, onChangeCategories,
  location, setLocation,
  areaFrom, setAreaFrom, areaTo, setAreaTo,
  priceFrom, setPriceFrom, priceTo, setPriceTo,
  hasElectricity, setHasElectricity,
  hasGas, setHasGas,
  hasWater, setHasWater,
  hasSewer, setHasSewer,
  hasRoadAccess, setHasRoadAccess,
  isPledged, setIsPledged,
  isOnRedLine, setIsOnRedLine,
  isDivisible, setIsDivisible,
  resultCount,
  onClose,
  viewMode,
  onViewModeChange,
}: CatalogFiltersProps) {
  const isMobile = !!onClose;

  const [showSuggestions, setShowSuggestions] = useState(false);
  const geoRef = useRef<HTMLDivElement>(null);

  // Для мобильного dropdown используем position: fixed с вычисленными координатами,
  // чтобы он не обрезался overflow-y: auto родителя
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!showSuggestions || !isMobile || !geoRef.current) return;
    const rect = geoRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [showSuggestions, isMobile]);

  const allLocations = useMemo(
    () => [...new Set(allListings.map(l => l.location))],
    []
  );

  const suggestions = useMemo(() => {
    const q = location.trim().toLowerCase();
    if (q.length < 1) return [];
    return allLocations.filter(loc => loc.toLowerCase().includes(q)).slice(0, 8);
  }, [location, allLocations]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (geoRef.current && !geoRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const booleans: Record<string, boolean> = {
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible,
  };
  const setters: Record<string, (v: boolean) => void> = {
    hasElectricity: setHasElectricity, hasGas: setHasGas,
    hasWater: setHasWater, hasSewer: setHasSewer, hasRoadAccess: setHasRoadAccess,
    isPledged: setIsPledged, isOnRedLine: setIsOnRedLine, isDivisible: setIsDivisible,
  };

  const toggleCategory = (cat: string) => {
    onChangeCategories(
      selectedCategories.includes(cat)
        ? selectedCategories.filter(c => c !== cat)
        : [...selectedCategories, cat]
    );
  };

  const clearAll = () => {
    onChangeCategories([]);
    setLocation('');
    setAreaFrom(''); setAreaTo('');
    setPriceFrom(''); setPriceTo('');
    Object.keys(setters).forEach(k => setters[k](false));
  };

  const activeCount = [
    selectedCategories.length > 0,
    !!location,
    !!areaFrom || !!areaTo,
    !!priceFrom || !!priceTo,
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible,
  ].filter(Boolean).length;

  return (
    <div className={`bg-white ${
      isMobile
        ? 'flex flex-col overflow-hidden'
        : 'rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] lg:sticky lg:top-28'
    }`}>

      {/* Шапка */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-black text-zinc-900">Фильтры</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-[10px] font-black">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Список / Карта — компактный вариант */}
          {onViewModeChange && (
            <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 gap-0.5">
              <button
                onClick={() => onViewModeChange('list')}
                title="Список"
                className={`flex items-center rounded-lg px-2.5 py-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <List className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
              <button
                onClick={() => onViewModeChange('map')}
                title="Карта"
                className={`flex items-center rounded-lg px-2.5 py-1.5 transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Map className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-[12px] font-bold text-zinc-400 hover:text-red-500 transition-colors whitespace-nowrap">
              Сбросить
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Скроллируемый контент — overflow здесь, а не в wrapper каталога */}
      <div className={`flex flex-col gap-6 p-5 ${isMobile ? 'flex-1 overflow-y-auto overscroll-contain' : ''}`}>

        {/* Назначение */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Назначение</span>
          <div className="flex flex-wrap gap-2">
            {LAND_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${
                  selectedCategories.includes(cat)
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Локация */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Локация</span>

          {/* Быстрый выбор */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CITIES.map(city => (
              <button key={city}
                onClick={() => { setLocation(location === city ? '' : city); setShowSuggestions(false); }}
                className={`px-2.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
                  location === city
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }`}>
                {city}
              </button>
            ))}
          </div>

          {/* Свободный ввод */}
          <div ref={geoRef} className="relative">
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-primary focus-within:bg-white transition-all">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input
                type="text"
                placeholder="Город, район, трасса, посёлок..."
                value={location}
                onChange={e => { setLocation(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent text-[13px] font-medium text-zinc-900 placeholder-zinc-400 outline-none"
              />
              {location && (
                <button onClick={() => { setLocation(''); setShowSuggestions(false); }} tabIndex={-1}
                  className="shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              isMobile ? (
                // position: fixed — не обрезается overflow-y: auto родителя
                <div
                  className="bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
                  style={dropdownStyle}
                >
                  {suggestions.map(loc => (
                    <button key={loc}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setLocation(loc); setShowSuggestions(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 text-left transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                      {loc}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden max-h-52 overflow-y-auto" style={{ zIndex: 9999 }}>
                  {suggestions.map(loc => (
                    <button key={loc}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setLocation(loc); setShowSuggestions(false); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 text-left transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                      {loc}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Площадь */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Площадь, сот.</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-primary focus-within:bg-white transition-all">
              <Ruler className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input type="number" placeholder="От" value={areaFrom} onChange={e => setAreaFrom(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
            <span className="text-zinc-300 font-medium">—</span>
            <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-primary focus-within:bg-white transition-all">
              <input type="number" placeholder="До" value={areaTo} onChange={e => setAreaTo(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
          </div>
        </div>

        {/* Цена */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Цена, ₸</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-primary focus-within:bg-white transition-all">
              <Wallet className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input type="text" placeholder="От" value={priceFrom} onChange={e => setPriceFrom(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
            <span className="text-zinc-300 font-medium">—</span>
            <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 focus-within:border-primary focus-within:bg-white transition-all">
              <input type="text" placeholder="До" value={priceTo} onChange={e => setPriceTo(e.target.value)}
                className="w-full bg-transparent text-[13px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
            </div>
          </div>
        </div>

        {/* Коммуникации */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Коммуникации на участке</span>
          <div className="flex flex-wrap gap-2">
            {UTILITIES.map(({ key, icon: Icon, label, active }) => (
              <button key={key} onClick={() => setters[key](!booleans[key])}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all active:scale-95 select-none ${
                  booleans[key] ? active : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-white'
                }`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Юридическая чистота */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">Юридическая чистота</span>
          <div className="flex flex-wrap gap-2">
            {LEGAL_FILTERS.map(({ key, icon: Icon, label, active }) => (
              <button key={key} onClick={() => setters[key](!booleans[key])}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all active:scale-95 select-none ${
                  booleans[key] ? active : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-white'
                }`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* CTA — прилипает к низу шторки */}
      {onClose && (
        <div className="px-5 pb-8 pt-3 border-t border-zinc-100 shrink-0">
          <button onClick={onClose}
            className="w-full rounded-2xl bg-primary py-4 text-[14px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95">
            Показать {resultCount} объявлений
          </button>
        </div>
      )}

    </div>
  );
}
