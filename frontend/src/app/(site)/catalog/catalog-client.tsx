'use client';

/**
 * Каталог участков — порт high-fidelity макета «Каталог» (десктоп + мобайл).
 * Десктоп (>1024px): крошки → фильтр-бар → сайдбар-список 440px + карта.
 * Мобайл (≤1024px): карта + bottom sheet (см. mobile-view.tsx).
 * Единая модель фильтров для обеих версий.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Plus, Check, ArrowDownUp } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import { CatalogMap, type CatalogMapApi, type MapPinItem, jitterLatLng } from '@/components/catalog/catalog-map';
import {
  FilterState, defaultFilters, cloneFilters, activeFilterCount, matches, sortListings,
  cardMeta, cityOf, fmtPrice, fmtPriceShort, fmtPerSotka, median, nf, plural, hashId, landTypeCounts,
  isListingViewed, viewedCount as computeViewedCount,
  SORTS, PMAX, AMAX,
  LS_BOOKMARKS, LS_VIEWED, LS_COMPARE, readLsSet, writeLsSet,
} from './catalog-utils';
import { generateTitle } from '@/lib/listing-title';
import { AllFiltersBody, PriceSection, AreaSection, CityChecklist, applyLabel } from './filter-ui';
import { MobileCatalog } from './mobile-view';
import './catalog.css';

const ALMATY_REGION: [number, number] = [43.5, 77.2];

export interface CatalogClientProps {
  allListings: Listing[];
  initialFilters?: Partial<Pick<FilterState, 'pLo' | 'pHi' | 'aLo' | 'aHi'>> & {
    type?: string; city?: string;
    utils?: string[]; legal?: string[];
  };
}

export function CatalogClient({ allListings, initialFilters }: CatalogClientProps) {
  const router = useRouter();
  const landListings = useMemo(
    () => allListings.filter(l => (l.listingCategory ?? 'land') === 'land'),
    [allListings],
  );

  // ── единая модель фильтров ──
  const [applied, setApplied] = useState<FilterState>(() => {
    const f = defaultFilters();
    if (initialFilters?.type) f.types.add(initialFilters.type);
    if (initialFilters?.city) f.cities.add(initialFilters.city);
    if (initialFilters?.pLo != null) f.pLo = initialFilters.pLo;
    if (initialFilters?.pHi != null) f.pHi = initialFilters.pHi;
    if (initialFilters?.aLo != null) f.aLo = initialFilters.aLo;
    if (initialFilters?.aHi != null) f.aHi = initialFilters.aHi;
    initialFilters?.utils?.forEach(u => f.utils.add(u));
    initialFilters?.legal?.forEach(u => f.legal.add(u));
    return f;
  });

  // ── избранное / просмотренные / сравнение ──
  const [fav, setFav] = useState<Set<string>>(new Set());
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState<Set<string>>(new Set());
  useEffect(() => {
    // избранное/сравнение/просмотренные персистентны (переход в объявление = перезагрузка страницы)
    const t = setTimeout(() => {
      setFav(readLsSet(LS_BOOKMARKS));
      setViewed(readLsSet(LS_VIEWED));
      try {
        const list: { id: string | number }[] = JSON.parse(localStorage.getItem(LS_COMPARE) ?? '[]');
        setCompare(new Set(list.map(c => String(c.id))));
      } catch { /* пустое сравнение */ }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const toggleFav = useCallback((id: string) => {
    setFav(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      writeLsSet(LS_BOOKMARKS, next);
      window.dispatchEvent(new Event('bookmarks-updated')); // обновить счётчик в хедере
      return next;
    });
  }, []);
  const toggleCompare = useCallback((id: string) => {
    setCompare(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { if (next.size >= 4) return prev; next.add(id); }
      try { localStorage.setItem(LS_COMPARE, JSON.stringify([...next].map(x => ({ id: x })))); } catch { /* quota */ }
      window.dispatchEvent(new Event('compare-updated')); // обновить счётчик в хедере
      return next;
    });
  }, []);
  const markViewed = useCallback((id: string) => {
    setViewed(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id);
      writeLsSet(LS_VIEWED, next);
      return next;
    });
  }, []);
  const clearViewed = useCallback(() => {
    setViewed(new Set());
    writeLsSet(LS_VIEWED, new Set());
  }, []);
  // число просмотренных объявлений (по id/slug, без двойного счёта)
  const viewedTotal = useMemo(() => computeViewedCount(landListings, viewed), [landListings, viewed]);

  // ── результаты ──
  const results = useMemo(
    () => sortListings(landListings.filter(l => matches(l, applied)), applied.sort),
    [landListings, applied],
  );

  // рекламное объявление (MOCK — платное продвижение): всегда топ-1 списка + пин со звездой на карте
  const promotedId = useMemo(() => {
    const ad = results.find(l => hashId(String(l.id)) % 9 === 0);
    return ad ? String(ad.id) : null;
  }, [results]);
  const orderedResults = useMemo(() => {
    if (!promotedId) return results;
    const idx = results.findIndex(l => String(l.id) === promotedId);
    if (idx <= 0) return results;
    return [results[idx], ...results.slice(0, idx), ...results.slice(idx + 1)];
  }, [results, promotedId]);

  // ── скелетон при пересчёте ──
  const [loading, setLoading] = useState(false);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyFilters = useCallback((next: FilterState) => {
    setApplied(next);
    setLoading(true);
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setLoading(false), 500);
  }, []);
  useEffect(() => () => { if (loadTimer.current) clearTimeout(loadTimer.current); }, []);

  const resetAll = useCallback(() => applyFilters(defaultFilters()), [applyFilters]);

  // ── карта: пины, окно, hover ──
  // «Искать при движении карты» работает как фильтр: ON → список = участки в окне карты;
  // OFF → список показывает ВСЕ результаты (окно карты не фильтрует).
  const mapApi = useRef<CatalogMapApi | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string> | null>(null);
  const [searchOnMove, setSearchOnMove] = useState(true);

  const pins = useMemo<MapPinItem[]>(() => results.map(l => {
    const id = String(l.id);
    const [lat, lng] = l.lat && l.lng ? [l.lat, l.lng] : jitterLatLng(id, ALMATY_REGION);
    let boundary: [number, number][] | null = null;
    try {
      if (l.plotBoundary) {
        const pts = JSON.parse(l.plotBoundary) as { lat: number; lng: number }[];
        if (Array.isArray(pts) && pts.length >= 3) boundary = pts.map(p => [p.lat, p.lng]);
      }
    } catch { /* некорректный JSON границы — рисуем без полигона */ }
    return { id, lat, lng, price: l.price, boundary, viewed: isListingViewed(l, viewed) };
  }), [results, viewed]);

  // всегда запоминаем, что в окне карты; применяем только когда включён режим «искать при движении»
  const onViewportChange = useCallback((ids: string[]) => {
    setVisibleIds(new Set(ids));
  }, []);

  const windowResults = useMemo(
    () => (searchOnMove && visibleIds) ? orderedResults.filter(l => visibleIds.has(String(l.id))) : orderedResults,
    [orderedResults, visibleIds, searchOnMove],
  );

  // аналитика по окну карты
  const stats = useMemo(() => ({
    count: windowResults.length,
    medianM: median(windowResults.map(l => l.price)) / 1e6,
    perSotkaM: median(windowResults.filter(l => l.area).map(l => l.price / l.area)) / 1e6,
  }), [windowResults]);

  // связка список ↔ карта + карточка на карте.
  // activeId — закреплён кликом по пину (карточка держится), hoverId — при наведении.
  const mapSectionRef = useRef<HTMLElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const previewId = activeId ?? hoverId;
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [mapBounds, setMapBounds] = useState({ w: 800, h: 600 });
  const previewListing = previewId ? results.find(l => String(l.id) === previewId) ?? null : null;

  const onPinClick = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  }, []);

  // позиция карточки: пересчитываем при смене цели и при каждом движении/зуме карты.
  // cardPos не сбрасываем в null — карточку скрывает отсутствие previewListing.
  useEffect(() => {
    if (!previewId) return;
    const update = () => {
      if (mapApi.current) setCardPos(mapApi.current.pinPoint(previewId));
      if (mapSectionRef.current) setMapBounds({ w: mapSectionRef.current.clientWidth, h: mapSectionRef.current.clientHeight });
    };
    const raf = requestAnimationFrame(update);
    const iv = setInterval(update, 120); // держим карточку у пина при перетаскивании карты
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, [previewId]);

  // ── drawer «Все фильтры» + поповеры ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draft, setDraft] = useState<FilterState | null>(null);
  const openDrawer = useCallback(() => {
    setDraft(cloneFilters(applied));
    setDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
  }, [applied]);
  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setTimeout(() => setDrawerOpen(false), 340);
  }, []);
  const draftCount = useMemo(
    () => draft ? landListings.filter(l => matches(l, draft)).length : 0,
    [draft, landListings],
  );

  const [popover, setPopover] = useState<{ kind: 'price' | 'area' | 'city'; left: number; top: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const openPopover = useCallback((kind: 'price' | 'area' | 'city', e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setDraft(cloneFilters(applied));
    setPopover({ kind, left: Math.max(12, Math.min(r.left, window.innerWidth - 356)), top: r.bottom + 8 });
  }, [applied]);
  useEffect(() => {
    if (!popover) return;
    const onDoc = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopover(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [popover]);

  // ── сортировка (меню в шапке списка) ──
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = () => setSortOpen(false);
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [sortOpen]);

  // ── мобайл / десктоп ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const goCompare = useCallback(() => {
    if (compare.size) router.push(`/catalog/compare?ids=${[...compare].join(',')}`);
  }, [compare, router]);

  const activeCount = activeFilterCount(applied);
  const compareItems = useMemo(
    () => [...compare].map(id => landListings.find(l => String(l.id) === id)).filter(Boolean) as Listing[],
    [compare, landListings],
  );

  if (isMobile) {
    return (
      <MobileCatalog
        listings={landListings}
        results={windowResults}
        pins={pins}
        applied={applied}
        applyFilters={applyFilters}
        loading={loading}
        fav={fav} toggleFav={toggleFav}
        compare={compare} toggleCompare={toggleCompare}
        viewed={viewed} viewedTotal={viewedTotal} markViewed={markViewed} clearViewed={clearViewed}
        onViewportChange={onViewportChange}
        goCompare={goCompare}
        resetAll={resetAll}
      />
    );
  }

  // ═══════════════════════ ДЕСКТОП ═══════════════════════
  return (
    <div className="catalog-root fixed inset-0 top-[69px] z-40 flex flex-col bg-white">
      {/* Хлебные крошки */}
      <nav aria-label="Хлебные крошки" className="h-9 bg-white border-b border-zinc-100 flex items-center px-5 gap-2 text-[12px] text-zinc-500 shrink-0">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Главная</Link>
        <span className="text-zinc-300">/</span>
        <Link href="/catalog" className="hover:text-zinc-900 transition-colors">Купить</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Участки</span>
      </nav>

      {/* Фильтр-бар */}
      <div className="h-14 bg-white border-b border-zinc-200 flex items-center px-5 gap-2 overflow-x-auto no-scrollbar z-40 relative shrink-0">
        <TypeSegment listings={landListings} filters={applied} onApply={applyFilters} />
        <span className="shrink-0 w-px h-6 bg-zinc-200 mx-1" />
        <QuickChips filters={applied} onApply={applyFilters} onPopover={openPopover} onDrawer={openDrawer} />
        <button
          type="button"
          onClick={openDrawer}
          className="shrink-0 h-9 px-3 rounded-lg bg-zinc-900 text-white text-[12.5px] font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          Все фильтры
          {activeCount > 0 && (
            <span className="min-w-[16px] h-4 px-1 rounded bg-white/20 text-[10px] font-bold flex items-center justify-center">{activeCount}</span>
          )}
        </button>
        <div className="flex-1 min-w-3" />
        <button
          type="button"
          onClick={resetAll}
          className="shrink-0 h-9 px-3 rounded-lg text-[12.5px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          Сбросить всё
        </button>
      </div>

      {/* Сайдбар + карта */}
      <main className="flex flex-1 min-h-0">
        <aside className="w-[440px] shrink-0 bg-white border-r border-zinc-200 flex flex-col">
          {/* шапка списка */}
          <div className="h-[68px] px-5 border-b border-zinc-100 flex items-end justify-between pb-3 shrink-0">
            <div>
              <div className="font-black tracking-tighter text-[22px] leading-none text-zinc-900">
                {nf(stats.count)} {plural(stats.count, 'участок', 'участка', 'участков')}
              </div>
              <div className="mt-1 text-[11.5px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-500)] cdrift" />
                в окне карты
                {viewedTotal > 0 && (
                  <>
                    <span className="text-zinc-300 normal-case">·</span>
                    <button
                      type="button"
                      onClick={clearViewed}
                      className="inline-flex items-center gap-1 normal-case tracking-normal text-zinc-400 hover:text-zinc-700 transition-colors"
                      title="Очистить историю просмотров"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                      {viewedTotal} просмотрено
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setSortOpen(v => !v); }}
                className="h-9 px-3 rounded-lg border border-zinc-200 text-[12.5px] font-medium text-zinc-700 hover:border-zinc-400 transition-colors flex items-center gap-2"
              >
                <ArrowDownUp className="size-3.5" />
                {SORTS[applied.sort]}
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-11 bg-white border border-zinc-200 rounded-xl shadow-xl p-1 z-[70] w-52">
                  {SORTS.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { const f = cloneFilters(applied); f.sort = i; applyFilters(f); setSortOpen(false); }}
                      className={`w-full text-left h-[38px] px-3 rounded-lg text-[13px] hover:bg-zinc-100 flex items-center justify-between ${i === applied.sort ? 'text-primary font-bold' : 'text-zinc-700'}`}
                    >
                      {s}
                      {i === applied.sort && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* список */}
          <div className="cscroll flex-1 overflow-y-auto">
            {loading ? (
              <SkeletonList />
            ) : windowResults.length === 0 ? (
              <EmptyBox onZoomOut={() => { mapApi.current?.fitAll(); }} onReset={resetAll} />
            ) : (
              <>
                {windowResults.map((l, i) => (
                  <DesktopCard
                    key={l.id}
                    listing={l}
                    ad={String(l.id) === promotedId && i === 0}
                    isViewed={isListingViewed(l, viewed)}
                    isFav={fav.has(String(l.id))}
                    isCmp={compare.has(String(l.id))}
                    isHovered={hoverId === String(l.id)}
                    onHover={setHoverId}
                    onFav={toggleFav}
                    onCmp={toggleCompare}
                    onOpen={markViewed}
                  />
                ))}
                <div className="px-5 py-8 text-center">
                  <div className="text-[12px] font-mono text-zinc-400">— показаны все {nf(windowResults.length)} —</div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* карта */}
        <section ref={mapSectionRef} className="relative flex-1 overflow-hidden">
          <CatalogMap
            items={pins}
            activeId={activeId}
            hoverId={hoverId}
            onPinHover={setHoverId}
            onPinClick={onPinClick}
            onMapClick={() => setActiveId(null)}
            onViewportChange={onViewportChange}
            apiRef={mapApi}
          />

          {/* топ-лево: аналитика + искать при движении */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex divide-x divide-zinc-100 pointer-events-auto">
              <div className="px-3 py-2">
                <div className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400">участков</div>
                <div className="font-extrabold tracking-tight text-[14px] text-zinc-900 leading-tight tabular-nums">{nf(stats.count)}</div>
              </div>
              <div className="px-3 py-2">
                <div className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400">медиана</div>
                <div className="font-extrabold tracking-tight text-[14px] text-zinc-900 leading-tight tabular-nums">{stats.medianM ? `${stats.medianM.toFixed(1)} млн` : '—'}</div>
              </div>
              <div className="px-3 py-2">
                <div className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-400">за сотку</div>
                <div className="font-extrabold tracking-tight text-[14px] text-primary leading-tight tabular-nums">{stats.perSotkaM ? `${stats.perSotkaM.toFixed(1)} млн` : '—'}</div>
              </div>
            </div>
            <label className="bg-white rounded-xl border border-zinc-200 shadow-sm px-3 py-2 flex items-center gap-2 cursor-pointer text-[12px] font-medium text-zinc-700 w-fit pointer-events-auto">
              <button
                type="button"
                role="switch"
                aria-checked={searchOnMove}
                onClick={() => setSearchOnMove(v => !v)}
                className={`relative w-8 h-4 rounded-full transition-colors ${searchOnMove ? 'bg-primary' : 'bg-zinc-300'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${searchOnMove ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              Искать при движении карты
            </label>
          </div>

          {/* топ-право: слои + зум */}
          <MapControls api={mapApi} />

          {/* карточка объявления на карте (клик по пину закрепляет, наведение — показывает) */}
          {previewListing && cardPos && (
            <MapCard
              listing={previewListing}
              pos={cardPos}
              bounds={mapBounds}
              pinned={!!activeId && activeId === previewId}
              onOpen={markViewed}
              onClose={() => setActiveId(null)}
              onHoverKeep={() => { /* карточка интерактивна */ }}
            />
          )}

          {/* полоса сравнения */}
          {compareItems.length > 0 && (
            <div className="absolute bottom-4 left-4 z-20 bg-white rounded-2xl border border-zinc-200 shadow-lg p-2 flex items-center gap-2 max-w-[680px]">
              <div className="px-2.5 py-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Сравнение</div>
                <div className="text-[12.5px] font-bold text-zinc-900">{compareItems.length} из 4</div>
              </div>
              <div className="flex items-center gap-1.5">
                {compareItems.map(l => {
                  const meta = cardMeta(l);
                  return (
                    <div key={l.id} className={`relative w-12 h-12 rounded-lg overflow-visible ring-2 ring-zinc-900 ring-offset-1 pimg pimg-${meta.imgIdx}`}>
                      {l.image && <img src={l.image} alt="" className="absolute inset-0 w-full h-full object-cover rounded-lg" loading="lazy" />}
                      <button
                        type="button"
                        onClick={() => toggleCompare(String(l.id))}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] flex items-center justify-center z-[2]"
                        aria-label="Убрать из сравнения"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 text-white text-[8px] font-bold py-0.5 text-center rounded-b-lg z-[1]">{fmtPriceShort(l.price)}</span>
                    </div>
                  );
                })}
                {compareItems.length < 4 && (
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-[18px]">+</div>
                )}
              </div>
              <span className="w-px h-10 bg-zinc-200" />
              <button
                type="button"
                onClick={goCompare}
                className="h-10 px-4 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-primary transition-colors flex items-center gap-1.5"
              >
                Сравнить →
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Drawer «Все фильтры» — портал в body: контейнер каталога (z-40) ниже хедера (z-1000) */}
      {drawerOpen && draft && createPortal(
        <div className="catalog-root">
          <div
            className={`fixed inset-0 bg-zinc-950/40 z-[1100] transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <aside
            aria-label="Все фильтры"
            className="fixed top-0 right-0 bottom-0 w-[420px] max-w-[92vw] bg-white z-[1101] flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.14)] transition-transform duration-[340ms]"
            style={{ transform: drawerVisible ? 'translateX(0)' : 'translateX(100%)', transitionTimingFunction: 'cubic-bezier(.32,.72,0,1)' }}
          >
            <div className="px-[22px] pt-5 pb-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="font-black text-[24px] text-zinc-900" style={{ letterSpacing: '-.05em' }}>Все фильтры</div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 text-[18px]"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[22px] pt-1.5 pb-[120px]">
              <AllFiltersBody filters={draft} onChange={setDraft} listings={landListings} />
            </div>
            <div className="absolute left-0 right-0 bottom-0 px-[22px] py-3.5 bg-gradient-to-b from-white/0 via-white/90 to-white flex gap-2.5">
              <button
                type="button"
                onClick={() => setDraft(defaultFilters())}
                className="h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-500 font-semibold text-[13px]"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={() => { applyFilters(draft); closeDrawer(); }}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2"
              >
                {applyLabel(draftCount)}
              </button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {/* Поповер (Цена / Площадь / Город) */}
      {popover && draft && (
        <div
          ref={popoverRef}
          className="fixed z-[75] bg-white border border-zinc-200 rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.18)] p-4 overflow-y-auto"
          style={{ left: popover.left, top: popover.top, width: popover.kind === 'city' ? 320 : 340, maxHeight: `calc(100vh - ${popover.top + 12}px)` }}
        >
          <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-zinc-500 mb-2.5">
            {popover.kind === 'price' ? 'Цена' : popover.kind === 'area' ? 'Площадь' : 'Город / район'}
          </div>
          {popover.kind === 'price' && <PriceSection filters={draft} onChange={setDraft} listings={landListings} />}
          {popover.kind === 'area' && <AreaSection filters={draft} onChange={setDraft} />}
          {popover.kind === 'city' && <CityChecklist filters={draft} onChange={setDraft} listings={landListings} />}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const f = cloneFilters(applied);
                if (popover.kind === 'price') { f.pLo = 0; f.pHi = PMAX; }
                else if (popover.kind === 'area') { f.aLo = 0; f.aHi = AMAX; }
                else f.cities = new Set();
                applyFilters(f); setPopover(null);
              }}
              className="flex-1 h-10 rounded-[10px] bg-white border border-zinc-200 text-zinc-500 text-[13px] font-semibold"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => { applyFilters(draft); setPopover(null); }}
              className="flex-1 h-10 rounded-[10px] bg-zinc-900 text-white text-[13px] font-semibold"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ Подкомпоненты десктопа ═══════════════════════

function TypeSegment({ listings, filters, onApply }: {
  listings: Listing[]; filters: FilterState; onApply(f: FilterState): void;
}) {
  const types = useMemo(() => landTypeCounts(listings), [listings]);
  const none = filters.types.size === 0;
  const pill = (on: boolean) =>
    `h-8 px-3 rounded-lg text-[12.5px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
      on ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.1)]' : 'text-zinc-600 hover:text-zinc-900'
    }`;
  return (
    <div className="shrink-0 flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5 text-[12.5px] font-medium">
      <button type="button" className={pill(none)} onClick={() => { const f = cloneFilters(filters); f.types = new Set(); onApply(f); }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-500)]" />
        Все <span className={`font-mono text-[10.5px] ${none ? 'text-primary' : 'text-zinc-400'}`}>{listings.length}</span>
      </button>
      {types.map(([label, count]) => {
        const on = filters.types.has(label);
        return (
          <button
            key={label}
            type="button"
            className={pill(on)}
            onClick={() => {
              const f = cloneFilters(filters);
              if (f.types.has(label)) f.types.delete(label); else f.types.add(label);
              onApply(f);
            }}
          >
            {label} <span className={`font-mono text-[10.5px] ${on ? 'text-primary' : 'text-zinc-400'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuickChips({ filters, onApply, onPopover, onDrawer }: {
  filters: FilterState;
  onApply(f: FilterState): void;
  onPopover(kind: 'price' | 'area' | 'city', e: React.MouseEvent<HTMLButtonElement>): void;
  onDrawer(): void;
}) {
  const priceActive = filters.pLo > 0 || filters.pHi < PMAX;
  const areaActive = filters.aLo > 0 || filters.aHi < AMAX;
  const items: { k: string; act: boolean; kk: string; v: string; drawer?: boolean }[] = [
    { k: 'price', act: priceActive, kk: 'Цена', v: priceActive ? `${filters.pLo}–${filters.pHi} млн` : '' },
    { k: 'area', act: areaActive, kk: 'Площадь', v: areaActive ? `${filters.aLo}–${filters.aHi} сот` : '' },
    { k: 'city', act: filters.cities.size > 0, kk: 'Город', v: filters.cities.size ? (filters.cities.size === 1 ? [...filters.cities][0] : `· ${filters.cities.size}`) : '' },
    { k: 'utils', act: filters.utils.size > 0, kk: 'Коммуникации', v: filters.utils.size ? `· ${filters.utils.size}` : '', drawer: true },
    { k: 'docs', act: filters.docs.size > 0, kk: 'Документы', v: filters.docs.size ? `· ${filters.docs.size}` : '', drawer: true },
    { k: 'feats', act: filters.feats.size > 0, kk: 'Особенности', v: filters.feats.size ? `· ${filters.feats.size}` : '', drawer: true },
  ];
  const clear = (k: string) => {
    const f = cloneFilters(filters);
    if (k === 'price') { f.pLo = 0; f.pHi = PMAX; }
    else if (k === 'area') { f.aLo = 0; f.aHi = AMAX; }
    else if (k === 'city') f.cities = new Set();
    else if (k === 'utils') f.utils = new Set();
    else if (k === 'docs') f.docs = new Set();
    else if (k === 'feats') f.feats = new Set();
    onApply(f);
  };
  return (
    <div className="shrink-0 flex items-center gap-2">
      {items.map(it => (
        <button
          key={it.k}
          type="button"
          onClick={e => {
            if ((e.target as HTMLElement).dataset.qx) { clear(it.k); return; }
            if (it.drawer) { onDrawer(); return; }
            onPopover(it.k as 'price' | 'area' | 'city', e);
          }}
          className={`shrink-0 h-9 px-3 rounded-lg border text-[12.5px] inline-flex items-center gap-[7px] whitespace-nowrap transition-colors ${
            it.act ? 'border-primary bg-[var(--brand-50)]' : 'border-dashed border-zinc-200 text-zinc-500 hover:border-zinc-400'
          }`}
        >
          {!it.act && '+ '}
          <span className="text-zinc-400">{it.kk}</span>
          {it.v && <span className="font-semibold text-[var(--brand-ink)]">{it.v}</span>}
          {it.act && <span data-qx="1" className="text-primary text-[11px]">×</span>}
        </button>
      ))}
    </div>
  );
}

function DesktopCard({ listing: l, ad, isViewed, isFav, isCmp, isHovered, onHover, onFav, onCmp, onOpen }: {
  listing: Listing; ad: boolean;
  isViewed: boolean; isFav: boolean; isCmp: boolean; isHovered: boolean;
  onHover(id: string | null): void;
  onFav(id: string): void;
  onCmp(id: string): void;
  onOpen(id: string): void;
}) {
  const id = String(l.id);
  const meta = cardMeta(l);
  return (
    <Link
      href={listingUrl(l)}
      onClick={() => onOpen(id)}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className={`block px-5 py-4 border-b transition-colors group relative ${
        ad ? 'border-zinc-200 bg-gradient-to-b from-[#fbfdfb] to-white' : 'border-zinc-100'
      } ${isHovered ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
      style={isCmp ? { boxShadow: 'inset 3px 0 0 #09090b' } : undefined}
    >
      <div className="flex gap-3">
        <div className={`relative w-[120px] h-[88px] rounded-xl overflow-hidden shrink-0 pimg pimg-${meta.imgIdx} ${isViewed ? 'opacity-70' : ''}`}>
          {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
          {ad && (
            <span className="absolute left-1.5 top-1.5 inline-flex items-center h-[18px] px-[7px] rounded-md bg-[rgba(250,250,247,0.85)] backdrop-blur-sm text-[#5b5e54] font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] border border-black/5 z-[1]">Реклама</span>
          )}
          {meta.urgent && !ad && (
            <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-[3px] h-[19px] px-[7px] rounded-md bg-zinc-950 text-white text-[10px] font-bold z-[1]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M13.5 2.2 5.6 12.6a.6.6 0 0 0 .48.96H10l-1.4 7.9a.4.4 0 0 0 .72.3l8-10.5a.6.6 0 0 0-.48-.96H12.7l1.5-7.6a.4.4 0 0 0-.7-.5z" /></svg>
              Срочно
            </span>
          )}
          {meta.photos > 0 && <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] text-zinc-700 bg-white/70 px-1 rounded z-[1]">{meta.photos} фото</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-medium text-zinc-500 tracking-wide truncate min-w-0">
              {l.landType} · {cityOf(l)}
            </div>
            <span className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                title="Добавить к сравнению"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onCmp(id); }}
                className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center transition-colors ${
                  isCmp ? 'bg-[var(--brand-50)] text-primary' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                }`}
              >
                <Plus className={`size-[15px] transition-transform duration-200 ${isCmp ? 'rotate-45' : ''}`} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                title="В избранное"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onFav(id); }}
                className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center transition-colors ${
                  isFav ? 'text-primary' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                }`}
              >
                <Bookmark className="size-[15px]" strokeWidth={1.7} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </span>
          </div>
          <h3 className="mt-0.5 font-semibold tracking-tight text-[13.5px] leading-snug text-zinc-900 line-clamp-2">{generateTitle(l)}</h3>
          <div className="mt-2 flex items-end justify-between">
            <div>
              {meta.drop && meta.oldPrice && (
                <div className="font-mono text-zinc-400 line-through leading-none text-[10.5px] mb-0.5">{meta.oldPrice}</div>
              )}
              <div className="font-extrabold tracking-tight text-[16px] text-zinc-900 leading-none">
                {fmtPrice(l.price)}
                {meta.drop && (
                  <span className="inline-flex items-center h-4 px-[5px] rounded-[5px] bg-zinc-100 text-zinc-950 text-[10px] font-bold ml-1.5 align-middle">−{meta.drop}%</span>
                )}
              </div>
              <div className="mt-0.5 text-[10.5px] font-mono text-zinc-500">{fmtPerSotka(l)}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isViewed && (
                <span className="inline-flex items-center gap-[3px] text-[9px] text-zinc-400 font-bold uppercase tracking-[0.05em]" title="Вы смотрели">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.4" /></svg>
                  смотрели
                </span>
              )}
              <div className={`text-[10px] font-mono ${meta.fresh ? 'text-primary font-semibold' : 'text-zinc-500'}`}>{meta.ago}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium flex-wrap">
            {meta.tags.map(t => (
              <span key={t.l} className={`px-1.5 py-0.5 rounded ${t.brand ? 'bg-[var(--brand-50)] text-primary' : 'bg-zinc-200 text-zinc-700'}`}>{t.l}</span>
            ))}
            {meta.ready && (
              <span className="inline-flex items-center gap-1 px-[7px] py-0.5 rounded-md bg-[#eef7f1] text-primary font-semibold border border-[rgba(6,111,54,0.22)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.3 12.2 2.5 2.5 4.9-5.4" /></svg>
                Готов к стройке
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function MapCard({ listing: l, pos, bounds, pinned, onOpen, onClose }: {
  listing: Listing;
  pos: { x: number; y: number };
  bounds: { w: number; h: number };
  pinned: boolean;
  onOpen(id: string): void;
  onClose(): void;
  onHoverKeep(): void;
}) {
  const meta = cardMeta(l);
  const W = 290, H = 300, GAP = 16, PAD = 12;
  // выбираем сторону: снизу → сверху → справа → слева, где помещается
  let placement: 'bottom' | 'top' | 'right' | 'left';
  if (pos.y + GAP + H <= bounds.h - PAD) placement = 'bottom';
  else if (pos.y - GAP - H >= PAD) placement = 'top';
  else if (pos.x + GAP + W <= bounds.w - PAD) placement = 'right';
  else placement = 'left';

  let left: number, top: number;
  const clampX = (v: number) => Math.max(PAD, Math.min(v, bounds.w - W - PAD));
  const clampY = (v: number) => Math.max(PAD, Math.min(v, bounds.h - H - PAD));
  if (placement === 'bottom' || placement === 'top') {
    left = clampX(pos.x - W / 2);
    top = placement === 'bottom' ? pos.y + GAP : pos.y - GAP - H;
  } else {
    top = clampY(pos.y - H / 2);
    left = placement === 'right' ? pos.x + GAP : pos.x - GAP - W;
  }
  // указатель-стрелка к пину
  const arrow = (() => {
    const base = 'absolute w-4 h-4 bg-white rotate-45';
    if (placement === 'bottom') return { cls: `${base} -top-2 border-l border-t border-zinc-200`, style: { left: pos.x - left - 8 } };
    if (placement === 'top') return { cls: `${base} -bottom-2 border-r border-b border-zinc-200`, style: { left: pos.x - left - 8 } };
    if (placement === 'right') return { cls: `${base} -left-2 border-l border-b border-zinc-200`, style: { top: pos.y - top - 8 } };
    return { cls: `${base} -right-2 border-r border-t border-zinc-200`, style: { top: pos.y - top - 8 } };
  })();

  return (
    <div
      className="absolute z-30 w-[290px] bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-visible cfadein"
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
    >
      <span className={arrow.cls} style={arrow.style as React.CSSProperties} />
      <div className="rounded-2xl overflow-hidden">
        <div className={`relative aspect-[16/9] pimg pimg-${meta.imgIdx}`}>
          {l.image && <img src={l.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
          {meta.drop && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur text-zinc-900 text-[10px] font-bold uppercase tracking-wider z-[1]">−{meta.drop}%</span>
          )}
          {pinned && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur text-zinc-700 flex items-center justify-center text-[13px] shadow-sm z-[2] hover:bg-white"
            >
              ×
            </button>
          )}
          {meta.photos > 1 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-zinc-900/70 text-white font-mono text-[10px] z-[1]">1/{meta.photos}</span>
          )}
        </div>
        <div className="p-3.5">
          <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider truncate">{l.landType} · {l.location}</div>
          <h4 className="mt-0.5 font-bold tracking-tight text-[14px] leading-snug text-zinc-900 line-clamp-2">{generateTitle(l)}</h4>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="font-extrabold tracking-tight text-[17px] text-zinc-900 leading-none">{fmtPrice(l.price)}</div>
              <div className="mt-0.5 text-[10.5px] font-mono text-zinc-500">{fmtPerSotka(l)}</div>
            </div>
            <Link
              href={listingUrl(l)}
              onClick={() => onOpen(String(l.id))}
              className="px-3 h-8 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold flex items-center gap-1 hover:bg-primary transition-colors"
            >
              Открыть →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapControls({ api }: { api: React.RefObject<CatalogMapApi | null> }) {
  const [layer, setLayer] = useState<'scheme' | 'sat'>('scheme');
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-1 flex gap-0.5 text-[12px] font-medium">
        {(['scheme', 'sat'] as const).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => { setLayer(k); api.current?.setLayer(k); }}
            className={`px-3 h-7 rounded-lg transition-colors ${layer === k ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            {k === 'scheme' ? 'Схема' : 'Спутник'}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-1 flex flex-col gap-0.5">
        <button type="button" onClick={() => api.current?.zoomIn()} className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-[16px]">+</button>
        <span className="h-px bg-zinc-100 mx-1.5" />
        <button type="button" onClick={() => api.current?.zoomOut()} className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-[16px]">−</button>
        <span className="h-px bg-zinc-100 mx-1.5" />
        <button type="button" title="Моё местоположение" onClick={() => api.current?.locate()} className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 flex items-center justify-center font-mono text-[12px]">⌖</button>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-zinc-100 flex gap-3">
          <div className="skel w-[120px] h-[88px] rounded-xl shrink-0" />
          <div className="flex-1">
            <div className="skel h-[9px] w-[55%]" />
            <div className="skel h-[14px] w-[90%] mt-2" />
            <div className="skel h-4 w-[38%] mt-3.5" />
            <div className="flex gap-[5px] mt-3">
              <div className="skel h-4 w-10" />
              <div className="skel h-4 w-11" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyBox({ onZoomOut, onReset }: { onZoomOut(): void; onReset(): void }) {
  return (
    <div className="px-7 py-14 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3.5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      </div>
      <h4 className="font-black text-[18px]" style={{ letterSpacing: '-.04em' }}>Ничего не нашлось</h4>
      <p className="mt-1.5 text-[13px] text-zinc-500 leading-normal">В этой области с такими фильтрами участков нет.<br />Отдалите карту или ослабьте фильтры.</p>
      <div className="mt-[18px] flex gap-2 justify-center">
        <button type="button" onClick={onZoomOut} className="h-10 px-4 rounded-[10px] text-[13px] font-semibold border border-zinc-200 bg-white text-zinc-900">Отдалить карту</button>
        <button type="button" onClick={onReset} className="h-10 px-4 rounded-[10px] text-[13px] font-semibold bg-zinc-900 text-white border border-zinc-900">Сбросить фильтры</button>
      </div>
    </div>
  );
}
