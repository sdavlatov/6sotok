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
interface LMap {
  setView(center: [number, number], zoom: number): LMap;
  remove(): void;
  fitBounds(bounds: LLatLngBounds, options?: { padding?: [number, number]; maxZoom?: number }): LMap;
  on(event: string, fn: (e: { latlng: { lat: number; lng: number } }) => void): LMap;
  zoomIn(): void;
  zoomOut(): void;
}
interface LMarker {
  addTo(map: LMap): LMarker;
  on(event: string, fn: () => void): LMarker;
  remove(): void;
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

// ─── Props ───────────────────────────────────────────────────────────────────
export interface MapViewProps {
  listings: MapItem[];
  onMarkerClick?: (listing: MapItem) => void;
  tileLayer?: string;
  onTileLayerChange?: (layer: string) => void;
  mapApiRef?: React.MutableRefObject<MapApi | null>;
  // Stats overlay
  statsCount?: number;
  statsMedian?: number;
  statsPerSotka?: number;
  // Search as move
  searchAsMove?: boolean;
  onSearchAsMoveChange?: (v: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MapView({
  listings,
  onMarkerClick,
  tileLayer = 'schema',
  onTileLayerChange,
  mapApiRef,
  statsCount,
  statsMedian,
  statsPerSotka,
  searchAsMove,
  onSearchAsMoveChange,
}: MapViewProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);
  const tileRef    = useRef<LTileLayer | null>(null);

  const [ready,    setReady]    = useState(false);
  const [error,    setError]    = useState(false);
  const [active,   setActive]   = useState<MapItem | null>(null);
  const [imgError, setImgError] = useState(false);

  const showOverlays = statsCount !== undefined || onTileLayerChange !== undefined;

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

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const withCoords = listings.filter(l => l.lat != null && l.lng != null);

    withCoords.forEach(listing => {
      const priceLabel = formatPrice(listing.price);
      const icon = L.divIcon({
        className: '',
        html: `<span style="
          display:inline-flex;align-items:center;
          background:white;color:#09090b;
          border:1.5px solid #e4e4e7;border-radius:20px;
          padding:5px 11px;font-size:11.5px;font-weight:800;
          white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.14);
          cursor:pointer;font-family:system-ui,sans-serif;
          transform:translateX(-50%);letter-spacing:-0.02em;
        ">${priceLabel}</span>`,
        iconAnchor: [0, 32],
      });

      const marker = L.marker([listing.lat!, listing.lng!], { icon })
        .addTo(map)
        .on('click', () => {
          setActive(prev => prev?.id === listing.id ? null : listing);
          setImgError(false);
          onMarkerClick?.(listing);
        });

      markersRef.current.push(marker);
    });

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(l => [l.lat!, l.lng!]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
      }
    } else {
      map.setView(KZ_CENTER, KZ_ZOOM);
    }
  }, [listings, ready, onMarkerClick]);

  // 5. Cleanup
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

  // Layers available
  const LAYERS = [
    { key: 'schema',    label: 'Схема' },
    { key: 'satellite', label: 'Спутник' },
    { key: 'cadastre',  label: 'Кадастр' },
    { key: 'heat',      label: 'Тепло цен' },
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
              const isActive = tileLayer === layer.key;
              const isDisabled = layer.key === 'cadastre' || layer.key === 'heat';
              return (
                <button
                  key={layer.key}
                  onClick={() => !isDisabled && onTileLayerChange?.(layer.key)}
                  title={isDisabled ? 'Скоро' : layer.label}
                  className={`px-3 h-7 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : isDisabled
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
            <button className="w-9 h-9 rounded-lg hover:bg-zinc-100 text-zinc-600 flex items-center justify-center transition-colors" title="Нарисовать область">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <circle cx="3" cy="17" r="1.5" fill="currentColor" />
                <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                <circle cx="13" cy="15" r="1.5" fill="currentColor" />
                <circle cx="21" cy="7"  r="1.5" fill="currentColor" />
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
      )}

      {/* Selected listing card — bottom right */}
      {active && (
        <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[300px]" style={{ zIndex: 900 }}>
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
                onClick={() => setActive(null)}
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
      )}
    </div>
  );
}
