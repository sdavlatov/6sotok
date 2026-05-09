'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SlidersHorizontal, List, Map, X } from 'lucide-react';
import { MapView, type MapItem, type MapApi, formatPrice } from '@/components/catalog/map-view';
import { CatalogFilters } from '@/components/catalog/filters';
import { CatalogSort } from '@/components/catalog/sort';
import { LAND_CATEGORIES } from '@/lib/listing-constants';
import type { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import Link from 'next/link';

type ViewMode = 'list' | 'map';
type TileLayer = 'schema' | 'satellite';

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
  initialViewMode?: ViewMode;
  allListings: Listing[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

function relDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'сегодня';
  if (d === 1) return 'вчера';
  if (d < 7)  return `${d} дн`;
  if (d < 30) return `${Math.floor(d / 7)} нед`;
  return `${Math.floor(d / 30)} мес`;
}

// ── Compact sidebar card ─────────────────────────────────────────────────────
function SidebarCard({ listing, active, onEnter, onLeave, cardRef }: {
  listing: Listing;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const img = listing.images?.[0] ?? listing.image ?? null;
  const typeLabel = listing.purpose || listing.landType || '';
  const perSotka = listing.area > 0 ? Math.round(listing.price / listing.area) : 0;

  const chips = [
    listing.hasElectricity && 'Свет',
    listing.hasGas && 'Газ',
    listing.hasWater && 'Вода',
    listing.hasRoadAccess && 'Дорога',
    (listing as Listing & { hasStateAct?: boolean }).hasStateAct && 'Госакт',
  ].filter((x): x is string => typeof x === 'string');

  return (
    <div ref={cardRef}>
      <Link
        href={listingUrl(listing)}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={[
          'block px-5 py-4 border-b border-zinc-100 transition-colors border-l-2',
          active ? 'bg-zinc-50 border-l-primary' : 'border-l-transparent hover:bg-zinc-50',
        ].join(' ')}
      >
        <div className="flex gap-3">
          <div className="relative w-[120px] h-[88px] rounded-xl overflow-hidden shrink-0 bg-zinc-100">
            {img ? (
              <img src={img} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200" />
            )}
            {(listing as Listing & { isNegotiable?: boolean }).isNegotiable && (
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wide">
                Торг
              </span>
            )}
            {listing.area > 0 && (
              <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] text-zinc-700 bg-white/80 px-1 rounded">
                {listing.area} со
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider truncate">
              {typeLabel}{typeLabel && listing.location ? ' · ' : ''}{listing.location}
            </p>
            <h3 className="mt-0.5 font-semibold text-[14.5px] leading-snug text-zinc-900 line-clamp-2">
              {listing.title}
            </h3>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className="font-black tracking-tight text-[17px] text-zinc-900 leading-none">
                  {fmtM(listing.price)} млн ₸
                </div>
                {perSotka > 0 && (
                  <div className="mt-0.5 text-[10.5px] font-mono text-zinc-500">
                    {new Intl.NumberFormat('ru-RU').format(perSotka)} ₸/со
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 shrink-0" suppressHydrationWarning>
                {relDate(listing.createdAt)}
              </span>
            </div>
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {chips.map(c => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-5 text-center">
      <div className="rounded-2xl bg-zinc-100 p-4 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="m21 21-4.3-4.3" /><circle cx="11" cy="11" r="8" />
        </svg>
      </div>
      <p className="text-base font-semibold text-zinc-700 mb-1">Ничего не найдено</p>
      <p className="text-sm text-zinc-400 mb-4">Попробуйте изменить параметры фильтра</p>
      <button onClick={onReset} className="text-sm font-medium text-primary hover:underline">
        Сбросить фильтры
      </button>
    </div>
  );
}

// ── Map overlay controls ──────────────────────────────────────────────────────
function MapStatsOverlay({ count, median, perSotka }: {
  count: number;
  median: number;
  perSotka: number;
}) {
  return (
    <div className="absolute top-4 left-4 z-[400] pointer-events-none">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex divide-x divide-zinc-100 text-[12px] pointer-events-auto">
        <div className="px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">видимо</div>
          <div className="font-black tracking-tight text-[15px] text-zinc-900">{count.toLocaleString('ru-RU')}</div>
        </div>
        {median > 0 && (
          <div className="px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">медиана</div>
            <div className="font-black tracking-tight text-[15px] text-zinc-900">{fmtM(median)}&nbsp;млн</div>
          </div>
        )}
        {perSotka > 0 && (
          <div className="px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">за сотку</div>
            <div className="font-black tracking-tight text-[15px] text-primary">{fmtM(perSotka)}&nbsp;млн</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MapRightControls({
  tileLayer,
  onTileLayer,
  onZoomIn,
  onZoomOut,
}: {
  tileLayer: TileLayer;
  onTileLayer: (l: TileLayer) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end">
      {/* Layer tabs */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex gap-0.5 text-[12px] font-medium">
        {(['schema', 'satellite'] as TileLayer[]).map(layer => {
          const label = layer === 'schema' ? 'Схема' : 'Спутник';
          return (
            <button
              key={layer}
              onClick={() => onTileLayer(layer)}
              className={`px-3 h-7 rounded-lg transition-colors ${
                tileLayer === layer
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {label}
            </button>
          );
        })}
        {/* Non-functional tabs, visual only */}
        <button className="px-3 h-7 rounded-lg text-zinc-400 cursor-default" title="Скоро">Кадастр</button>
        <button className="px-3 h-7 rounded-lg text-zinc-400 cursor-default" title="Скоро">Тепло цен</button>
      </div>

      {/* Zoom controls */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex flex-col gap-0.5">
        <button
          onClick={onZoomIn}
          className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-[18px] flex items-center justify-center transition-colors"
        >+</button>
        <span className="h-px bg-zinc-100 mx-1.5" />
        <button
          onClick={onZoomOut}
          className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-[18px] flex items-center justify-center transition-colors"
        >−</button>
        <span className="h-px bg-zinc-100 mx-1.5" />
        <button
          className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 flex items-center justify-center font-mono text-[12px] transition-colors"
          title="Моё местоположение"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(pos => {
              // noop — map instance not exposed here
            });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>

      {/* Drawing tools (UI only) */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex flex-col gap-0.5">
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-colors" title="Нарисовать область">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <circle cx="3" cy="17" r="1.5" fill="currentColor" />
            <circle cx="9" cy="11" r="1.5" fill="currentColor" />
            <circle cx="13" cy="15" r="1.5" fill="currentColor" />
            <circle cx="21" cy="7" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-colors" title="Радиус от точки">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-colors" title="Линейка">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.6 6.6l-3.2-3.2a2 2 0 0 0-2.8 0L3.4 14.6a2 2 0 0 0 0 2.8l3.2 3.2a2 2 0 0 0 2.8 0L20.6 9.4a2 2 0 0 0 0-2.8z" />
            <path d="M9 7l1.5 1.5M11 5l1.5 1.5M13 9l1.5 1.5M15 7l1.5 1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  // Lock body scroll for full-screen layout
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Drawer / UI state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [sortOrder, setSortOrder] = useState('Сначала новые');
  const [tileLayer, setTileLayer] = useState<TileLayer>('schema');
  const [searchAsMove, setSearchAsMove] = useState(true);

  // Filter states
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

  useEffect(() => {
    if (isFiltersOpen) {
      requestAnimationFrame(() => setDrawerVisible(true));
    } else {
      setDrawerVisible(false);
    }
  }, [isFiltersOpen]);

  // Sidebar hover sync + map API
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const cardRefs      = useRef<Record<string | number, HTMLDivElement | null>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapApi        = useRef<MapApi | null>(null);

  // Count by type
  const typeCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of allListings) {
      const key = l.landType ?? l.purpose ?? '';
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [allListings]);

  // Filtered listings
  const filteredListings = useMemo(() => {
    let result = [...allListings];

    if (selectedCategories.length > 0)
      result = result.filter(l =>
        selectedCategories.includes(l.landType) ||
        (l.purpose != null && selectedCategories.includes(l.purpose))
      );
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
      hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess, allListings]);

  const activeFilterCount = useMemo(() => [
    selectedCategories.length > 0, !!location,
    !!areaFrom || !!areaTo, !!priceFrom || !!priceTo,
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible,
  ].filter(Boolean).length, [selectedCategories, location, areaFrom, areaTo,
    priceFrom, priceTo, hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible]);

  // Map stats
  const medianPrice = useMemo(() => {
    if (!filteredListings.length) return 0;
    const prices = filteredListings.map(l => l.price).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
  }, [filteredListings]);

  const avgPerSotka = useMemo(() => {
    const withArea = filteredListings.filter(l => l.area > 0);
    if (!withArea.length) return 0;
    return withArea.reduce((sum, l) => sum + l.price / l.area, 0) / withArea.length;
  }, [filteredListings]);

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

  const toggleCategory = (cat: string) =>
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

  const resetAll = () => {
    setSelectedCategories([]); setLocation('');
    setAreaFrom(''); setAreaTo(''); setPriceFrom(''); setPriceTo('');
    setHasElectricity(false); setHasGas(false); setHasWater(false);
    setHasSewer(false); setHasRoadAccess(false);
    setIsPledged(false); setIsOnRedLine(false); setIsDivisible(false);
  };

  const handleMarkerClick = useCallback((listing: MapItem) => {
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
      highlightTimer.current = null;
    }
    const el = cardRefs.current[listing.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHoveredId(listing.id);
    highlightTimer.current = setTimeout(() => setHoveredId(null), 2000);
  }, []);

  const mapListings = useMemo(
    () => filteredListings.filter(l => l.lat && l.lng),
    [filteredListings]
  );

  // Active filter chip labels
  const priceFromNum = priceFrom ? parseInt(priceFrom.replace(/\D/g, '')) || 0 : 0;
  const priceToNum   = priceTo   ? parseInt(priceTo.replace(/\D/g, ''))   || 0 : 0;
  const areaFromNum  = areaFrom  ? parseFloat(areaFrom) || 0 : 0;
  const areaToNum    = areaTo    ? parseFloat(areaTo)   || 0 : 0;

  const priceChipLabel = (priceFromNum || priceToNum)
    ? priceFromNum && priceToNum ? `${fmtM(priceFromNum)}–${fmtM(priceToNum)} млн`
      : priceToNum ? `до ${fmtM(priceToNum)} млн` : `от ${fmtM(priceFromNum)} млн`
    : null;

  const areaChipLabel = (areaFromNum || areaToNum)
    ? areaFromNum && areaToNum ? `${areaFromNum}–${areaToNum} со`
      : areaToNum ? `до ${areaToNum} со` : `от ${areaFromNum} со`
    : null;

  const hasUtilityFilter = hasElectricity || hasGas || hasWater || hasSewer || hasRoadAccess;
  const hasLegalFilter   = isPledged || isOnRedLine || isDivisible;

  return (
    <div className="flex flex-col bg-white overflow-hidden" style={{ height: 'calc(100svh - 64px)' }}>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-2 overflow-x-auto shrink-0 scrollbar-none">

        {/* Type toggles */}
        <div className="shrink-0 flex items-center bg-zinc-100 rounded-lg p-0.5 text-[12.5px] font-medium gap-px">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-3 h-8 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              selectedCategories.length === 0
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {selectedCategories.length === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
            Все
            <span className="text-zinc-400 font-mono text-[10.5px]">{allListings.length}</span>
          </button>
          {LAND_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 h-8 rounded-md transition-colors whitespace-nowrap ${
                selectedCategories.includes(cat)
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {cat}
              {typeCountMap[cat] ? (
                <span className="ml-1 text-zinc-400 font-mono text-[10.5px]">{typeCountMap[cat]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <span className="shrink-0 w-px h-6 bg-zinc-200 mx-1" />

        {/* Active filter chips */}
        {priceChipLabel && (
          <button
            onClick={() => { setPriceFrom(''); setPriceTo(''); }}
            className="shrink-0 group h-9 pl-3 pr-2 rounded-lg border border-zinc-200 bg-white text-[12.5px] hover:border-zinc-400 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-zinc-400">Цена</span>
            <span className="font-semibold text-zinc-900">{priceChipLabel}</span>
            <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
          </button>
        )}
        {areaChipLabel && (
          <button
            onClick={() => { setAreaFrom(''); setAreaTo(''); }}
            className="shrink-0 group h-9 pl-3 pr-2 rounded-lg border border-zinc-200 bg-white text-[12.5px] hover:border-zinc-400 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-zinc-400">Площадь</span>
            <span className="font-semibold text-zinc-900">{areaChipLabel}</span>
            <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
          </button>
        )}
        {hasUtilityFilter && (
          <button
            onClick={() => { setHasElectricity(false); setHasGas(false); setHasWater(false); setHasSewer(false); setHasRoadAccess(false); }}
            className="shrink-0 group h-9 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12.5px] flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-primary/80">Коммуникации</span>
            <X className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary" />
          </button>
        )}
        {hasLegalFilter && (
          <button
            onClick={() => { setIsPledged(false); setIsOnRedLine(false); setIsDivisible(false); }}
            className="shrink-0 group h-9 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12.5px] flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-primary/80">Юридика</span>
            <X className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary" />
          </button>
        )}
        {location && (
          <button
            onClick={() => setLocation('')}
            className="shrink-0 group h-9 pl-3 pr-2 rounded-lg border border-zinc-200 bg-white text-[12.5px] hover:border-zinc-400 transition flex items-center gap-2"
          >
            <span className="text-zinc-400">Район</span>
            <span className="font-semibold text-zinc-900 max-w-[120px] truncate">{location}</span>
            <X className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900" />
          </button>
        )}

        <div className="flex-1 min-w-2" />

        {/* Mobile list/map toggle */}
        <div className="lg:hidden flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 shrink-0 gap-px">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center rounded-md w-8 h-8 transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center justify-center rounded-md w-8 h-8 transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400'}`}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setIsFiltersOpen(true)}
          className="shrink-0 h-9 px-3 rounded-lg bg-zinc-900 text-white text-[12.5px] font-medium hover:bg-zinc-800 transition flex items-center gap-2 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Фильтры</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded bg-white/20 text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={resetAll}
            className="shrink-0 h-9 px-3 rounded-lg text-[12.5px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition whitespace-nowrap"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* ── Main split ─────────────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-[440px] shrink-0 flex-col border-r border-zinc-200">
          <div className="h-[68px] px-5 border-b border-zinc-100 flex items-end justify-between pb-3 shrink-0">
            <div>
              <div className="font-black tracking-tight text-[22px] leading-none text-zinc-900">
                {filteredListings.length.toLocaleString('ru-RU')} участков
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-mono text-zinc-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                в окне карты
                {avgPerSotka > 0 && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span>ср. {fmtM(avgPerSotka)} млн/со</span>
                  </>
                )}
              </div>
            </div>
            <CatalogSort value={sortOrder} onChange={setSortOrder} />
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}
          >
            {filteredListings.length === 0 ? (
              <EmptyState onReset={resetAll} />
            ) : (
              filteredListings.map(l => (
                <SidebarCard
                  key={l.id}
                  listing={l}
                  active={hoveredId === l.id}
                  onEnter={() => setHoveredId(l.id)}
                  onLeave={() => setHoveredId(null)}
                  cardRef={el => { cardRefs.current[l.id] = el; }}
                />
              ))
            )}
          </div>
        </aside>

        {/* Map (desktop) */}
        <section className="hidden lg:block flex-1 relative">
          {/* Stats overlay — top left */}
          <MapStatsOverlay
            count={filteredListings.length}
            median={medianPrice}
            perSotka={avgPerSotka}
          />

          {/* "Search as I move" toggle — below stats */}
          <div className="absolute top-[68px] left-4 z-[400]">
            <label className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm px-3 py-2 flex items-center gap-2 cursor-pointer text-[12px] font-medium text-zinc-700 select-none">
              <span className={`relative w-8 h-4 rounded-full transition-colors ${searchAsMove ? 'bg-primary' : 'bg-zinc-300'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchAsMove ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
              Искать при движении
            </label>
          </div>

          {/* Layer tabs + zoom + tools — top right */}
          <MapRightControls
            tileLayer={tileLayer}
            onTileLayer={setTileLayer}
            onZoomIn={() => mapApi.current?.zoomIn()}
            onZoomOut={() => mapApi.current?.zoomOut()}
          />

          {/* Map canvas */}
          <div className="absolute inset-0">
            <MapView
              listings={mapListings}
              onMarkerClick={handleMarkerClick}
              tileLayer={tileLayer}
              mapApiRef={mapApi}
            />
          </div>
        </section>

        {/* Mobile content */}
        <div className="lg:hidden flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {filteredListings.length === 0 ? (
                <EmptyState onReset={resetAll} />
              ) : (
                filteredListings.map(l => (
                  <SidebarCard
                    key={l.id}
                    listing={l}
                    active={false}
                    onEnter={() => {}}
                    onLeave={() => {}}
                    cardRef={() => {}}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="h-full relative">
              <MapView listings={mapListings} onMarkerClick={() => {}} tileLayer={tileLayer} />
            </div>
          )}
        </div>
      </main>

      {/* ── Filter drawer ──────────────────────────────────────────────────── */}
      {isFiltersOpen && (
        <>
          <div
            className={`fixed inset-0 z-[1050] transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsFiltersOpen(false)}
          />
          <div
            className={`fixed inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl z-[1100] transition-transform duration-300 ease-out ${drawerVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{ maxHeight: '92dvh' }}
          >
            <CatalogFilters
              {...{ ...filterProps, onViewModeChange: undefined }}
              onClose={() => setIsFiltersOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
