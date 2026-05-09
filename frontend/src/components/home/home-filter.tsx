'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';

const CATEGORIES = [
  { value: '',          label: 'Все' },
  { value: 'ИЖС',      label: 'ИЖС' },
  { value: 'МЖС',      label: 'МЖС' },
  { value: 'ЛПХ',      label: 'ЛПХ' },
  { value: 'Дача',     label: 'Дача' },
  { value: 'Сельхоз',  label: 'Сельхоз' },
  { value: 'Коммерция', label: 'Коммерция' },
  { value: 'Промзона', label: 'Промзона' },
  { value: 'Рекреация', label: 'Рекреация' },
];

const POPULAR = [
  'Талгар, до 15 млн',
  'Капчагай у воды',
  'Дача с домом',
  'Под кафе на трассе',
  'Поливная земля',
];

interface FilterItem {
  landType: string;
  location: string;
  price: number;
  area: number;
}

interface Props {
  locations: string[];
  totalCount: number;
  countByType: Record<string, number>;
  filterData: FilterItem[];
}

export function HomeFilter({ locations, totalCount, countByType, filterData }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [areaFrom, setAreaFrom] = useState('');
  const [areaUnit, setAreaUnit] = useState<'sot' | 'ga'>('sot');
  const [priceTo, setPriceTo] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  const count = useMemo(() => {
    const hasFilters = category || location.trim() || areaFrom || priceTo;
    if (!hasFilters) return totalCount;
    const areaFromSot = areaFrom
      ? areaUnit === 'ga' ? parseFloat(areaFrom) * 100 : parseFloat(areaFrom)
      : 0;
    const priceToNum = priceTo ? parseInt(priceTo.replace(/\s/g, ''), 10) : 0;
    const loc = location.trim().toLowerCase();
    return filterData.filter(l => {
      if (category && l.landType !== category) return false;
      if (loc && !l.location.toLowerCase().includes(loc)) return false;
      if (areaFromSot && l.area < areaFromSot) return false;
      if (priceToNum && l.price > priceToNum) return false;
      return true;
    }).length;
  }, [category, location, areaFrom, areaUnit, priceTo, filterData, totalCount]);

  const suggestions = useMemo(() => {
    const q = location.trim().toLowerCase();
    if (!q) return locations.slice(0, 6);
    return locations.filter(l => l.toLowerCase().includes(q)).slice(0, 6);
  }, [location, locations]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setShowArea(false);
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) setShowPrice(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (loc?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('type', category);
    if (loc ?? location) params.set('location', loc ?? location);
    if (areaFrom) {
      const sotkiValue = areaUnit === 'ga' ? String(parseFloat(areaFrom) * 100) : areaFrom;
      params.set('areaFrom', sotkiValue);
    }
    if (priceTo) params.set('priceTo', priceTo.replace(/\s/g, ''));
    router.push(`/catalog${params.size ? '?' + params : ''}`);
  };

  const fmtPrice = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <div className="w-full">
      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-zinc-100 overflow-visible">

        {/* Category tabs + fields row */}
        <div className="flex items-stretch min-h-[64px]">

          {/* Categories */}
          <div className="flex items-center gap-1 px-3 border-r border-zinc-100 shrink-0">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${
                  category === c.value
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Location */}
          <div ref={locationRef} className="relative flex-1 border-r border-zinc-100 min-w-0">
            <div className="flex flex-col justify-center h-full px-4 cursor-text" onClick={() => setShowSuggestions(true)}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Где</p>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Город или район"
                  value={location}
                  onChange={e => { setLocation(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => e.key === 'Enter' && go()}
                  className="w-full bg-transparent text-[14px] font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
              </div>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
                {suggestions.map(loc => (
                  <button key={loc} onMouseDown={e => e.preventDefault()}
                    onClick={() => { setLocation(loc); setShowSuggestions(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 text-left"
                  >
                    <MapPin className="size-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Area */}
          <div ref={areaRef} className="relative border-r border-zinc-100 shrink-0">
            <button
              onClick={() => { setShowArea(v => !v); setShowPrice(false); }}
              className="flex flex-col justify-center h-full px-4 text-left hover:bg-zinc-50 transition-colors"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Площадь</p>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-zinc-900 whitespace-nowrap">
                  {areaFrom ? `от ${areaFrom} ${areaUnit === 'ga' ? 'га' : 'сот.'}` : 'Любая'}
                </span>
                <ChevronDown className="size-3.5 text-zinc-400" />
              </div>
            </button>
            {showArea && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 p-4 w-56">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">От</p>
                  <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-[11px] font-bold">
                    <button onClick={() => setAreaUnit('sot')}
                      className={`px-2.5 py-1 transition-colors ${areaUnit === 'sot' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>
                      сот.
                    </button>
                    <button onClick={() => setAreaUnit('ga')}
                      className={`px-2.5 py-1 transition-colors ${areaUnit === 'ga' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>
                      га
                    </button>
                  </div>
                </div>
                <input type="number" placeholder={areaUnit === 'ga' ? '0.5' : '6'} value={areaFrom}
                  onChange={e => setAreaFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[14px] font-semibold text-zinc-900 outline-none focus:border-primary"
                />
                {areaUnit === 'ga' && areaFrom && (
                  <p className="mt-1.5 text-[11px] text-zinc-400">= {parseFloat(areaFrom) * 100} соток</p>
                )}
                {areaUnit === 'sot' && areaFrom && (
                  <p className="mt-1.5 text-[11px] text-zinc-400">= {(parseFloat(areaFrom) / 100).toFixed(2)} га</p>
                )}
              </div>
            )}
          </div>

          {/* Price */}
          <div ref={priceRef} className="relative border-r border-zinc-100 shrink-0">
            <button
              onClick={() => { setShowPrice(v => !v); setShowArea(false); }}
              className="flex flex-col justify-center h-full px-4 text-left hover:bg-zinc-50 transition-colors"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Цена, ₸</p>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-semibold text-zinc-900 whitespace-nowrap">
                  {priceTo ? `до ${priceTo}` : 'Любая'}
                </span>
                <ChevronDown className="size-3.5 text-zinc-400" />
              </div>
            </button>
            {showPrice && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 p-4 w-52">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">До (₸)</p>
                <input type="text" placeholder="25 000 000" value={priceTo}
                  onChange={e => setPriceTo(fmtPrice(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[14px] font-semibold text-zinc-900 outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            onClick={() => go()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-black text-[15px] px-6 m-2 rounded-xl transition-colors duration-150 shrink-0 whitespace-nowrap"
          >
            Найти {count > 0 && <span className="font-black">{count}</span>}
            <span className="text-white/70">→</span>
          </button>
        </div>
      </div>

    </div>
  );
}
