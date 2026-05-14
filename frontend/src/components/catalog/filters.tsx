'use client';

import { useMemo, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Listing } from '@/types/listing';

// ── Dual Range Slider ────────────────────────────────────────────────────────
export function DualSlider({ min, max, from, to, step = 1, onChange }: {
  min: number; max: number;
  from: number; to: number;
  step?: number;
  onChange: (from: number, to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const snap  = useCallback((v: number) => Math.round(v / step) * step, [step]);
  const pct   = (v: number) => ((v - min) / (max - min)) * 100;

  const valFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    return snap(clamp(min + ((clientX - rect.left) / rect.width) * (max - min), min, max));
  }, [min, max, snap]);

  const startDrag = (thumb: 'from' | 'to') => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDrag = (thumb: 'from' | 'to') => (e: React.PointerEvent) => {
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    const v = valFromX(e.clientX);
    if (thumb === 'from') onChange(clamp(v, min, to - step), to);
    else onChange(from, clamp(v, from + step, max));
  };

  const fromPct = pct(from);
  const toPct   = pct(to);

  return (
    <div ref={trackRef} className="relative h-5 flex items-center select-none">
      <div className="absolute inset-x-0 h-1.5 bg-zinc-200 rounded-full" />
      <div
        className="absolute h-1.5 bg-primary rounded-full"
        style={{ left: `${fromPct}%`, right: `${100 - toPct}%` }}
      />
      {([['from', fromPct], ['to', toPct]] as const).map(([thumb, p]) => (
        <div
          key={thumb}
          className="absolute w-[18px] h-[18px] bg-white border-2 border-primary rounded-full shadow cursor-grab active:cursor-grabbing touch-none -translate-x-1/2"
          style={{ left: `${p}%`, zIndex: 5 }}
          onPointerDown={startDrag(thumb)}
          onPointerMove={onDrag(thumb)}
        />
      ))}
    </div>
  );
}

// ── Single Range Slider ──────────────────────────────────────────────────────
export function SingleSlider({ min, max, value, step = 1, onChange }: {
  min: number; max: number; value: number; step?: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const snap   = useCallback((v: number) => Math.round(v / step) * step, [step]);
  const valFromX = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    return snap(clamp(min + ((clientX - rect.left) / rect.width) * (max - min), min, max));
  }, [min, max, snap]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div ref={trackRef} className="relative h-5 flex items-center select-none">
      <div className="absolute inset-x-0 h-1.5 bg-zinc-200 rounded-full" />
      <div className="absolute h-1.5 bg-primary rounded-full" style={{ left: 0, right: `${100 - pct}%` }} />
      <div
        className="absolute w-[18px] h-[18px] bg-white border-2 border-primary rounded-full shadow cursor-grab active:cursor-grabbing touch-none -translate-x-1/2"
        style={{ left: `${pct}%`, zIndex: 5 }}
        onPointerDown={e => (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}
        onPointerMove={e => {
          if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
          onChange(valFromX(e.clientX));
        }}
      />
    </div>
  );
}

// ── Histogram ────────────────────────────────────────────────────────────────
export function Histogram({ values, min, max, from, to, buckets = 20 }: {
  values: number[]; min: number; max: number;
  from: number; to: number; buckets?: number;
}) {
  const counts = useMemo(() => {
    const arr = Array(buckets).fill(0);
    const size = (max - min) / buckets || 1;
    for (const v of values) {
      const i = Math.min(Math.floor((v - min) / size), buckets - 1);
      if (i >= 0) arr[i]++;
    }
    return arr;
  }, [values, min, max, buckets]);

  const maxCount = Math.max(...counts, 1);
  const size = (max - min) / buckets || 1;

  return (
    <div className="flex items-end gap-px h-9">
      {counts.map((count, i) => {
        const bMin = min + i * size;
        const bMax = bMin + size;
        const inRange = bMax > from && bMin < to;
        return (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-colors duration-100 ${inRange ? 'bg-primary' : 'bg-zinc-200'}`}
            style={{ height: `${Math.max((count / maxCount) * 100, 4)}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-zinc-300'}`}
    >
      <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-[18px] h-[18px] rounded-[5px] border flex-shrink-0 flex items-center justify-center transition-all ${
        checked ? 'bg-primary border-primary' : 'border-zinc-300 hover:border-zinc-400'
      }`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface CatalogFiltersProps {
  allListings: Listing[];
  selectedCategories: string[];
  onChangeCategories: (cats: string[]) => void;
  location: string;
  setLocation: (v: string) => void;
  areaFrom: string; setAreaFrom: (v: string) => void;
  areaTo: string;   setAreaTo:   (v: string) => void;
  priceFrom: string; setPriceFrom: (v: string) => void;
  priceTo: string;   setPriceTo:   (v: string) => void;
  hasElectricity: boolean; setHasElectricity: (v: boolean) => void;
  hasGas: boolean;         setHasGas:         (v: boolean) => void;
  hasWater: boolean;       setHasWater:       (v: boolean) => void;
  hasSewer: boolean;       setHasSewer:       (v: boolean) => void;
  hasRoadAccess: boolean;  setHasRoadAccess:  (v: boolean) => void;
  isPledged:   boolean; setIsPledged:   (v: boolean) => void;
  isOnRedLine: boolean; setIsOnRedLine: (v: boolean) => void;
  isDivisible: boolean; setIsDivisible: (v: boolean) => void;
  hasStateAct: boolean; setHasStateAct: (v: boolean) => void;
  hasCadastral: boolean; setHasCadastral: (v: boolean) => void;
  purposeIJS: boolean;   setPurposeIJS:   (v: boolean) => void;
  selectedCities: string[]; setSelectedCities: (v: string[]) => void;
  nearWater:     boolean; setNearWater:     (v: boolean) => void;
  mountainView:  boolean; setMountainView:  (v: boolean) => void;
  onlyFromOwner: boolean; setOnlyFromOwner: (v: boolean) => void;
  hasBuilding:   boolean; setHasBuilding:   (v: boolean) => void;
  distanceFromCity: number; setDistanceFromCity: (v: number) => void;
  resultCount: number;
  onClose?: () => void;
}

const AREA_PRESETS = [
  { label: 'до 6 со',   from: 0,  to: 6   },
  { label: '6–15 со',   from: 6,  to: 15  },
  { label: '15–30 со',  from: 15, to: 30  },
  { label: '30–100 со', from: 30, to: 100 },
];

// ── Component ────────────────────────────────────────────────────────────────
export function CatalogFilters({
  allListings,
  selectedCategories, onChangeCategories,
  location, setLocation,
  areaFrom, setAreaFrom, areaTo, setAreaTo,
  priceFrom, setPriceFrom, priceTo, setPriceTo,
  hasElectricity, setHasElectricity,
  hasGas,         setHasGas,
  hasWater,       setHasWater,
  hasSewer,       setHasSewer,
  hasRoadAccess,  setHasRoadAccess,
  isPledged,   setIsPledged,
  isOnRedLine, setIsOnRedLine,
  isDivisible, setIsDivisible,
  hasStateAct,  setHasStateAct,
  hasCadastral, setHasCadastral,
  purposeIJS,   setPurposeIJS,
  selectedCities, setSelectedCities,
  nearWater,     setNearWater,
  mountainView,  setMountainView,
  onlyFromOwner, setOnlyFromOwner,
  hasBuilding,   setHasBuilding,
  distanceFromCity, setDistanceFromCity,
  resultCount,
  onClose,
}: CatalogFiltersProps) {

  // ── Area ────────────────────────────────────────────────────────────────────
  const areaValues = useMemo(() => allListings.map(l => l.area).filter(a => a > 0), [allListings]);
  const AREA_MAX   = useMemo(() => Math.min(Math.ceil(Math.max(...areaValues, 100) / 10) * 10, 500), [areaValues]);
  const AREA_MIN   = 0;
  const areaFromNum = Math.max(parseFloat(areaFrom) || AREA_MIN, AREA_MIN);
  const areaToNum   = Math.min(parseFloat(areaTo)   || AREA_MAX, AREA_MAX);
  const areaLabel   = (areaFromNum > AREA_MIN || areaToNum < AREA_MAX)
    ? `${areaFromNum}–${areaToNum} соток` : null;

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    hasStateAct:   allListings.filter(l => (l as Listing & { hasStateAct?: boolean }).hasStateAct === true).length,
    isDivisible:   allListings.filter(l => l.isDivisible === true).length,
    hasCadastral:  allListings.filter(l => !!(l.cadastralNumber && l.cadastralNumber.length > 0)).length,
    purposeIJS:    allListings.filter(l => l.landType === 'ИЖС' || l.purpose === 'ИЖС').length,
    onlyFromOwner: allListings.filter(l => !l.seller?.isAgency).length,
    electricity:   allListings.filter(l => l.hasElectricity).length,
    gas:           allListings.filter(l => l.hasGas).length,
    water:         allListings.filter(l => l.hasWater).length,
    sewer:         allListings.filter(l => l.hasSewer).length,
    road:          allListings.filter(l => l.hasRoadAccess).length,
  }), [allListings]);

  // ── Active count ─────────────────────────────────────────────────────────────
  const activeCount = [
    selectedCategories.length > 0, !!location,
    !!areaFrom || !!areaTo, !!priceFrom || !!priceTo,
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible, hasStateAct, hasCadastral, purposeIJS,
    selectedCities.length > 0, nearWater, mountainView, onlyFromOwner, hasBuilding,
    distanceFromCity < 100,
  ].filter(Boolean).length;

  const clearAll = () => {
    onChangeCategories([]); setLocation('');
    setAreaFrom(''); setAreaTo(''); setPriceFrom(''); setPriceTo('');
    setHasElectricity(false); setHasGas(false); setHasWater(false);
    setHasSewer(false); setHasRoadAccess(false);
    setIsPledged(false); setIsOnRedLine(false); setIsDivisible(false);
    setHasStateAct(false); setHasCadastral(false); setPurposeIJS(false);
    setSelectedCities([]); setNearWater(false); setMountainView(false);
    setOnlyFromOwner(false); setHasBuilding(false);
    setDistanceFromCity(100);
  };

  const utilItems = [
    { key: 'electricity', label: 'Свет 380В',  count: counts.electricity, value: hasElectricity, set: setHasElectricity },
    { key: 'water',       label: 'Вода',        count: counts.water,       value: hasWater,       set: setHasWater },
    { key: 'gas',         label: 'Газ',         count: counts.gas,         value: hasGas,         set: setHasGas },
    { key: 'sewer',       label: 'Канализация', count: counts.sewer,       value: hasSewer,       set: setHasSewer },
    { key: 'road',        label: 'Дорога',      count: counts.road,        value: hasRoadAccess,  set: setHasRoadAccess },
  ];

  return (
    <div className="flex flex-col overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-zinc-100 shrink-0">
        <div>
          <h2 className="text-[28px] font-black tracking-tighter text-zinc-900 leading-none">Фильтры</h2>
          {activeCount > 0 && (
            <p className="mt-1 text-[12px] text-zinc-400">{activeCount} активных параметра</p>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg text-zinc-500 hover:bg-zinc-100 flex items-center justify-center transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="divide-y divide-zinc-100">

          {/* Area */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] font-bold text-zinc-900">Площадь</span>
              <span className="font-mono text-[11.5px] text-zinc-500">{areaLabel ?? 'любая'}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">Соток · по {allListings.length} объявлениям</p>
            <Histogram values={areaValues} min={AREA_MIN} max={AREA_MAX} from={areaFromNum} to={areaToNum} />
            <div className="mt-2">
              <DualSlider min={AREA_MIN} max={AREA_MAX} from={areaFromNum} to={areaToNum} step={1}
                onChange={(f, t) => { setAreaFrom(f > AREA_MIN ? String(f) : ''); setAreaTo(t < AREA_MAX ? String(t) : ''); }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">от</div>
                <input type="number" placeholder="0" value={areaFrom} onChange={e => setAreaFrom(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-[14px] font-bold text-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
              </label>
              <label className="block">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">до</div>
                <input type="number" placeholder="Любая" value={areaTo} onChange={e => setAreaTo(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-[14px] font-bold text-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {AREA_PRESETS.map(p => {
                const isOn = areaFromNum === p.from && areaToNum === p.to;
                return (
                  <button key={p.label}
                    onClick={() => { setAreaFrom(p.from > 0 ? String(p.from) : ''); setAreaTo(p.to < AREA_MAX ? String(p.to) : ''); }}
                    className={`px-2.5 h-7 rounded-full text-[12px] font-medium border transition-all ${isOn ? 'bg-primary border-primary text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
                  >{p.label}</button>
                );
              })}
            </div>
          </div>

          {/* Documents */}
          <div className="px-6 pt-6 pb-5">
            <span className="text-[14px] font-bold text-zinc-900 block mb-4">Документы</span>
            <div className="space-y-3">
              {[
                { label: 'Акт на землю',              count: counts.hasStateAct,  value: hasStateAct,  set: setHasStateAct  },
                { label: 'Межевание выполнено',        count: counts.isDivisible,  value: isDivisible,  set: setIsDivisible  },
                { label: 'Кадастровый паспорт',        count: counts.hasCadastral, value: hasCadastral, set: setHasCadastral },
                { label: 'Целевое назначение под ИЖС', count: counts.purposeIJS,   value: purposeIJS,   set: setPurposeIJS   },
              ].map(({ label, count, value, set }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox checked={value} onToggle={() => set(!value)} />
                  <span className={`text-[13.5px] flex-1 transition-colors ${value ? 'text-zinc-900 font-medium' : 'text-zinc-700 group-hover:text-zinc-900'}`}>{label}</span>
                  <span className="text-[11px] font-mono text-zinc-400 tabular-nums">{count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Communications */}
          <div className="px-6 pt-6 pb-5">
            <span className="text-[14px] font-bold text-zinc-900 block mb-4">Коммуникации</span>
            <div className="flex flex-wrap gap-1.5">
              {utilItems.map(({ key, label, count, value, set }) => (
                <button key={key} onClick={() => set(!value)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-[12.5px] font-semibold border transition-all ${
                    value
                      ? 'bg-primary-soft border-primary text-zinc-900'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {value && (
                    <span className="w-3 h-3 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                  {label}
                  {!value && <span className="text-[10px] font-mono text-zinc-400 ml-0.5">{count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Distance from Almaty */}
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] font-bold text-zinc-900">До Алматы</span>
              <span className="font-mono text-[11.5px] text-zinc-500">
                {distanceFromCity >= 100 ? 'любое расстояние' : `до ${distanceFromCity} км`}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">В километрах по прямой</p>
            <SingleSlider min={5} max={100} value={distanceFromCity} step={5}
              onChange={setDistanceFromCity}
            />
            <div className="mt-2 flex justify-between text-[10.5px] font-mono text-zinc-400">
              <span>5</span><span>25</span><span>50</span><span>75</span><span>100+</span>
            </div>
          </div>

          {/* Features */}
          <div className="px-6 pt-6 pb-5">
            <span className="text-[14px] font-bold text-zinc-900 block mb-4">Особенности</span>
            <div className="space-y-3.5">
              {[
                { label: 'У воды (река, озеро)', value: nearWater,     set: setNearWater     },
                { label: 'Вид на горы',          value: mountainView,  set: setMountainView  },
                { label: 'Только от хозяина',    value: onlyFromOwner, set: setOnlyFromOwner, count: counts.onlyFromOwner },
                { label: 'С готовой постройкой', value: hasBuilding,   set: setHasBuilding   },
              ].map(({ label, value, set, count }) => (
                <label key={label} className="flex items-center cursor-pointer group">
                  <span className={`text-[13.5px] flex-1 transition-colors ${value ? 'text-zinc-900 font-medium' : 'text-zinc-700 group-hover:text-zinc-900'}`}>{label}</span>
                  {count !== undefined && !value && <span className="text-[11px] font-mono text-zinc-400 mr-3">{count}</span>}
                  <Toggle on={value} onToggle={() => set(!value)} />
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-4 border-t border-zinc-100 shrink-0 bg-white flex items-center gap-3">
        <button
          onClick={clearAll}
          className={`text-[13px] font-medium transition-colors whitespace-nowrap ${activeCount > 0 ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-300 pointer-events-none'}`}
        >
          {activeCount > 0 ? `Сбросить (${activeCount})` : 'Сбросить'}
        </button>
        <div className="flex-1" />
        <button onClick={onClose}
          className="h-11 px-5 rounded-xl bg-zinc-900 text-[13px] font-semibold text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          Показать {resultCount.toLocaleString('ru-RU')} участков →
        </button>
      </div>

    </div>
  );
}
