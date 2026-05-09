'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { listingUrl } from '@/lib/listing-url';

export interface MapItem {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  location: string;
  image: string;
  landType?: string;
  purpose?: string;
  lat?: number | null;
  lng?: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS  = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const KZ_CENTER: [number, number] = [48.0, 68.0];
const KZ_ZOOM = 5;

export const TILE_URLS: Record<string, string> = {
  schema:    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

// ─── Leaflet types ───────────────────────────────────────────────────────────
interface LeafletMouseEvent {
  latlng: { lat: number; lng: number };
  containerPoint: { x: number; y: number };
}
interface LMap {
  setView(center: [number, number], zoom: number): LMap;
  remove(): void;
  fitBounds(bounds: LLatLngBounds, options?: { padding?: [number, number]; maxZoom?: number }): LMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (e: any) => void): LMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, fn?: (e: any) => void): LMap;
  zoomIn(): void;
  zoomOut(): void;
  latLngToContainerPoint(latlng: [number, number]): { x: number; y: number };
  getBounds(): { getNorth(): number; getSouth(): number; getEast(): number; getWest(): number };
  getZoom(): number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addLayer(layer: any): LMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeLayer(layer: any): LMap;
}
interface LMarker {
  addTo(map: LMap): LMarker;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (e: any) => void): LMarker;
  remove(): void;
  setIcon(icon: object): LMarker;
  getElement(): HTMLElement | null;
}
interface LTileLayer {
  addTo(map: LMap): LTileLayer;
  remove(): void;
}
interface LLatLngBounds {
  isValid(): boolean;
}
interface LeafletStatic {
  map(el: HTMLElement, options?: object): LMap;
  tileLayer(url: string, options?: object): LTileLayer;
  marker(latlng: [number, number], options?: object): LMarker;
  divIcon(options: object): object;
  latLngBounds(latlngs: [number, number][]): LLatLngBounds;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polygon(latlngs: [number, number][], options?: object): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circleMarker(latlng: [number, number], options?: object): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  circle(latlng: [number, number], options?: object): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polyline(latlngs: [number, number][], options?: object): any;
}

declare global {
  interface Window { L?: LeafletStatic }
}

// ─── Utils ───────────────────────────────────────────────────────────────────
export function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} млн ₸`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(0)} тыс ₸`;
  return `${price} ₸`;
}

const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('leaflet load error')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('leaflet load error'));
    document.head.appendChild(s);
  });
}

function loadCss(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = href;
  document.head.appendChild(link);
}

// ─── Public API ref type ─────────────────────────────────────────────────────
export interface MapApi {
  zoomIn: () => void;
  zoomOut: () => void;
}

export interface CompareItem {
  id: string | number;
  price: number;
  image: string;
  title: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface MapViewProps {
  listings: MapItem[];
  onMarkerClick?: (listing: MapItem) => void;
  tileLayer?: string;
  onTileLayerChange?: (layer: string) => void;
  mapApiRef?: React.MutableRefObject<MapApi | null>;
  highlightedId?: string | number | null;
  // Stats overlay
  statsCount?: number;
  statsMedian?: number;
  statsPerSotka?: number;
  // Search as move
  searchAsMove?: boolean;
  onSearchAsMoveChange?: (v: boolean) => void;
  // Compare
  compareList?: CompareItem[];
  onRemoveCompare?: (id: string | number) => void;
  onCompare?: () => void;
  onBoundsChange?: (bounds: { n: number; s: number; e: number; w: number }) => void;
  visitedIds?: Set<string | number>;
}

// ─── Marker icon factory ─────────────────────────────────────────────────────
function makeMarkerHtml(priceLabel: string, highlighted: boolean, active: boolean, visited = false, zoom = 12): string {
  let bg: string, border: string, shadow: string;
  if (active) {
    bg = '#066F36'; border = '#055a2b'; shadow = '0 4px 16px rgba(6,111,54,0.35)';
  } else if (highlighted) {
    bg = '#1a1a2e'; border = '#066F36'; shadow = '0 4px 16px rgba(6,111,54,0.35)';
  } else if (visited) {
    bg = '#d4d4d8'; border = '#a1a1aa'; shadow = '0 1px 4px rgba(0,0,0,0.14)';
  } else {
    bg = 'white'; border = '#d4d4d8'; shadow = '0 2px 8px rgba(0,0,0,0.14)';
  }

  if (zoom < 9) {
    // Large dot, no text
    const size = active || highlighted ? 20 : 16;
    const pulse = highlighted ? `<span style="position:absolute;inset:-5px;border-radius:50%;border:2px solid rgba(6,111,54,0.5);animation:pulseRing 1.4s ease-out infinite;"></span>` : '';
    return `<span style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
      ${pulse}
      <span style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid ${border};box-shadow:${shadow};display:inline-block;"></span>
    </span>`;
  }

  // Abbreviated label at mid zoom (9-11), full label at zoom >= 12
  const label = zoom < 12
    ? priceLabel.replace(' млн ₸', 'м').replace(' тыс ₸', 'к')
    : priceLabel;
  const fontSize  = zoom < 12 ? '10.5px' : '11.5px';
  const padding   = zoom < 12 ? '3px 8px'  : '5px 11px';

  const color = (active || highlighted) ? 'white' : visited ? '#a1a1aa' : '#09090b';
  const scale = highlighted ? 'scale(1.15)' : 'scale(1)';
  const pulse = highlighted ? `
    <span style="position:absolute;top:-4px;left:-4px;right:-4px;bottom:-4px;border-radius:20px;border:2px solid rgba(6,111,54,0.5);animation:pulseRing 1.4s ease-out infinite;"></span>` : '';
  return `<span style="position:relative;display:inline-flex;align-items:center;">
    ${pulse}
    <span style="position:relative;display:inline-flex;align-items:center;background:${bg};color:${color};border:1.5px solid ${border};border-radius:20px;padding:${padding};font-size:${fontSize};font-weight:800;white-space:nowrap;box-shadow:${shadow};cursor:pointer;font-family:system-ui,sans-serif;transform:${scale};transition:transform 0.15s,box-shadow 0.15s;letter-spacing:-0.02em;">${label}</span>
  </span>`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MapView({
  listings,
  onMarkerClick,
  tileLayer = 'schema',
  onTileLayerChange,
  mapApiRef,
  highlightedId,
  statsCount,
  statsMedian,
  statsPerSotka,
  searchAsMove,
  onSearchAsMoveChange,
  compareList,
  onRemoveCompare,
  onCompare,
  onBoundsChange,
  visitedIds,
}: MapViewProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LMap | null>(null);
  const markersMap = useRef<Map<string | number, { marker: LMarker; listing: MapItem }>>(new Map());
  const tileRef    = useRef<LTileLayer | null>(null);

  const [ready,       setReady]      = useState(false);
  const [error,       setError]      = useState(false);
  const [active,      setActive]     = useState<MapItem | null>(null);
  const [imgError,    setImgError]   = useState(false);
  const [pinPoint,    setPinPoint]   = useState<{ x: number; y: number } | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [isMoving,    setIsMoving]   = useState(false);
  const [heatPoints,  setHeatPoints] = useState<{ x: number; y: number; price: number }[]>([]);
  const [drawMode, setDrawMode] = useState<'none' | 'polygon' | 'radius'>('none');
  const [mapZoom, setMapZoom] = useState(KZ_ZOOM);
  const mapZoomRef = useRef(KZ_ZOOM);
  const drawPointsRef = useRef<[number, number][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawLayerRef = useRef<any>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const initialFitDone = useRef(false);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  const showOverlays = statsCount !== undefined || onTileLayerChange !== undefined;

  const POPUP_W = 300;

  // 1. Load Leaflet
  useEffect(() => {
    loadCss(LEAFLET_CSS);
    loadScript(LEAFLET_JS)
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  // 2. Init map
  useEffect(() => {
    if (!ready || !mapRef.current || leafletMap.current || !window.L) return;
    if ((mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      fadeAnimation: false,
    });
    map.setView(KZ_CENTER, KZ_ZOOM);
    leafletMap.current = map;

    if (mapApiRef) {
      mapApiRef.current = {
        zoomIn:  () => leafletMap.current?.zoomIn(),
        zoomOut: () => leafletMap.current?.zoomOut(),
      };
    }
  }, [ready, mapApiRef]);

  // 3. Switch tile layer
  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    if (tileRef.current) tileRef.current.remove();
    const url = TILE_URLS[tileLayer] ?? TILE_URLS.schema;
    tileRef.current = window.L.tileLayer(url, {
      maxZoom: 19,
      attribution: tileLayer === 'satellite'
        ? '© <a href="https://www.esri.com">Esri</a>'
        : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap.current);
  }, [ready, tileLayer]);

  // 4. Update markers
  useEffect(() => {
    if (!ready || !leafletMap.current || !window.L) return;
    const L = window.L;
    const map = leafletMap.current;

    markersMap.current.forEach(({ marker }) => marker.remove());
    markersMap.current.clear();

    const withCoords = listings.filter(l => l.lat != null && l.lng != null);

    const zl = mapZoomRef.current;
    const anchorY = zl < 9 ? 10 : zl < 12 ? 16 : 32;
    withCoords.forEach(listing => {
      const priceLabel = formatPrice(listing.price);
      const isHighlighted = highlightedId != null && String(highlightedId) === String(listing.id);
      const isVisited = visitedIds?.has(listing.id) ?? false;
      const icon = L.divIcon({
        className: '',
        html: `<div style="transform:translateX(-50%)">${makeMarkerHtml(priceLabel, isHighlighted, false, isVisited, zl)}</div>`,
        iconAnchor: [0, anchorY],
      });

      const marker = L.marker([listing.lat!, listing.lng!], { icon })
        .addTo(map)
        .on('click', (e: LeafletMouseEvent) => {
          setPinPoint(e?.containerPoint ?? null);
          setActive(prev => prev?.id === listing.id ? null : listing);
          setImgError(false);
          onMarkerClick?.(listing);
        });

      markersMap.current.set(listing.id, { marker, listing });
    });

    // Only auto-fit on first load — after that user controls zoom
    if (!initialFitDone.current) {
      if (withCoords.length === 1) {
        map.setView([withCoords[0].lat!, withCoords[0].lng!], 14);
        initialFitDone.current = true;
      } else if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map(l => [l.lat!, l.lng!]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 11 });
          initialFitDone.current = true;
        }
      } else {
        map.setView(KZ_CENTER, KZ_ZOOM);
        initialFitDone.current = true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, ready, onMarkerClick]);

  // 4b. Update marker icons when highlight/active/visited/zoom changes
  useEffect(() => {
    if (!ready || !window.L) return;
    const L = window.L;
    const zl = mapZoom;
    const anchorY = zl < 9 ? 10 : zl < 12 ? 16 : 32;
    markersMap.current.forEach(({ marker, listing }) => {
      const isHighlighted = highlightedId != null && String(highlightedId) === String(listing.id);
      const isActive = active != null && String(active.id) === String(listing.id);
      const isVisited = visitedIds?.has(listing.id) ?? false;
      const priceLabel = formatPrice(listing.price);
      marker.setIcon(L.divIcon({
        className: '',
        html: `<div style="transform:translateX(-50%)">${makeMarkerHtml(priceLabel, isHighlighted, isActive, isVisited, zl)}</div>`,
        iconAnchor: [0, anchorY],
      }));
    });
  }, [highlightedId, active, ready, visitedIds, mapZoom]);

  // 4c. Track zoom level for compact markers
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    const map = leafletMap.current;
    const onZoom = () => {
      const z = map.getZoom();
      mapZoomRef.current = z;
      setMapZoom(z);
    };
    map.on('zoomend', onZoom);
    return () => { map.off('zoomend', onZoom); };
  }, [ready]);

  // 5. Heat map points — recompute when map moves or listings change
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    const map = leafletMap.current;
    const compute = () => {
      const pts = listings
        .filter(l => l.lat != null && l.lng != null)
        .map(l => {
          const p = map.latLngToContainerPoint([l.lat!, l.lng!]);
          return { x: p.x, y: p.y, price: l.price };
        });
      setHeatPoints(pts);
    };
    const emitBounds = () => {
      if (!onBoundsChangeRef.current) return;
      const b = map.getBounds();
      onBoundsChangeRef.current({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() });
    };
    compute();
    map.on('moveend', compute);
    map.on('zoomend', compute);
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);
    return () => {
      map.off('moveend', compute);
      map.off('zoomend', compute);
      map.off('moveend', emitBounds);
      map.off('zoomend', emitBounds);
    };
  }, [ready, listings]);

  // 6. Search-as-move indicator
  useEffect(() => {
    if (!ready || !leafletMap.current) return;
    const map = leafletMap.current;
    const onStart = () => setIsMoving(true);
    const onEnd   = () => setIsMoving(false);
    if (searchAsMove) {
      map.on('movestart', onStart);
      map.on('moveend',   onEnd);
    }
    return () => {
      map.off('movestart', onStart);
      map.off('moveend',   onEnd);
      setIsMoving(false);
    };
  }, [ready, searchAsMove]);

  // 7. Cleanup
  useEffect(() => {
    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-100 text-zinc-500 text-sm">
        Не удалось загрузить карту. Проверьте интернет.
      </div>
    );
  }

  const LAYERS = [
    { key: 'schema',    label: 'Схема',     heat: false, disabled: false },
    { key: 'satellite', label: 'Спутник',   heat: false, disabled: false },
    { key: 'cadastre',  label: 'Кадастр',   heat: false, disabled: true  },
    { key: 'heat',      label: 'Тепло цен', heat: true,  disabled: false },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Loading */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <svg className="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-[12px] font-semibold">Загрузка карты…</span>
          </div>
        </div>
      )}

      {/* Map canvas — FIRST in DOM, overlays come after */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* ── Overlays (all after map canvas = paint on top) ── */}

      {/* TOP-LEFT: stats + search toggle */}
      {showOverlays && (
        <div className="absolute top-4 left-4 flex flex-col gap-2" style={{ zIndex: 800 }}>
          {/* Stats box */}
          {statsCount !== undefined && (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex divide-x divide-zinc-100 text-[12px]">
              <div className="px-3 py-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">видимо</div>
                <div className="font-black tracking-tight text-[15px] text-zinc-900">
                  {statsCount.toLocaleString('ru-RU')}
                </div>
              </div>
              {(statsMedian ?? 0) > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">медиана</div>
                  <div className="font-black tracking-tight text-[15px] text-zinc-900">
                    {fmtM(statsMedian!)}&nbsp;млн
                  </div>
                </div>
              )}
              {(statsPerSotka ?? 0) > 0 && (
                <div className="px-3 py-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">за сотку</div>
                  <div className="font-black tracking-tight text-[15px] text-primary">
                    {fmtM(statsPerSotka!)}&nbsp;млн
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search-as-move toggle */}
          {onSearchAsMoveChange && (
            <label className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm px-3 py-2 flex items-center gap-2 cursor-pointer text-[12px] font-medium text-zinc-700 select-none">
              <span className={`relative flex-shrink-0 w-8 h-4 rounded-full transition-colors duration-200 ${searchAsMove ? 'bg-primary' : 'bg-zinc-300'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${searchAsMove ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
              Искать при движении
              <input type="checkbox" className="sr-only" checked={!!searchAsMove} onChange={e => onSearchAsMoveChange(e.target.checked)} />
            </label>
          )}
        </div>
      )}

      {/* TOP-RIGHT: layer tabs + zoom + drawing tools */}
      {showOverlays && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end" style={{ zIndex: 800 }}>
          {/* Layer tabs */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex gap-px text-[12px] font-medium">
            {LAYERS.map(layer => {
              const isActive = layer.heat ? showHeatMap : (tileLayer === layer.key && !showHeatMap);
              return (
                <button
                  key={layer.key}
                  onClick={() => {
                    if (layer.disabled) return;
                    if (layer.heat) {
                      setShowHeatMap(prev => !prev);
                    } else {
                      setShowHeatMap(false);
                      onTileLayerChange?.(layer.key);
                    }
                  }}
                  title={layer.disabled ? 'Скоро' : layer.label}
                  className={`px-3 h-7 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : layer.disabled
                        ? 'text-zinc-300 cursor-default'
                        : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex flex-col">
            <button
              onClick={() => leafletMap.current?.zoomIn()}
              className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-lg flex items-center justify-center transition-colors"
            >+</button>
            <span className="h-px bg-zinc-100 mx-1.5" />
            <button
              onClick={() => leafletMap.current?.zoomOut()}
              className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-700 font-bold text-lg flex items-center justify-center transition-colors"
            >−</button>
            <span className="h-px bg-zinc-100 mx-1.5" />
            <button
              className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-colors"
              title="Моё местоположение"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          </div>

          {/* Drawing tools */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-zinc-200 shadow-sm p-1 flex flex-col">
            <button
              onClick={() => {
                if (!leafletMap.current || !window.L) return;
                const L = window.L;
                const map = leafletMap.current;
                if (drawMode === 'polygon') {
                  setDrawMode('none');
                  drawPointsRef.current = [];
                  if (drawLayerRef.current) { map.removeLayer(drawLayerRef.current); drawLayerRef.current = null; }
                  return;
                }
                setDrawMode('polygon');
                drawPointsRef.current = [];
                if (drawLayerRef.current) { map.removeLayer(drawLayerRef.current); drawLayerRef.current = null; }
                const onClick = (e: { latlng: { lat: number; lng: number } }) => {
                  drawPointsRef.current = [...drawPointsRef.current, [e.latlng.lat, e.latlng.lng]];
                  if (drawLayerRef.current) map.removeLayer(drawLayerRef.current);
                  if (drawPointsRef.current.length >= 2) {
                    drawLayerRef.current = L.polygon(drawPointsRef.current, {
                      color: '#066F36', fillColor: '#066F36', fillOpacity: 0.08,
                      weight: 2, dashArray: '6 4',
                    }).addTo(map);
                  }
                };
                const onDblClick = () => {
                  map.off('click', onClick);
                  map.off('dblclick', onDblClick);
                  setDrawMode('none');
                };
                map.on('click', onClick);
                map.on('dblclick', onDblClick);
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${drawMode === 'polygon' ? 'bg-primary text-white' : 'hover:bg-zinc-100 text-zinc-600'}`}
              title={drawMode === 'polygon' ? 'Завершить' : 'Нарисовать область'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <circle cx="3" cy="17" r="1.5" fill="currentColor" />
                <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                <circle cx="13" cy="15" r="1.5" fill="currentColor" />
                <circle cx="21" cy="7"  r="1.5" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (!leafletMap.current || !window.L) return;
                const L = window.L;
                const map = leafletMap.current;
                if (drawMode === 'radius') {
                  setDrawMode('none');
                  if (drawLayerRef.current) { map.removeLayer(drawLayerRef.current); drawLayerRef.current = null; }
                  return;
                }
                setDrawMode('radius');
                if (drawLayerRef.current) { map.removeLayer(drawLayerRef.current); drawLayerRef.current = null; }
                const onClick = (e: { latlng: { lat: number; lng: number } }) => {
                  if (drawLayerRef.current) map.removeLayer(drawLayerRef.current);
                  drawLayerRef.current = L.circle([e.latlng.lat, e.latlng.lng], {
                    radius: 25000, color: '#066F36', fillColor: '#066F36', fillOpacity: 0.06, weight: 2, dashArray: '6 4',
                  }).addTo(map);
                  map.off('click', onClick);
                  setDrawMode('none');
                };
                map.on('click', onClick);
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${drawMode === 'radius' ? 'bg-primary text-white' : 'hover:bg-zinc-100 text-zinc-600'}`}
              title={drawMode === 'radius' ? 'Отменить' : 'Радиус 25км от точки'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </button>
            {(drawLayerRef.current || drawMode !== 'none') && (
              <button
                onClick={() => {
                  if (drawLayerRef.current && leafletMap.current) leafletMap.current.removeLayer(drawLayerRef.current);
                  drawLayerRef.current = null; drawPointsRef.current = []; setDrawMode('none');
                }}
                className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-400 flex items-center justify-center transition-colors"
                title="Очистить"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* HEAT MAP overlay — blobs positioned at actual listing coords */}
      {showHeatMap && heatPoints.length > 0 && (() => {
        const maxPrice = Math.max(...heatPoints.map(p => p.price));
        const gradients = heatPoints.map(p => {
          const ratio = maxPrice > 0 ? p.price / maxPrice : 0.5;
          const r = Math.round(255 * Math.min(1, ratio * 2));
          const g = Math.round(180 * Math.max(0, 1 - ratio));
          const alpha = 0.12 + ratio * 0.22;
          return `radial-gradient(ellipse 80px 60px at ${p.x}px ${p.y}px, rgba(${r},${g},0,${alpha.toFixed(2)}) 0%, transparent 100%)`;
        });
        return (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 450, background: gradients.join(','), mixBlendMode: 'multiply' }}
          />
        );
      })()}

      {/* SEARCH-AS-MOVE indicator */}
      {isMoving && searchAsMove && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 850 }}>
          <div
            className="absolute inset-2 rounded-xl"
            style={{
              border: '2px dashed rgba(6,111,54,0.6)',
              animation: 'dashSpin 1.2s linear infinite',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-1.5 text-[12px] font-semibold text-primary border border-zinc-200 shadow-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Поиск…
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: Compare strip */}
      {compareList && compareList.length > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white rounded-2xl border border-zinc-200 shadow-lg p-2" style={{ zIndex: 900 }}>
          <div className="px-2.5 py-1.5 shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Сравнение</div>
            <div className="text-[12.5px] font-bold text-zinc-900">{compareList.length} из 4</div>
          </div>
          <div className="flex items-center gap-1.5">
            {compareList.map(item => (
              <div key={item.id} className="relative w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden ring-2 ring-primary ring-offset-1">
                {item.image
                  ? <img src={item.image} className="w-full h-full object-cover" alt="" loading="lazy" />
                  : <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200" />
                }
                <button
                  onClick={() => onRemoveCompare?.(item.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 text-white text-[9px] flex items-center justify-center"
                  style={{ zIndex: 1 }}
                >×</button>
                <span className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 text-white text-[8px] font-bold py-0.5 text-center rounded-b-lg">
                  {fmtM(item.price)}м
                </span>
              </div>
            ))}
            {compareList.length < 4 && (
              <div className="w-12 h-12 rounded-lg border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-xl">+</div>
            )}
          </div>
          <span className="w-px h-10 bg-zinc-200 shrink-0" />
          <button
            onClick={onCompare}
            className="h-10 px-4 rounded-xl bg-zinc-900 text-white text-[12px] font-semibold hover:bg-primary transition-colors flex items-center gap-1.5 shrink-0"
          >
            Сравнить →
          </button>
        </div>
      )}

      {/* BOTTOM-RIGHT: Analytics card (hidden when active pin popup is shown) */}
      {!active && showOverlays && (statsPerSotka ?? 0) > 0 && (
        <div className="absolute bottom-4 right-4 w-[260px]" style={{ zIndex: 900 }}>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500">в окне карты</div>
              <Link href="/analytics" className="text-[10.5px] font-mono text-primary font-bold hover:underline">Аналитика →</Link>
            </div>
            <div className="font-black tracking-tight text-[26px] leading-none text-zinc-900">
              {fmtM(statsPerSotka!)} млн ₸
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">средняя цена за сотку</div>
            <div className="mt-4 flex items-end gap-1 h-12">
              {[30, 42, 38, 55, 48, 62, 70, 78, 88, 100].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${i >= 8 ? 'bg-primary' : i >= 5 ? 'bg-zinc-300' : 'bg-zinc-200'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] text-zinc-400">
              <span>авг&apos;25</span>
              <span className="text-primary font-bold">↑ 18% / год</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected listing card — near pin */}
      {active && <ActiveCard
        active={active}
        pinPoint={pinPoint}
        imgError={imgError}
        setImgError={setImgError}
        setActive={setActive}
        setPinPoint={setPinPoint}
        mapRef={mapRef}
        popupW={POPUP_W}
      />}
    </div>
  );
}

// ─── Active card positioned near pin ─────────────────────────────────────────
function ActiveCard({
  active, pinPoint, imgError, setImgError, setActive, setPinPoint, mapRef, popupW,
}: {
  active: MapItem;
  pinPoint: { x: number; y: number } | null;
  imgError: boolean;
  setImgError: (v: boolean) => void;
  setActive: (v: MapItem | null) => void;
  setPinPoint: (v: { x: number; y: number } | null) => void;
  mapRef: React.RefObject<HTMLDivElement | null>;
  popupW: number;
}) {
  const mapW = mapRef.current?.offsetWidth ?? 800;
  const POPUP_H = 310;

  let left = (pinPoint?.x ?? mapW - popupW - 20) + 20;
  if (left + popupW > mapW - 8) left = (pinPoint?.x ?? popupW + 36) - popupW - 20;
  left = Math.max(8, Math.min(left, mapW - popupW - 8));

  const py = pinPoint?.y ?? POPUP_H + 30;
  const showBelow = py < POPUP_H + 20;
  const topPx = showBelow ? py + 24 : py;
  const transformY = showBelow ? '0%' : '-100%';

  return (
    <div style={{ zIndex: 900, position: 'absolute', left, top: topPx, width: popupW, transform: `translateY(${transformY})` }}>
      {/* Pointer triangle — bottom when popup is above pin */}
      {!showBelow && (
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-zinc-200 rotate-45" style={{ zIndex: 1 }} />
      )}
      {/* Pointer triangle — top when popup is below pin */}
      {showBelow && (
        <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-zinc-200 rotate-45" style={{ zIndex: 1 }} />
      )}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">
        <div className="relative h-36 bg-zinc-100">
          {active.image && !imgError ? (
            <img
              src={active.image}
              alt={active.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          <button
            onClick={() => { setActive(null); setPinPoint(null); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          {(active.purpose || active.landType) && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
              {active.purpose || active.landType}
            </span>
          )}
        </div>
        <div className="p-3.5">
          <p className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider truncate">{active.location}</p>
          <h4 className="mt-0.5 font-bold text-[16px] leading-tight text-zinc-900 line-clamp-2">{active.title}</h4>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-black text-[20px] text-zinc-900 leading-none tracking-tight">
              {formatPrice(active.price)}
            </div>
            <Link
              href={listingUrl(active)}
              className="h-9 px-4 rounded-xl bg-zinc-900 text-white text-[11.5px] font-semibold flex items-center gap-1 hover:bg-primary transition-colors"
            >
              Открыть →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
