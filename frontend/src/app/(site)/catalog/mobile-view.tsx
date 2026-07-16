'use client';

/**
 * Мобильная версия каталога (≤1024px) — порт мобильного вью макета:
 * карта на весь экран, топбар с крошками, чипы фильтров, bottom sheet
 * с 3 снапами (peek-карусель → полусписок → полный список),
 * полноэкранный sheet фильтров и детальный sheet с WhatsApp/звонком.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Plus, ChevronLeft, Check } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';
import { CatalogMap, type CatalogMapApi, type MapPinItem } from '@/components/catalog/catalog-map';
import {
  FilterState, cloneFilters, defaultFilters, activeFilterCount, matches,
  cardMeta, cityOf, fmtPrice, fmtPerSotka, median, nf, PMAX, AMAX, landTypeCounts, isListingViewed,
  waLink, telLink,
} from './catalog-utils';
import { AllFiltersBody, applyLabel, TypeGrid, PriceSection, AreaSection, CityChecklist, ChipGroup } from './filter-ui';
import { generateTitle } from '@/lib/listing-title';

type FocusKey = 'type' | 'price' | 'area' | 'city' | 'utils' | 'docs';
const FOCUS_TITLE: Record<FocusKey, string> = {
  type: 'Тип участка', price: 'Цена, млн ₸', area: 'Площадь',
  city: 'Город / район', utils: 'Коммуникации', docs: 'Документы',
};

type Snap = 'peek' | 'half' | 'full';

export interface MobileCatalogProps {
  listings: Listing[];       // все объявления (для счётчиков фильтров)
  results: Listing[];        // отфильтрованные в окне карты
  pins: MapPinItem[];
  applied: FilterState;
  applyFilters(f: FilterState): void;
  loading: boolean;
  fav: Set<string>; toggleFav(id: string): void;
  compare: Set<string>; toggleCompare(id: string): void;
  viewed: Set<string>; viewedTotal: number; markViewed(id: string): void; clearViewed(): void;
  onViewportChange(ids: string[], moved: boolean): void;
  goCompare(): void;
  resetAll(): void;
}

export function MobileCatalog(p: MobileCatalogProps) {
  const router = useRouter();
  const appRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const mapApi = useRef<CatalogMapApi | null>(null);

  // ── bottom sheet: 3 снапа ──
  const snaps = useRef({ full: 0, half: 0, peek: 0 });
  const curY = useRef(0);
  const [snap, setSnap] = useState<Snap>('peek');
  const [animate, setAnimate] = useState(true);

  const computeSnaps = useCallback(() => {
    const H = appRef.current?.clientHeight ?? 600;
    snaps.current = { full: Math.round(H * 0.10), half: Math.round(H * 0.52), peek: H - 176 };
    if (sheetRef.current) sheetRef.current.style.height = `${H - snaps.current.full}px`;
  }, []);

  const goSnap = useCallback((name: Snap, anim = true) => {
    setSnap(name);
    setAnimate(anim);
    curY.current = snaps.current[name];
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${curY.current}px)`;
  }, []);

  useEffect(() => {
    computeSnaps();
    goSnap('peek', false);
    const onResize = () => { computeSnaps(); goSnap(snap, false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // drag
  const drag = useRef({ on: false, startPtr: 0, startY: 0 });
  const dragStart = useCallback((e: React.PointerEvent) => {
    drag.current = { on: true, startPtr: e.clientY, startY: curY.current };
    setAnimate(false);
  }, []);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current.on || !sheetRef.current) return;
      let y = drag.current.startY + (e.clientY - drag.current.startPtr);
      y = Math.max(snaps.current.full, Math.min(snaps.current.peek, y));
      curY.current = y;
      sheetRef.current.style.transform = `translateY(${y}px)`;
    };
    const end = () => {
      if (!drag.current.on) return;
      drag.current.on = false;
      const pts: [Snap, number][] = [['full', snaps.current.full], ['half', snaps.current.half], ['peek', snaps.current.peek]];
      let best: Snap = 'peek', bd = Infinity;
      for (const [n, v] of pts) { const d = Math.abs(curY.current - v); if (d < bd) { bd = d; best = n; } }
      setAnimate(true);
      requestAnimationFrame(() => goSnap(best, true));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [goSnap]);

  const isList = snap !== 'peek';
  const chromeHidden = snap === 'full';

  // ── sheets ──
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [draft, setDraft] = useState<FilterState | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  // фокус-шит одного фильтра (тап по чипу открывает только его, а не всё окно)
  const [focus, setFocus] = useState<FocusKey | null>(null);
  const [focusVisible, setFocusVisible] = useState(false);

  const openFilters = useCallback(() => {
    setDraft(cloneFilters(p.applied));
    setDetailVisible(false); setDetailId(null);
    setFocusVisible(false); setFocus(null);
    setFiltersOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setFiltersVisible(true)));
  }, [p.applied]);
  const openFocus = useCallback((key: FocusKey) => {
    setDraft(cloneFilters(p.applied));
    setDetailVisible(false); setDetailId(null);
    setFocus(key);
    requestAnimationFrame(() => requestAnimationFrame(() => setFocusVisible(true)));
  }, [p.applied]);
  const closeOver = useCallback(() => {
    setFiltersVisible(false); setDetailVisible(false); setFocusVisible(false);
    setTimeout(() => { setFiltersOpen(false); setDetailId(null); setFocus(null); }, 360);
  }, []);
  const openDetail = useCallback((id: string) => {
    setFiltersVisible(false); setFiltersOpen(false);
    setFocusVisible(false); setFocus(null);
    setDetailId(id);
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)));
  }, []);

  const draftCount = useMemo(
    () => draft ? p.listings.filter(l => matches(l, draft)).length : 0,
    [draft, p.listings],
  );

  const detail = detailId ? p.listings.find(l => String(l.id) === detailId) ?? null : null;
  const stats = useMemo(() => ({
    perSotkaM: median(p.results.filter(l => l.area).map(l => l.price / l.area)) / 1e6,
  }), [p.results]);
  const activeCount = activeFilterCount(p.applied);
  const scrimShown = filtersVisible || detailVisible || focusVisible;

  const chips = useMemo(() => {
    const f = p.applied;
    const priceOn = f.pLo > 0 || f.pHi < PMAX;
    const areaOn = f.aLo > 0 || f.aHi < AMAX;
    return [
      f.types.size ? { key: 'type', label: f.types.size === 1 ? [...f.types][0] : 'Типы', b: f.types.size > 1 ? `· ${f.types.size}` : '', on: true } : { key: 'type', label: 'Тип', on: false },
      priceOn ? { key: 'price', label: 'Цена', b: `${f.pLo}–${f.pHi} млн`, on: true } : { key: 'price', label: 'Цена', on: false },
      areaOn ? { key: 'area', label: 'Площадь', b: `${f.aLo}–${f.aHi}`, on: true } : { key: 'area', label: 'Площадь', on: false },
      f.utils.size ? { key: 'utils', label: 'Коммуникации', b: `· ${f.utils.size}`, on: true } : { key: 'utils', label: 'Коммуникации', on: false },
      f.docs.size ? { key: 'docs', label: 'Документы', b: `· ${f.docs.size}`, on: true } : { key: 'docs', label: 'Документы', on: false },
      f.cities.size ? { key: 'city', label: 'Город', b: `· ${f.cities.size}`, on: true } : { key: 'city', label: 'Город', on: false },
    ] as { key: FocusKey; label: string; b?: string; on: boolean }[];
  }, [p.applied]);

  const openListing = useCallback((l: Listing) => {
    p.markViewed(String(l.id));
    router.push(listingUrl(l));
  }, [p, router]);

  const chromeCls = `transition-all duration-300 ${chromeHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;

  return (
    <div className="catalog-root fixed inset-0 top-[61px] z-40 bg-[#0c0d0c]">
      <div ref={appRef} className="relative w-full h-full bg-[#e6ede7] overflow-hidden isolate">
        {/* Карта */}
        <div className="absolute inset-0">
          <CatalogMap
            items={p.pins}
            activeId={detailId}
            onPinClick={openDetail}
            onViewportChange={p.onViewportChange}
            apiRef={mapApi}
          />
        </div>

        {/* Топбар: назад + крошки + фильтры */}
        <div className={`absolute top-0 left-0 right-0 z-40 px-2.5 py-2 flex items-center gap-1 bg-white ${chromeCls}`}>
          <button type="button" aria-label="Назад" onClick={() => router.back()} className="w-[38px] h-[38px] shrink-0 flex items-center justify-center">
            <ChevronLeft className="size-4 text-zinc-950" strokeWidth={2.2} />
          </button>
          <nav aria-label="Хлебные крошки" className="flex-1 min-w-0 h-[38px] flex items-center gap-1.5 px-1 overflow-x-auto whitespace-nowrap no-scrollbar">
            <Link href="/" className="text-[12px] text-zinc-500 font-medium shrink-0">Главная</Link>
            <span className="text-zinc-300 text-[11px] shrink-0">/</span>
            <Link href="/catalog" className="text-[12px] text-zinc-500 font-medium shrink-0">Купить</Link>
            <span className="text-zinc-300 text-[11px] shrink-0">/</span>
            <span className="text-[12.5px] text-zinc-900 font-semibold shrink-0" style={{ letterSpacing: '-.01em' }}>Участки</span>
          </nav>
          <button type="button" aria-label="Все фильтры" onClick={openFilters} className="relative w-[42px] h-[38px] rounded-[11px] bg-zinc-900 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
            {activeCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[var(--brand-500)] text-white text-[9px] font-black flex items-center justify-center">{activeCount}</span>
            )}
          </button>
        </div>

        {/* Чипы */}
        <div className={`absolute top-[54px] left-0 right-0 z-[39] px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-zinc-50 border-t border-zinc-100 border-b border-b-zinc-200 shadow-[0_10px_18px_-14px_rgba(9,9,11,0.28)] ${chromeCls}`}>
          {chips.map(c => (
            <button
              key={c.label}
              type="button"
              onClick={() => openFocus(c.key)}
              className={`shrink-0 h-8 px-3 rounded-full border text-[12px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${
                c.on ? 'border-primary bg-[var(--brand-50)] text-[var(--brand-ink)]' : 'border-dashed border-zinc-300 bg-white/85 text-zinc-500'
              }`}
            >
              {!c.on && '+ '}{c.label}{c.b && <b className="text-primary font-bold">{c.b}</b>}{c.on && <span className="text-primary text-[12px]">×</span>}
            </button>
          ))}
        </div>

        {/* Контролы карты */}
        <div className={`absolute top-[118px] right-3 z-30 flex flex-col gap-2 items-end ${chromeCls}`}>
          <div className="bg-white rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
            <button type="button" aria-label="Приблизить" onClick={() => mapApi.current?.zoomIn()} className="w-[42px] h-[42px] flex items-center justify-center text-zinc-700 text-lg font-bold active:bg-zinc-100">+</button>
            <div className="h-px bg-zinc-100" />
            <button type="button" aria-label="Отдалить" onClick={() => mapApi.current?.zoomOut()} className="w-[42px] h-[42px] flex items-center justify-center text-zinc-700 text-lg font-bold active:bg-zinc-100">−</button>
            <div className="h-px bg-zinc-100" />
            <button type="button" aria-label="Моё местоположение" onClick={() => mapApi.current?.locate()} className="w-[42px] h-[42px] flex items-center justify-center text-zinc-700 text-sm font-mono active:bg-zinc-100">⌖</button>
          </div>
          <MobileLayerSwitch api={mapApi} />
        </div>

        {/* Bottom sheet */}
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[20px] z-50 shadow-[0_-8px_28px_rgba(0,0,0,0.10),0_-2px_6px_rgba(0,0,0,0.04)] flex flex-col will-change-transform touch-none"
          style={animate ? { transition: 'transform .34s cubic-bezier(0.32,0.72,0,1)' } : undefined}
        >
          <div className="pt-[9px] pb-[5px] flex justify-center shrink-0 cursor-grab" onPointerDown={dragStart}>
            <div className="w-10 h-1 rounded-full bg-zinc-300" />
          </div>
          <div className="px-4 pt-1.5 pb-3 flex items-center justify-between gap-2.5 shrink-0" onPointerDown={dragStart}>
            <div>
              <div className="font-black text-[16px] leading-none" style={{ letterSpacing: '-.04em' }}>{nf(p.results.length)} участков</div>
              <div className="mt-1 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.06em] flex items-center gap-[5px]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {stats.perSotkaM ? `ср. ${stats.perSotkaM.toFixed(1)} млн / сотка` : 'в окне карты'}
                {p.viewedTotal > 0 && (
                  <button
                    type="button"
                    onClick={p.clearViewed}
                    onPointerDown={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 normal-case text-zinc-400 active:text-zinc-700"
                    aria-label="Очистить историю просмотров"
                  >
                    <span className="text-zinc-300">·</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    {p.viewedTotal}
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => goSnap(snap === 'peek' ? 'full' : 'peek')}
              onPointerDown={e => e.stopPropagation()}
              className={`h-[34px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0 ${isList ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}
            >
              {isList ? 'На карту' : 'Списком'}
            </button>
          </div>

          {/* список — всегда вертикальный (без горизонтальной карусели) */}
          {(
            <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain touch-pan-y">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pt-0.5 pb-3 border-b border-zinc-100">
                <MobileTypeRow listings={p.listings} filters={p.applied} onApply={p.applyFilters} />
              </div>
              {p.compare.size > 0 && (
                <div className="sticky top-0 z-[3] flex items-center gap-2.5 px-4 py-2.5 bg-[var(--brand-ink)] text-white">
                  <div>
                    <div className="font-extrabold text-[13px]" style={{ letterSpacing: '-.02em' }}>Сравнение · {p.compare.size}</div>
                    <div className="text-[11px] opacity-70">выберите до 4 участков</div>
                  </div>
                  <button type="button" onClick={() => [...p.compare].forEach(p.toggleCompare)} className="ml-auto text-white/70 text-base" aria-label="Очистить">×</button>
                  <button type="button" onClick={p.goCompare} className="h-8 px-3.5 rounded-full bg-white text-[var(--brand-ink)] font-bold text-[12px]">Сравнить</button>
                </div>
              )}
              {p.loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-zinc-100">
                    <div className="skel w-24 h-24 rounded-xl shrink-0" />
                    <div className="flex-1">
                      <div className="skel h-[9px] w-1/2" />
                      <div className="skel h-[14px] w-[88%] mt-2" />
                      <div className="skel h-4 w-2/5 mt-3" />
                    </div>
                  </div>
                ))
                : p.results.length
                  ? (
                    <>
                      {p.results.map(l => (
                        <MobileRowCard
                          key={l.id}
                          listing={l}
                          viewed={isListingViewed(l, p.viewed)}
                          fav={p.fav.has(String(l.id))}
                          cmp={p.compare.has(String(l.id))}
                          onFav={p.toggleFav}
                          onCmp={p.toggleCompare}
                          onOpen={() => openDetail(String(l.id))}
                        />
                      ))}
                      <div className="px-4 pt-6 pb-[calc(28px+var(--safe-b))] text-center font-mono text-[11px] text-zinc-400">
                        — показаны все {nf(p.results.length)} —
                      </div>
                    </>
                  )
                  : <MobileEmpty onReset={p.resetAll} />}
            </div>
          )}
        </div>

        {/* Scrim */}
        <div
          className={`absolute inset-0 bg-black/45 z-[60] transition-opacity duration-300 ${scrimShown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={closeOver}
        />

        {/* Sheet фильтров */}
        {filtersOpen && draft && (
          <div
            className="absolute left-0 right-0 bottom-0 top-[70px] bg-white rounded-t-[20px] z-[61] flex flex-col shadow-[0_-8px_28px_rgba(0,0,0,0.16)] transition-transform duration-[360ms]"
            style={{ transform: filtersVisible ? 'translateY(0)' : 'translateY(100%)', transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
          >
            <div className="pt-[9px] pb-[5px] flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300" />
            </div>
            <div className="px-4 pt-1.5 pb-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <div className="font-black text-[22px]" style={{ letterSpacing: '-.05em' }}>Фильтры</div>
              <button type="button" onClick={() => setDraft(defaultFilters())} className="text-[13px] text-zinc-500 font-medium">Сбросить</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[120px]">
              <AllFiltersBody filters={draft} onChange={setDraft} listings={p.listings} />
            </div>
            <div className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-[calc(16px+var(--safe-b))] bg-gradient-to-b from-white/0 via-white/95 to-white flex gap-2">
              <button
                type="button"
                onClick={() => { p.applyFilters(draft); closeOver(); if (snap === 'peek') goSnap('half'); }}
                className="flex-1 h-[50px] rounded-[14px] bg-zinc-900 text-white font-bold text-[14px] flex items-center justify-center gap-2"
                style={{ letterSpacing: '-.02em' }}
              >
                {applyLabel(draftCount)}
              </button>
            </div>
          </div>
        )}

        {/* Фокус-шит одного фильтра (тап по чипу) */}
        {focus && draft && (
          <div
            className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[20px] z-[61] flex flex-col shadow-[0_-8px_28px_rgba(0,0,0,0.16)] max-h-[calc(100%-90px)] transition-transform duration-[360ms]"
            style={{ transform: focusVisible ? 'translateY(0)' : 'translateY(100%)', transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
          >
            <div className="pt-[9px] pb-[5px] flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-300" />
            </div>
            <div className="px-4 pt-1.5 pb-3.5 border-b border-zinc-100 flex items-center justify-between shrink-0">
              <div className="font-black text-[20px]" style={{ letterSpacing: '-.04em' }}>{FOCUS_TITLE[focus]}</div>
              <button
                type="button"
                onClick={() => {
                  const f = cloneFilters(draft);
                  if (focus === 'type') f.types = new Set();
                  else if (focus === 'price') { f.pLo = 0; f.pHi = PMAX; }
                  else if (focus === 'area') { f.aLo = 0; f.aHi = AMAX; }
                  else if (focus === 'city') f.cities = new Set();
                  else if (focus === 'utils') f.utils = new Set();
                  else if (focus === 'docs') f.docs = new Set();
                  setDraft(f);
                }}
                className="text-[13px] text-zinc-500 font-medium"
              >
                Сбросить
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[96px]">
              {focus === 'type' && <TypeGrid filters={draft} onChange={setDraft} listings={p.listings} />}
              {focus === 'price' && <PriceSection filters={draft} onChange={setDraft} listings={p.listings} />}
              {focus === 'area' && <AreaSection filters={draft} onChange={setDraft} />}
              {focus === 'city' && <CityChecklist filters={draft} onChange={setDraft} listings={p.listings} />}
              {focus === 'utils' && <ChipGroup filters={draft} onChange={setDraft} listings={p.listings} group="utils" />}
              {focus === 'docs' && <ChipGroup filters={draft} onChange={setDraft} listings={p.listings} group="docs" />}
            </div>
            <div className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-[calc(16px+var(--safe-b))] bg-gradient-to-b from-white/0 via-white/95 to-white flex gap-2">
              <button
                type="button"
                onClick={() => { p.applyFilters(draft); closeOver(); if (snap === 'peek') goSnap('half'); }}
                className="flex-1 h-[50px] rounded-[14px] bg-zinc-900 text-white font-bold text-[14px] flex items-center justify-center gap-2"
                style={{ letterSpacing: '-.02em' }}
              >
                {applyLabel(draftCount)}
              </button>
            </div>
          </div>
        )}

        {/* Детальный sheet */}
        {detail && (
          <MobileDetailSheet
            listing={detail}
            visible={detailVisible}
            fav={p.fav.has(String(detail.id))}
            onFav={p.toggleFav}
            onOpen={() => openListing(detail)}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════ Подкомпоненты мобайла ═══════════════════════

function MobileLayerSwitch({ api }: { api: React.RefObject<CatalogMapApi | null> }) {
  const [layer, setLayer] = useState<'scheme' | 'sat'>('scheme');
  return (
    <div className="bg-white rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] p-[5px] flex flex-col gap-[3px]">
      {(['scheme', 'sat'] as const).map(k => (
        <button
          key={k}
          type="button"
          onClick={() => { setLayer(k); api.current?.setLayer(k); }}
          className={`h-[26px] px-2 rounded-[9px] text-[11px] font-semibold transition-colors ${layer === k ? 'bg-zinc-900 text-white' : 'text-zinc-500'}`}
          style={{ letterSpacing: '-.02em' }}
        >
          {k === 'scheme' ? 'Схема' : 'Спутник'}
        </button>
      ))}
    </div>
  );
}

function MobileTypeRow({ listings, filters, onApply }: {
  listings: Listing[]; filters: FilterState; onApply(f: FilterState): void;
}) {
  const types = useMemo(() => landTypeCounts(listings), [listings]);
  const chip = (on: boolean) =>
    `shrink-0 h-8 px-3 rounded-full border text-[12px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap ${
      on ? 'border-primary bg-[var(--brand-50)] text-[var(--brand-ink)]' : 'border-zinc-200 bg-white text-zinc-900'
    }`;
  return (
    <>
      <button type="button" className={chip(filters.types.size === 0)} onClick={() => { const f = cloneFilters(filters); f.types = new Set(); onApply(f); }}>
        Все <span className="font-mono text-[10.5px] opacity-70">{listings.length}</span>
      </button>
      {types.map(([label, count]) => (
        <button
          key={label}
          type="button"
          className={chip(filters.types.has(label))}
          onClick={() => {
            const f = cloneFilters(filters);
            if (f.types.has(label)) f.types.delete(label); else f.types.add(label);
            onApply(f);
          }}
        >
          {label} <span className="font-mono text-[10.5px] opacity-70">{count}</span>
        </button>
      ))}
    </>
  );
}

function MobileRowCard({ listing: l, viewed, fav, cmp, onFav, onCmp, onOpen }: {
  listing: Listing; viewed: boolean; fav: boolean; cmp: boolean;
  onFav(id: string): void; onCmp(id: string): void; onOpen(): void;
}) {
  const id = String(l.id);
  const meta = cardMeta(l);
  return (
    <div
      className="flex gap-3 px-4 py-3.5 border-b border-zinc-100 bg-white border-l-[3px] border-l-transparent"
      style={cmp ? { boxShadow: 'inset 3px 0 0 var(--brand-500)' } : undefined}
      onClick={onOpen}
    >
      <div className={`w-24 h-24 rounded-xl relative shrink-0 overflow-hidden pimg pimg-${meta.imgIdx} ${viewed ? 'opacity-70' : ''}`}>
        {l.image && <img src={l.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <div className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.05em] truncate flex-1 min-w-0">{l.landType} · {cityOf(l)}</div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label="В сравнение"
              onClick={e => { e.stopPropagation(); onCmp(id); }}
              className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center ${cmp ? 'text-primary bg-[var(--brand-50)]' : 'text-zinc-400'}`}
            >
              <Plus className={`size-[15px] transition-transform ${cmp ? 'rotate-45' : ''}`} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              aria-label="В избранное"
              onClick={e => { e.stopPropagation(); onFav(id); }}
              className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center ${fav ? 'text-primary' : 'text-zinc-400'}`}
            >
              <Bookmark className="size-[15px]" strokeWidth={1.7} fill={fav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <div className="mt-px font-semibold text-[13.5px] leading-[1.25] line-clamp-2" style={{ letterSpacing: '-.02em' }}>{generateTitle(l)}</div>
        <div className="mt-1.5 flex items-end justify-between">
          <div>
            {meta.drop && meta.oldPrice && (
              <div className="font-mono text-zinc-400 line-through leading-none text-[9.5px] mb-0.5">{meta.oldPrice}</div>
            )}
            <div className="font-extrabold text-[16px] leading-none" style={{ letterSpacing: '-.03em' }}>
              {fmtPrice(l.price)}
              {meta.drop && (
                <span className="inline-flex items-center h-[15px] px-[5px] rounded-[4px] bg-zinc-100 text-zinc-950 text-[9px] font-bold ml-1.5 align-middle">−{meta.drop}%</span>
              )}
            </div>
            <div className="font-mono mt-0.5 text-[10px] text-zinc-500">{fmtPerSotka(l)}</div>
          </div>
          <div className="flex items-center gap-1.5">
            {viewed && (
              <span className="inline-flex items-center gap-[3px] font-mono text-[9px] text-zinc-400 font-bold uppercase tracking-[0.05em]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.4" /></svg>
                вы смотрели
              </span>
            )}
            <div className={`font-mono text-[9.5px] font-semibold ${meta.fresh ? 'text-primary' : 'text-zinc-400'}`}>{meta.ago}</div>
          </div>
        </div>
        <div className="mt-1.5 flex gap-1 flex-wrap">
          {meta.tags.map(t => (
            <span key={t.l} className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${t.brand ? 'bg-[var(--brand-50)] text-primary' : 'bg-zinc-100 text-zinc-700'}`}>{t.l}</span>
          ))}
          {meta.ready && (
            <span className="inline-flex items-center gap-[3px] px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-[#eef7f1] text-primary border border-[rgba(6,111,54,0.22)]">
              <Check className="size-2.5" strokeWidth={3} />
              Готов к стройке
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileDetailSheet({ listing: l, visible, fav, onFav, onOpen }: {
  listing: Listing; visible: boolean; fav: boolean; onFav(id: string): void; onOpen(): void;
}) {
  const meta = cardMeta(l);
  const wa = waLink(l.seller?.phone);
  const tel = telLink(l.seller?.phone);
  return (
    <div
      className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[20px] z-[61] flex flex-col shadow-[0_-8px_28px_rgba(0,0,0,0.16)] max-h-[calc(100%-70px)] transition-transform duration-[360ms]"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)', transitionTimingFunction: 'cubic-bezier(0.32,0.72,0,1)' }}
    >
      <div className="pt-[9px] pb-[5px] flex justify-center shrink-0">
        <div className="w-10 h-1 rounded-full bg-zinc-300" />
      </div>
      <div className="flex-1 overflow-y-auto cfadein pb-[calc(20px+var(--safe-b))]">
        {/* фото-карусель */}
        <div className={`h-[190px] relative mx-3 rounded-[14px] overflow-hidden pimg pimg-${meta.imgIdx}`}>
          {l.image && <img src={l.image} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />}
          {meta.urgent && <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded bg-zinc-950/90 text-white text-[10px] font-bold uppercase tracking-[0.06em] z-[1]">Срочно</span>}
          <button
            type="button"
            aria-label="В избранное"
            onClick={() => onFav(String(l.id))}
            className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-white/[0.92] shadow-[0_1px_4px_rgba(0,0,0,0.15)] flex items-center justify-center z-[1] ${fav ? 'text-primary' : 'text-zinc-500'}`}
          >
            <Bookmark className="size-4" strokeWidth={1.7} fill={fav ? 'currentColor' : 'none'} />
          </button>
          {meta.photos > 1 && (
            <div className="absolute bottom-3 left-3 flex gap-[3px] z-[1]">
              <span className="w-[18px] h-[3px] rounded-full bg-white" />
              <span className="w-3 h-[3px] rounded-full bg-white/50" />
              <span className="w-3 h-[3px] rounded-full bg-white/50" />
            </div>
          )}
        </div>
        <div className="px-4 pt-3">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.05em] font-semibold">{l.landType} · {l.location}</div>
          <h3 className="mt-1 font-black text-[19px] leading-[1.2]" style={{ letterSpacing: '-.04em' }}>{generateTitle(l)}</h3>
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div>
              {meta.drop && meta.oldPrice && (
                <div className="font-mono text-zinc-400 line-through leading-none text-[11px] mb-1">{meta.oldPrice}</div>
              )}
              <div className="font-black text-[24px] leading-none flex items-center gap-2" style={{ letterSpacing: '-.04em' }}>
                {fmtPrice(l.price)}
                {meta.drop && (
                  <span className="inline-flex items-center h-5 px-1.5 rounded-md bg-zinc-100 text-zinc-950 text-[11px] font-bold">−{meta.drop}%</span>
                )}
              </div>
              <div className="font-mono mt-1 text-[11px] text-zinc-500">
                {fmtPerSotka(l)}{meta.drop ? ' · снижение за месяц' : ''}
              </div>
            </div>
            <div className="font-mono text-[10px] text-primary font-bold">{meta.ago} назад</div>
          </div>
          {/* метрики */}
          <div className="mt-3 grid grid-cols-3 border-y border-zinc-100">
            <div className="py-2.5">
              <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.06em] font-bold">До Алматы</div>
              <div className="mt-0.5 text-[13px] font-extrabold" style={{ letterSpacing: '-.03em' }}>{meta.distKm != null ? `${meta.distKm} км` : '—'}</div>
            </div>
            <div className="py-2.5 pl-3 border-l border-zinc-100">
              <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.06em] font-bold">Высота</div>
              <div className="mt-0.5 text-[13px] font-extrabold" style={{ letterSpacing: '-.03em' }}>{meta.altM} м</div>
            </div>
            <div className="py-2.5 pl-3 border-l border-zinc-100">
              <div className="font-mono text-[9px] text-zinc-400 uppercase tracking-[0.06em] font-bold">Кадастр</div>
              <div className={`mt-0.5 text-[13px] font-extrabold ${meta.cadVerified ? 'text-primary' : 'text-zinc-500'}`} style={{ letterSpacing: '-.03em' }}>
                {meta.cadVerified ? 'проверен' : 'на проверке'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-1 flex-wrap">
            {meta.tags.map(t => (
              <span key={t.l} className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${t.brand ? 'bg-[var(--brand-50)] text-primary' : 'bg-zinc-100 text-zinc-700'}`}>{t.l}</span>
            ))}
          </div>
          {/* кнопки: открыть / WhatsApp / позвонить (чата в продукте нет) */}
          <div className="mt-3.5 flex gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 h-[46px] rounded-xl bg-zinc-950 text-white font-bold text-[13px]"
              style={{ letterSpacing: '-.02em' }}
            >
              Открыть объявление
            </button>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать в WhatsApp"
                className="w-[46px] h-[46px] rounded-xl bg-[#25D366] flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-.9 1.7-.6 2.7a9 9 0 0 0 4.6 4.8c1.4.6 2 .5 2.7.4.5-.1 1.4-.6 1.5-1.1.2-.5.2-.9.1-1z" /></svg>
              </a>
            )}
            {tel && (
              <a
                href={tel}
                aria-label="Позвонить"
                className="w-[46px] h-[46px] rounded-xl bg-zinc-100 flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2.5h2.6l1.2 3.2-1.7 1.3a10.5 10.5 0 0 0 4.9 4.9l1.3-1.7 3.2 1.2V14a1.5 1.5 0 0 1-1.6 1.5C7.6 15 3 10.4 2.5 4.1A1.5 1.5 0 0 1 4 2.5z" stroke="#09090b" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileEmpty({ onReset }: { onReset(): void }) {
  return (
    <div className="w-full px-6 py-11 text-center cfadein">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3.5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      </div>
      <h4 className="font-black text-[18px]" style={{ letterSpacing: '-.04em' }}>Ничего не нашлось</h4>
      <p className="mt-1.5 text-[13px] text-zinc-500 leading-normal">В этой области с такими фильтрами участков нет.<br />Отдалите карту или ослабьте фильтры.</p>
      <div className="mt-[18px] flex gap-2 justify-center flex-wrap">
        <button type="button" onClick={onReset} className="h-[42px] px-4 rounded-xl text-[13px] font-semibold bg-zinc-900 text-white">Сбросить фильтры</button>
      </div>
    </div>
  );
}
