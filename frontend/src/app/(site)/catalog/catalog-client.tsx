'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SlidersHorizontal, List, Map, X, Search, Bookmark } from 'lucide-react';
import { MapView, type MapItem, type MapApi, type CompareItem, formatPrice } from '@/components/catalog/map-view';
import { CatalogFilters, DualSlider, Histogram } from '@/components/catalog/filters';
import { CatalogSort } from '@/components/catalog/sort';
import { LAND_CATEGORIES } from '@/lib/listing-constants';
import type { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import Link from 'next/link';

type ViewMode = 'list' | 'map';
type TileLayer = string;

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

const AREA_PRESETS = [
  { label: 'до 6 со',   from: 0,  to: 6   },
  { label: '6–15 со',   from: 6,  to: 15  },
  { label: '15–30 со',  from: 15, to: 30  },
  { label: '30–100 со', from: 30, to: 100 },
];

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const ALMATY: [number, number] = [43.238, 76.945];

function relDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'сегодня';
  if (d === 1) return 'вчера';
  if (d < 7)  return `${d} дн`;
  if (d < 30) return `${Math.floor(d / 7)} нед`;
  return `${Math.floor(d / 30)} мес`;
}

// ── Compact sidebar card ─────────────────────────────────────────────────────
function SidebarCard({ listing, active, bookmarked, inCompare, onEnter, onLeave, cardRef, onBookmark, onCompare }: {
  listing: Listing;
  active: boolean;
  bookmarked: boolean;
  inCompare: boolean;
  onEnter: () => void;
  onLeave: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  onBookmark: (e: React.MouseEvent) => void;
  onCompare: (e: React.MouseEvent) => void;
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
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider truncate">
                {typeLabel}{typeLabel && listing.location ? ' · ' : ''}{listing.location}
              </p>
              <button
                onClick={onBookmark}
                className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-[13px] transition-colors ${
                  bookmarked ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {bookmarked ? '★' : '☆'}
              </button>
            </div>
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
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-zinc-400" suppressHydrationWarning>
                  {relDate(listing.createdAt)}
                </span>
                <button
                  onClick={onCompare}
                  title="Добавить к сравнению"
                  className={`w-5 h-5 rounded border flex items-center justify-center text-[9px] font-bold transition-colors ${
                    inCompare
                      ? 'bg-primary border-primary text-white'
                      : 'border-zinc-300 text-zinc-400 hover:border-primary hover:text-primary'
                  }`}
                >
                  {inCompare ? '✓' : '+'}
                </button>
              </div>
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
  // No body overflow hack needed — container uses position:fixed

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
  const [hasStateAct, setHasStateAct] = useState(false);
  const [hasCadastral, setHasCadastral] = useState(false);
  const [purposeIJS, setPurposeIJS] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [nearWater, setNearWater] = useState(false);
  const [mountainView, setMountainView] = useState(false);
  const [onlyFromOwner, setOnlyFromOwner] = useState(false);
  const [hasBuilding, setHasBuilding] = useState(false);

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
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const observerRef   = useRef<IntersectionObserver | null>(null);

  // Compare + bookmark
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string | number>>(new Set());
  const [showSaved, setShowSaved] = useState(false);
  const [visitedIds, setVisitedIds] = useState<Set<string | number>>(new Set());
  const [mapBounds, setMapBounds] = useState<{ n: number; s: number; e: number; w: number } | null>(null);

  // Price popover
  const [showPricePopover, setShowPricePopover] = useState(false);
  const [perSotka, setPerSotka] = useState(false);
  const pricePopoverRef = useRef<HTMLDivElement>(null);

  // Area popover
  const [showAreaPopover, setShowAreaPopover] = useState(false);
  const areaPopoverRef = useRef<HTMLDivElement>(null);

  // City popover
  const [showCityPopover, setShowCityPopover] = useState(false);
  const cityPopoverRef = useRef<HTMLDivElement>(null);

  const priceValues = useMemo(() => allListings.map(l => l.price), [allListings]);
  const PRICE_MIN = 0;
  const PRICE_MAX = useMemo(() => {
    const m = Math.max(...priceValues, 10_000_000);
    return Math.ceil(m / 10_000_000) * 10_000_000;
  }, [priceValues]);

  const areaValues = useMemo(() => allListings.map(l => l.area).filter(a => a > 0), [allListings]);
  const AREA_MIN = 0;
  const AREA_MAX = useMemo(() => Math.min(Math.ceil(Math.max(...areaValues, 100) / 10) * 10, 500), [areaValues]);

  const priceFromRaw = priceFrom ? parseInt(priceFrom.replace(/\D/g, '')) || PRICE_MIN : PRICE_MIN;
  const priceToRaw   = priceTo   ? parseInt(priceTo.replace(/\D/g, ''))   || PRICE_MAX : PRICE_MAX;

  const avgArea = useMemo(() => {
    const with_ = allListings.filter(l => l.area > 0);
    return with_.length ? with_.reduce((s, l) => s + l.area, 0) / with_.length : 10;
  }, [allListings]);

  const PRICE_PRESETS = [
    { label: 'до 5 млн',   from: 0,          to: 5_000_000   },
    { label: '5–15 млн',   from: 5_000_000,  to: 15_000_000  },
    { label: '15–25 млн',  from: 15_000_000, to: 25_000_000  },
    { label: '25–60 млн',  from: 25_000_000, to: 60_000_000  },
    { label: '60+ млн',    from: 60_000_000, to: PRICE_MAX   },
  ];

  useEffect(() => {
    if (!showPricePopover) return;
    const handler = (e: MouseEvent) => {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target as Node))
        setShowPricePopover(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPricePopover]);

  useEffect(() => {
    if (!showAreaPopover) return;
    const handler = (e: MouseEvent) => {
      if (areaPopoverRef.current && !areaPopoverRef.current.contains(e.target as Node))
        setShowAreaPopover(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAreaPopover]);

  useEffect(() => {
    if (!showCityPopover) return;
    const handler = (e: MouseEvent) => {
      if (cityPopoverRef.current && !cityPopoverRef.current.contains(e.target as Node))
        setShowCityPopover(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCityPopover]);

  const cityOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of allListings) {
      const loc = l.location?.trim();
      if (!loc) continue;
      counts[loc] = (counts[loc] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([loc, count]) => ({ value: loc, label: loc.split(/[,·]/)[0].trim(), count }));
  }, [allListings]);

  // Location search with separate input state (breadcrumb only updates on confirm)
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [locationFocus, setLocationFocus] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const toggleCompare = useCallback((listing: Listing, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(c => c.id === listing.id)) return prev.filter(c => c.id !== listing.id);
      if (prev.length >= 4) return prev;
      return [...prev, {
        id: listing.id,
        price: listing.price,
        image: listing.images?.[0] ?? listing.image ?? '',
        title: listing.title,
      }];
    });
  }, []);

  const toggleBookmark = useCallback((id: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
    if (hasElectricity) result = result.filter(l => l.hasElectricity === true);
    if (hasGas)         result = result.filter(l => l.hasGas === true);
    if (hasWater)       result = result.filter(l => l.hasWater === true);
    if (hasSewer)       result = result.filter(l => l.hasSewer === true);
    if (hasRoadAccess)  result = result.filter(l => l.hasRoadAccess === true);
    if (hasStateAct)    result = result.filter(l => (l as Listing & { hasStateAct?: boolean }).hasStateAct === true);
    if (hasCadastral)   result = result.filter(l => !!(l.cadastralNumber && l.cadastralNumber.length > 0));
    if (purposeIJS)     result = result.filter(l => l.landType === 'ИЖС' || l.purpose === 'ИЖС');
    if (onlyFromOwner)       result = result.filter(l => !l.seller?.isAgency);
    if (nearWater)           result = result.filter(l => l.locationType?.some((t: string) => /вод|озер|рек/i.test(t)));
    if (mountainView)        result = result.filter(l => l.locationType?.some((t: string) => /гор/i.test(t)));
    if (hasBuilding)         result = result.filter(l => l.locationType?.some((t: string) => /постр|строен/i.test(t)));
    if (selectedCities.length > 0) result = result.filter(l =>
      selectedCities.some(c => l.location?.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(l.location?.toLowerCase() ?? ''))
    );

    result.sort((a, b) => {
      if (sortOrder === 'Сначала дешевые') return a.price - b.price;
      if (sortOrder === 'Сначала дорогие') return b.price - a.price;
      if (sortOrder === 'Дешевле за сотку') return (a.price / a.area) - (b.price / b.area);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (showSaved) result = result.filter(l => bookmarkedIds.has(l.id));

    // Apply map bounds filter when searchAsMove is ON
    if (searchAsMove && mapBounds) {
      result = result.filter(l =>
        l.lat != null && l.lng != null &&
        l.lat <= mapBounds.n && l.lat >= mapBounds.s &&
        l.lng <= mapBounds.e && l.lng >= mapBounds.w
      );
    }

    return result;
  }, [selectedCategories, location, areaFrom, areaTo, priceFrom, priceTo,
      sortOrder, isPledged, isOnRedLine, isDivisible,
      hasStateAct, hasCadastral, purposeIJS,
      hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess, allListings,
      showSaved, bookmarkedIds, searchAsMove, mapBounds,
      onlyFromOwner, nearWater, mountainView, hasBuilding, selectedCities]);

  const activeFilterCount = useMemo(() => [
    selectedCategories.length > 0, !!location,
    !!areaFrom || !!areaTo, !!priceFrom || !!priceTo,
    hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible, hasStateAct, hasCadastral, purposeIJS,
    selectedCities.length > 0, onlyFromOwner, nearWater, mountainView, hasBuilding,
    distanceFromCity < 100,
  ].filter(Boolean).length, [selectedCategories, location, areaFrom, areaTo,
    priceFrom, priceTo, hasElectricity, hasGas, hasWater, hasSewer, hasRoadAccess,
    isPledged, isOnRedLine, isDivisible, hasStateAct, hasCadastral, purposeIJS,
    selectedCities, onlyFromOwner, nearWater, mountainView, hasBuilding]);

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
    hasStateAct, setHasStateAct,
    hasCadastral, setHasCadastral,
    purposeIJS, setPurposeIJS,
    selectedCities, setSelectedCities,
    nearWater, setNearWater,
    mountainView, setMountainView,
    onlyFromOwner, setOnlyFromOwner,
    hasBuilding, setHasBuilding,
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
    setHasStateAct(false); setHasCadastral(false); setPurposeIJS(false);
    setSelectedCities([]); setNearWater(false); setMountainView(false);
    setOnlyFromOwner(false); setHasBuilding(false);
  };

  const handleMarkerClick = useCallback((listing: MapItem) => {
    if (highlightTimer.current) {
      clearTimeout(highlightTimer.current);
      highlightTimer.current = null;
    }
    const el = cardRefs.current[listing.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHoveredId(listing.id);
    setVisitedIds(prev => { const next = new Set(prev); next.add(listing.id); return next; });
    highlightTimer.current = setTimeout(() => setHoveredId(null), 2500);
  }, []);

  // IntersectionObserver: highlight map marker when card scrolls into view
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    let initialized = false;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!initialized) return;
        const best = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) {
          const id = (best.target as HTMLElement).dataset.listingId;
          if (id) setHoveredId(id);
        }
      },
      { root: sidebarScrollRef.current, threshold: 0.6 }
    );

    filteredListings.forEach(l => {
      const el = cardRefs.current[l.id];
      if (el) {
        el.dataset.listingId = String(l.id);
        observerRef.current!.observe(el);
      }
    });

    requestAnimationFrame(() => { initialized = true; });

    return () => observerRef.current?.disconnect();
  }, [filteredListings]);

  const mapListings = useMemo(
    () => filteredListings.filter(l => l.lat && l.lng),
    [filteredListings]
  );

  // Location suggestions from listings data
  const locationSuggestions = useMemo(() => {
    if (!locationInput.trim() || locationInput === location) return [];
    const q = locationInput.trim().toLowerCase();
    const seen = new Set<string>();
    const results: string[] = [];
    for (const l of allListings) {
      const loc = l.location?.trim();
      if (!loc) continue;
      // Split by common separators and also try full location
      const parts = [loc, ...loc.split(/[,·\s]+/).filter(p => p.length > 2)];
      for (const part of parts) {
        if (seen.has(part)) continue;
        if (part.toLowerCase().includes(q)) {
          seen.add(part);
          results.push(part);
          if (results.length >= 8) break;
        }
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [locationInput, location, allListings]);

  const confirmLocation = (val: string) => {
    setLocation(val);
    setLocationInput(val);
    setLocationFocus(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationFocus(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Active filter chip labels
  const priceFromNum = priceFrom ? parseInt(priceFrom.replace(/\D/g, '')) || 0 : 0;
  const priceToNum   = priceTo   ? parseInt(priceTo.replace(/\D/g, ''))   || 0 : 0;
  const areaFromNum  = areaFrom  ? parseFloat(areaFrom) || 0 : 0;
  const areaToNum    = areaTo    ? parseFloat(areaTo)   || 0 : 0;

  const areaFromNumSlider = areaFrom ? parseFloat(areaFrom) || AREA_MIN : AREA_MIN;
  const areaToNumSlider   = areaTo   ? parseFloat(areaTo)   || AREA_MAX : AREA_MAX;

  const priceChipLabel = (priceFromNum || priceToNum)
    ? priceFromNum && priceToNum ? `${fmtM(priceFromNum)}–${fmtM(priceToNum)} млн`
      : priceToNum ? `до ${fmtM(priceToNum)} млн` : `от ${fmtM(priceFromNum)} млн`
    : null;

  const areaChipLabel = (areaFromNum || areaToNum)
    ? areaFromNum && areaToNum ? `${areaFromNum}–${areaToNum} со`
      : areaToNum ? `до ${areaToNum} со` : `от ${areaFromNum} со`
    : null;

  const hasUtilityFilter  = hasElectricity || hasGas || hasWater || hasSewer || hasRoadAccess;
  const hasDocumentFilter = hasStateAct || isDivisible || hasCadastral || purposeIJS;
  const docChipLabel = [
    hasStateAct  && 'Акт',
    isDivisible  && 'Межевание',
    hasCadastral && 'Кадастр',
    purposeIJS   && 'ИЖС',
  ].filter(Boolean).join(' + ') || null;

  const citiesChipLabel = selectedCities.length > 0
    ? selectedCities.map(c => c.split(/[,·]/)[0].trim()).join(', ')
    : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-white isolate" style={{ top: '52px', zIndex: 40 }}>

      {/* ── Top bar — breadcrumbs only ──────────────────────────────────────── */}
      <div className="h-9 bg-zinc-50 border-b border-zinc-100 flex items-center px-4 gap-3 shrink-0 relative z-20">
        <nav className="flex items-center gap-1.5 text-[12px] text-zinc-500 min-w-0">
          <Link href="/" className="hover:text-zinc-900 transition-colors whitespace-nowrap">Главная</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/catalog" className="hover:text-zinc-900 transition-colors whitespace-nowrap">Каталог</Link>
          {location && (
            <>
              <span className="text-zinc-300">/</span>
              <button
                onClick={() => confirmLocation('')}
                className="text-zinc-900 font-medium truncate max-w-[200px] hover:text-primary transition-colors"
              >
                {location}
              </button>
            </>
          )}
        </nav>
        <div className="flex-1" />
        <button
          onClick={() => setShowSaved(v => !v)}
          className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors ${showSaved ? 'bg-primary-soft text-primary' : 'text-zinc-500 hover:bg-zinc-100'}`}
        >
          <Bookmark className={`w-3 h-3 ${showSaved ? 'fill-primary' : ''}`} />
          Сохранённые
          {bookmarkedIds.size > 0 && <span className="opacity-70">({bookmarkedIds.size})</span>}
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-zinc-200 flex items-center px-3 gap-1.5 shrink-0 relative z-20" style={{ minHeight: 50 }}>

        {/* Type segmenter */}
        <div className="shrink-0 flex items-center bg-zinc-100 rounded-lg p-0.5 text-[12px] font-medium gap-px">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-2.5 h-7 rounded-md flex items-center gap-1 transition-colors whitespace-nowrap ${
              selectedCategories.length === 0 ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Все <span className="text-zinc-400 font-mono text-[10px]">{allListings.length}</span>
          </button>
          {LAND_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => toggleCategory(cat)}
              className={`px-2.5 h-7 rounded-md transition-colors whitespace-nowrap ${
                selectedCategories.includes(cat) ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {cat}
              {typeCountMap[cat] ? <span className="ml-1 text-zinc-400 font-mono text-[10px]">{typeCountMap[cat]}</span> : null}
            </button>
          ))}
        </div>

        <span className="shrink-0 w-px h-5 bg-zinc-200" />

        {/* Price chip */}
        <div ref={pricePopoverRef} className="relative shrink-0">
          {priceChipLabel ? (
            <button
              onClick={() => setShowPricePopover(v => !v)}
              className="h-8 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12.5px] flex items-center gap-1.5 whitespace-nowrap transition-all"
            >
              <span className="text-primary/70 text-[12px] font-medium">Цена</span>
              <span className="font-bold text-[12px] text-zinc-900">{priceChipLabel}</span>
              <span onClick={e => { e.stopPropagation(); setPriceFrom(''); setPriceTo(''); setShowPricePopover(false); }} className="hover:bg-primary/10 rounded p-0.5 text-primary/60 hover:text-primary"><X className="w-3 h-3" /></span>
            </button>
          ) : (
            <button
              onClick={() => setShowPricePopover(v => !v)}
              className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition whitespace-nowrap"
            >+ Цена</button>
          )}

          {showPricePopover && (
            <div className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 overflow-hidden">
              {/* Arrow pointer */}
              <div className="absolute -top-[7px] left-5 w-3 h-3 bg-white border-l border-t border-zinc-200 rotate-45" />

              <div className="p-5">
                <div className="flex items-start justify-between mb-0.5">
                  <div>
                    <span className="text-[18px] font-black tracking-tight text-zinc-900">Цена, ₸</span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Распределение по {allListings.length} объявлениям</p>
                  </div>
                  <button onClick={() => setShowPricePopover(false)} className="mt-0.5 text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="mt-4">
                  <Histogram values={priceValues} min={PRICE_MIN} max={PRICE_MAX} from={priceFromRaw} to={priceToRaw} buckets={16} />
                  <div className="mt-2">
                    <DualSlider min={PRICE_MIN} max={PRICE_MAX} from={priceFromRaw} to={priceToRaw} step={500_000}
                      onChange={(f, t) => { setPriceFrom(f > PRICE_MIN ? String(f) : ''); setPriceTo(t < PRICE_MAX ? String(t) : ''); }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">от</div>
                    <input type="text" placeholder="0" value={priceFrom} onChange={e => setPriceFrom(e.target.value)}
                      className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-[14px] font-bold text-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  </label>
                  <label className="block">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">до</div>
                    <input type="text" placeholder="Любая" value={priceTo} onChange={e => setPriceTo(e.target.value)}
                      className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-[14px] font-bold text-zinc-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PRICE_PRESETS.map(p => {
                    const isOn = priceFromRaw === p.from && priceToRaw === p.to;
                    return (
                      <button key={p.label}
                        onClick={() => { setPriceFrom(p.from > 0 ? String(p.from) : ''); setPriceTo(p.to < PRICE_MAX ? String(p.to) : ''); }}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${isOn ? 'bg-primary border-primary text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >{p.label}</button>
                    );
                  })}
                </div>

                <label className="mt-4 flex items-center gap-2.5 cursor-pointer" onClick={() => setPerSotka(v => !v)}>
                  <div className={`relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200 ${perSotka ? 'bg-primary' : 'bg-zinc-300'}`}>
                    <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform duration-200 ${perSotka ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-900">Считать за сотку</span>
                  {perSotka && <span className="ml-auto text-[11px] font-mono uppercase tracking-wider text-zinc-400">~ {((priceToRaw / avgArea) / 1_000_000).toFixed(1)} млн / сотка</span>}
                </label>
              </div>

              <div className="px-5 py-4 border-t border-zinc-100 flex items-center gap-3">
                <button
                  onClick={() => { setPriceFrom(''); setPriceTo(''); }}
                  className={`text-[13px] font-medium transition-colors ${priceChipLabel ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-300 pointer-events-none'}`}
                >Сбросить</button>
                <button onClick={() => setShowPricePopover(false)} className="flex-1 h-10 rounded-xl bg-zinc-900 text-[13px] font-bold text-white hover:bg-zinc-800 transition-colors">
                  Показать {filteredListings.length}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Area chip with popover */}
        <div ref={areaPopoverRef} className="relative shrink-0">
          {areaChipLabel ? (
            <button
              onClick={() => setShowAreaPopover(v => !v)}
              className="h-8 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12.5px] flex items-center gap-1.5 whitespace-nowrap transition-all"
            >
              <span className="text-primary/70 text-[12px] font-medium">Площадь</span>
              <span className="font-bold text-[12px] text-zinc-900">{areaChipLabel}</span>
              <span onClick={e => { e.stopPropagation(); setAreaFrom(''); setAreaTo(''); setShowAreaPopover(false); }} className="hover:bg-primary/10 rounded p-0.5 text-primary/60 hover:text-primary"><X className="w-3 h-3" /></span>
            </button>
          ) : (
            <button
              onClick={() => setShowAreaPopover(v => !v)}
              className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition whitespace-nowrap"
            >+ Площадь</button>
          )}
          {showAreaPopover && (
            <div className="absolute top-full left-0 mt-2 w-[310px] bg-white rounded-2xl border border-zinc-200 shadow-2xl p-5 z-50">
              <div className="absolute -top-[7px] left-5 w-3 h-3 bg-white border-l border-t border-zinc-200 rotate-45" />
              <div className="flex items-center justify-between mb-1">
                <span className="text-[15px] font-semibold text-zinc-900">Площадь, соток</span>
                <button onClick={() => setShowAreaPopover(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] text-zinc-400 mb-3">Распределение по {allListings.length} объявлениям</p>
              <Histogram values={areaValues} min={AREA_MIN} max={AREA_MAX} from={areaFromNumSlider} to={areaToNumSlider} buckets={16} />
              <div className="mt-3">
                <DualSlider min={AREA_MIN} max={AREA_MAX} from={areaFromNumSlider} to={areaToNumSlider} step={1}
                  onChange={(f, t) => { setAreaFrom(f > AREA_MIN ? String(f) : ''); setAreaTo(t < AREA_MAX ? String(t) : ''); }}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">ОТ</div>
                  <input type="text" placeholder="0" value={areaFrom} onChange={e => setAreaFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">ДО</div>
                  <input type="text" placeholder="Любая" value={areaTo} onChange={e => setAreaTo(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-[13px] focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {AREA_PRESETS.map(p => {
                  const isOn = areaFromNumSlider === p.from && areaToNumSlider === p.to;
                  return (
                    <button key={p.label}
                      onClick={() => { setAreaFrom(p.from > 0 ? String(p.from) : ''); setAreaTo(p.to < AREA_MAX ? String(p.to) : ''); }}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${isOn ? 'bg-primary border-primary text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
                    >{p.label}</button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {areaChipLabel && <button onClick={() => { setAreaFrom(''); setAreaTo(''); }} className="text-[12.5px] text-zinc-400 hover:text-zinc-900 transition-colors">Сбросить</button>}
                <button onClick={() => setShowAreaPopover(false)} className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-[13px] font-bold text-white hover:bg-zinc-800 transition-colors">
                  Показать {filteredListings.length}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Communications chip */}
        {hasUtilityFilter && (
          <button onClick={() => { setHasElectricity(false); setHasGas(false); setHasWater(false); setHasSewer(false); setHasRoadAccess(false); }}
            className="shrink-0 group h-8 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12px] flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="text-primary/70">Коммуникации</span>
            <X className="w-3 h-3 text-primary/60 group-hover:text-primary" />
          </button>
        )}

        {/* Documents chip */}
        {hasDocumentFilter && (
          <button onClick={() => { setHasStateAct(false); setIsDivisible(false); setHasCadastral(false); setPurposeIJS(false); }}
            className="shrink-0 group h-8 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12px] flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="text-primary/70">Документы</span>
            <span className="font-semibold text-zinc-900">{docChipLabel}</span>
            <X className="w-3 h-3 text-primary/60 group-hover:text-primary" />
          </button>
        )}

        {/* Shortcuts */}
        {!hasUtilityFilter && (
          <button onClick={() => setIsFiltersOpen(true)}
            className="shrink-0 h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition whitespace-nowrap hidden sm:block"
          >+ Коммуникации</button>
        )}
        {selectedCategories.length === 0 && (
          <button onClick={() => setIsFiltersOpen(true)}
            className="shrink-0 h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition whitespace-nowrap hidden lg:block"
          >+ Категория земли</button>
        )}
        {/* Cities chip */}
        <div ref={cityPopoverRef} className="relative shrink-0 hidden lg:block">
          {citiesChipLabel ? (
            <button onClick={() => setShowCityPopover(v => !v)}
              className="h-8 pl-3 pr-2 rounded-lg border border-primary bg-primary-soft text-[12px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="text-primary/70 font-medium">Город</span>
              <span className="font-bold text-[12px] text-zinc-900 max-w-[140px] truncate">{citiesChipLabel}</span>
              <span onClick={e => { e.stopPropagation(); setSelectedCities([]); setShowCityPopover(false); }} className="hover:bg-primary/10 rounded p-0.5 text-primary/60 hover:text-primary"><X className="w-3 h-3" /></span>
            </button>
          ) : (
            <button onClick={() => setShowCityPopover(v => !v)}
              className="h-8 px-3 rounded-lg border border-dashed border-zinc-300 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition whitespace-nowrap"
            >+ Город</button>
          )}
          {showCityPopover && (
            <div className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 overflow-hidden">
              <div className="absolute -top-[7px] left-5 w-3 h-3 bg-white border-l border-t border-zinc-200 rotate-45" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] font-bold text-zinc-900">Город / район</span>
                  {selectedCities.length > 0 && (
                    <button onClick={() => setSelectedCities([])} className="text-[11.5px] text-zinc-400 hover:text-zinc-700 transition-colors">Сбросить</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
                  {cityOptions.map(({ value, label, count }) => {
                    const on = selectedCities.includes(value);
                    return (
                      <button key={value}
                        onClick={() => setSelectedCities(prev =>
                          prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
                        )}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-medium border transition-all ${
                          on ? 'bg-primary-soft border-primary text-zinc-900' : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        {on && <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />}
                        {label}
                        <span className="text-[10px] font-mono text-zinc-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="px-4 py-3 border-t border-zinc-100 flex items-center gap-3">
                <button onClick={() => setShowCityPopover(false)} className="flex-1 h-9 rounded-xl bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800 transition-colors">
                  Показать {filteredListings.length}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-2" />

        {/* Right side: mobile toggle + search + filters + reset */}
        <div className="shrink-0 lg:hidden flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 gap-px">
          <button onClick={() => setViewMode('list')} className={`flex items-center justify-center rounded-md w-8 h-7 transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}><List className="w-3.5 h-3.5" /></button>
          <button onClick={() => setViewMode('map')} className={`flex items-center justify-center rounded-md w-8 h-7 transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-zinc-400'}`}><Map className="w-3.5 h-3.5" /></button>
        </div>

        {/* Location search — right side */}
        <div ref={locationRef} className="relative shrink-0 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none z-10" />
          <input type="text" value={locationInput}
            onChange={e => setLocationInput(e.target.value)}
            onFocus={() => setLocationFocus(true)}
            onKeyDown={e => { if (e.key === 'Enter') confirmLocation(locationInput); if (e.key === 'Escape') { setLocationFocus(false); setLocationInput(location); } }}
            placeholder="Город или район"
            className="w-[190px] pl-8 pr-7 h-8 bg-zinc-50 border border-zinc-200 rounded-lg text-[12.5px] placeholder:text-zinc-400 focus:outline-none focus:w-[240px] focus:bg-white focus:border-primary transition-all duration-200"
          />
          {locationInput && (
            <button onClick={() => confirmLocation('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-3 h-3" /></button>
          )}
          {locationFocus && locationSuggestions.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-[260px] bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50">
              {locationSuggestions.map((s, i) => {
                const q = locationInput.trim().toLowerCase();
                const idx = s.toLowerCase().indexOf(q);
                return (
                  <button key={i} onMouseDown={e => { e.preventDefault(); confirmLocation(s); }}
                    className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-zinc-50 flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">
                      {idx >= 0 ? (<>{s.slice(0, idx)}<span className="font-semibold text-zinc-900">{s.slice(idx, idx + q.length)}</span>{s.slice(idx + q.length)}</>) : s}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => setIsFiltersOpen(true)}
          className="shrink-0 h-8 px-3 rounded-lg bg-zinc-900 text-white text-[12.5px] font-medium hover:bg-zinc-800 transition flex items-center gap-1.5 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Все фильтры</span>
          {activeFilterCount > 0 && <span className="w-4 h-4 rounded bg-white/20 text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
        </button>

        {activeFilterCount > 0 && (
          <button onClick={resetAll} className="shrink-0 h-8 px-2.5 rounded-lg text-[12px] text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition whitespace-nowrap">
            Сбросить
          </button>
        )}
      </div>

      {/* ── Main split ─────────────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-[440px] shrink-0 flex-col border-r border-zinc-200">
          <div className="px-5 pt-4 pb-3 border-b border-zinc-100 shrink-0">
            <div className="font-black tracking-tight text-[26px] leading-none text-zinc-900 whitespace-nowrap">
              {filteredListings.length.toLocaleString('ru-RU')}{' '}
              {(() => {
                const n = filteredListings.length % 100;
                const m = n % 10;
                if (n >= 11 && n <= 14) return 'участков';
                if (m === 1) return 'участок';
                if (m >= 2 && m <= 4) return 'участка';
                return 'участков';
              })()}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="text-[10.5px] font-mono text-zinc-400 uppercase tracking-widest whitespace-nowrap">в окне карты</span>
              {avgPerSotka > 0 && (
                <>
                  <span className="text-zinc-300 text-[10px]">·</span>
                  <span className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">ср. {fmtM(avgPerSotka)} млн / со</span>
                </>
              )}
              <div className="flex-1" />
              <CatalogSort value={sortOrder} onChange={setSortOrder} inline />
            </div>
          </div>

          <div
            ref={sidebarScrollRef}
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
                  bookmarked={bookmarkedIds.has(l.id)}
                  inCompare={!!compareList.find(c => c.id === l.id)}
                  onEnter={() => setHoveredId(l.id)}
                  onLeave={() => setHoveredId(null)}
                  cardRef={el => { cardRefs.current[l.id] = el; }}
                  onBookmark={e => toggleBookmark(l.id, e)}
                  onCompare={e => toggleCompare(l, e)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Map (desktop) */}
        <section className="hidden lg:block flex-1 relative">
          <MapView
            listings={mapListings}
            onMarkerClick={handleMarkerClick}
            tileLayer={tileLayer}
            onTileLayerChange={setTileLayer}
            mapApiRef={mapApi}
            highlightedId={hoveredId}
            statsCount={filteredListings.length}
            statsMedian={medianPrice}
            statsPerSotka={avgPerSotka}
            searchAsMove={searchAsMove}
            onSearchAsMoveChange={setSearchAsMove}
            compareList={compareList}
            onRemoveCompare={id => setCompareList(prev => prev.filter(c => c.id !== id))}
            onCompare={() => {}}
            onBoundsChange={setMapBounds}
            visitedIds={visitedIds}
          />
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
                    bookmarked={bookmarkedIds.has(l.id)}
                    inCompare={!!compareList.find(c => c.id === l.id)}
                    onEnter={() => {}}
                    onLeave={() => {}}
                    cardRef={() => {}}
                    onBookmark={e => toggleBookmark(l.id, e)}
                    onCompare={e => toggleCompare(l, e)}
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

      {/* ── Filter drawer (right side) ────────────────────────────────────── */}
      {isFiltersOpen && (
        <>
          <div
            className={`fixed inset-0 z-[1050] transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={() => setIsFiltersOpen(false)}
          />
          <div
            className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] flex flex-col bg-white shadow-2xl z-[1100] transition-transform duration-300 ease-out ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ top: '52px' }}
          >
            <CatalogFilters
              allListings={allListings}
              {...{ ...filterProps, onViewModeChange: undefined }}
              onClose={() => setIsFiltersOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
