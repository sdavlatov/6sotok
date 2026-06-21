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
  area?: number;
  hasStateAct?: boolean;
  hasElectricity?: boolean;
  hasGas?: boolean;
  hasWater?: boolean;
  hasRoadAccess?: boolean;
  createdAt?: string;
  listingCategory?: 'land' | 'business';
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS  = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const CLUSTER_VERSION = '1.5.3';
const CLUSTER_CSS = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.css`;
const CLUSTER_CSS_DEFAULT = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.Default.css`;
const CLUSTER_JS  = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/leaflet.markercluster.js`;

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
  latLngToLayerPoint(latlng: [number, number]): { x: number; y: number };
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface LClusterGroup { addLayer(m: any): void; clearLayers(): void; addTo(map: LMap): LClusterGroup; remove(): void; }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markerClusterGroup?(options?: object): LClusterGroup;
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

function loadScript(src: string, readyCheck?: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (readyCheck ? readyCheck() : !!window.L) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('script load error')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('script load error'));
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
// zoom < 10  → dot with number
// zoom 10-11 → compact price pill
// zoom >= 12 → full price pill
//
// Base color determined by price tier (0=budget, 1=mid, 2=premium):
//   tier 0 → slate  #4b5563 — budget listings
//   tier 1 → black  #111827 — standard (most common)
//   tier 2 → green  #166534 — premium listings
//
// Interaction states always override base color (priority order):
//   active     → WHITE  — currently open, no pulse
//   visited    → MUTED  — seen before, no pulse (before highlighted to fix the green bug)
//   highlighted→ BRIGHT GREEN — sidebar hover, sonar pulse
//   default    → base tier color + sonar pulse

// Зелёный (#066F36) зарезервирован ТОЛЬКО для highlighted (ховер из сайдбара).
// Тиры используют белый / чёрный / тёмно-синий — чтобы не путать с ховером.
// Базовых цветов два: белый (бюджет) и чёрный (всё остальное).
// Зелёный — только highlighted (hover из сайдбара).
const TIER_COLORS: Array<{ bg: string; text: string; pulse: string; shadow: string }> = [
  { bg: '#ffffff', text: '#374151', pulse: 'rgba(74,222,128,0.58)', shadow: '0 2px 10px rgba(0,0,0,0.15)' },
  { bg: '#111827', text: '#ffffff', pulse: 'rgba(74,222,128,0.62)', shadow: '0 2px 12px rgba(0,0,0,0.28)' },
  { bg: '#111827', text: '#ffffff', pulse: 'rgba(74,222,128,0.62)', shadow: '0 2px 12px rgba(0,0,0,0.28)' },
];

function makeMarkerHtml(priceLabel: string, highlighted: boolean, active: boolean, visited = false, zoom = 12, tier = 1, isBusiness = false): string {
  const isDot = zoom < 10;

  let bg: string, textColor: string, shadow: string, pulseColor: string;
  let hasPulse = false;

  if (active) {
    bg = '#ffffff'; textColor = '#111827';
    shadow = '0 3px 18px rgba(0,0,0,0.20), 0 1px 6px rgba(0,0,0,0.10)';
    pulseColor = '';
  } else if (visited) {
    // visited MUST come before highlighted to prevent the green bug
    bg = '#e4e4e7'; textColor = '#71717a';
    shadow = '0 0 0 2px #a1a1aa, 0 2px 8px rgba(0,0,0,0.12)';
    pulseColor = '';
  } else if (highlighted) {
    bg = '#066F36'; textColor = '#ffffff';
    shadow = '0 3px 14px rgba(6,111,54,0.45)';
    pulseColor = 'rgba(74,222,128,0.70)';
    hasPulse = true;
  } else {
    // Unvisited: use price-tier base color
    const t = TIER_COLORS[tier] ?? TIER_COLORS[1];
    bg = t.bg; textColor = t.text; shadow = t.shadow;
    pulseColor = t.pulse;
    hasPulse = true;
  }

  if (isDot) {
    let coreBg: string, ringBg: string;
    if (active) {
      coreBg = '#ffffff'; ringBg = '';
    } else if (visited) {
      coreBg = '#a1a1aa'; ringBg = 'rgba(113,113,122,0.25)';
    } else if (highlighted) {
      coreBg = '#066F36'; ringBg = 'rgba(6,111,54,0.45)';
    } else if (isBusiness) {
      // Бизнес-объявление — оранжевая точка (дизайн-система)
      coreBg = '#F59E0B'; ringBg = 'rgba(245,158,11,0.30)';
    } else {
      coreBg = '#111827'; ringBg = 'rgba(17,24,39,0.20)';
    }
    const ring = ringBg
      ? `<div style="position:absolute;left:50%;top:50%;width:28px;height:28px;border-radius:50%;background:${ringBg};animation:dot-pulse 2.2s ease-out infinite;pointer-events:none;"></div>`
      : '';
    return `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;overflow:visible;">
      ${ring}
      <div style="position:relative;z-index:1;width:16px;height:16px;border-radius:50%;background:${coreBg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);flex-shrink:0;"></div>
    </div>`;
  }

  const rawLabel = zoom < 12 ? priceLabel.replace(' млн ₸', 'м').replace(' тыс ₸', 'к') : priceLabel;
  const fontSize = zoom < 12 ? '10.5px' : '11.5px';
  const scale    = active || highlighted ? 'scale(1.08)' : 'scale(1)';
  const pulse = hasPulse
    ? `<span style="position:absolute;inset:0;border-radius:20px;background:${pulseColor};animation:sonarPulse 3.5s ease-in-out infinite;pointer-events:none;transform-origin:center;"></span>`
    : '';

  if (highlighted) {
    const starSize = zoom < 12 ? 16 : 20;
    const starSvg = `<svg width="${Math.round(starSize*0.5)}" height="${Math.round(starSize*0.5)}" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;
    const pad = zoom < 12 ? `3px 8px 3px 3px` : `4px 10px 4px 4px`;
    return `<span style="position:relative;display:inline-flex;align-items:center;transform:${scale};transition:transform 0.15s;">
      ${pulse}
      <span style="position:relative;z-index:1;display:inline-flex;align-items:center;gap:5px;background:#111827;color:#ffffff;border-radius:20px;padding:${pad};font-size:${fontSize};font-weight:800;white-space:nowrap;box-shadow:${shadow};cursor:pointer;font-family:ui-monospace,system-ui,sans-serif;letter-spacing:-0.02em;">
        <span style="width:${starSize}px;height:${starSize}px;border-radius:50%;background:#066F36;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${starSvg}</span>
        ${rawLabel}
      </span>
    </span>`;
  }

  const padding  = zoom < 12 ? '3px 8px'  : '5px 11px';
  return `<span style="position:relative;display:inline-flex;align-items:center;transform:${scale};transition:transform 0.15s;">
    ${pulse}
    <span style="position:relative;z-index:1;display:inline-flex;align-items:center;background:${bg};color:${textColor};border-radius:20px;padding:${padding};font-size:${fontSize};font-weight:800;white-space:nowrap;box-shadow:${shadow};cursor:pointer;font-family:ui-monospace,system-ui,sans-serif;letter-spacing:-0.02em;">${rawLabel}</span>
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
  const mapRef       = useRef<HTMLDivElement>(null);
  const leafletMap   = useRef<LMap | null>(null);
  const markersMap   = useRef<Map<string | number, { marker: LMarker; listing: MapItem; tier: number }>>(new Map());
  const tileRef      = useRef<LTileLayer | null>(null);
  const clusterRef   = useRef<LClusterGroup | null>(null);
  const tiersCacheRef = useRef<Map<string | number, number>>(new Map());
  const heatPaneRef  = useRef<HTMLDivElement | null>(null);

  const [ready,       setReady]      = useState(false);
  const [error,       setError]      = useState(false);
  const [active,      setActive]     = useState<MapItem | null>(null);
  const [imgError,    setImgError]   = useState(false);
  const [pinPoint,    setPinPoint]   = useState<{ x: number; y: number } | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [isMoving,    setIsMoving]   = useState(false);
  const [heatPoints,  setHeatPoints] = useState<{ x: number; y: number; price: number }[]>([]);
  const [mapZoom, setMapZoom] = useState(KZ_ZOOM);
  const mapZoomRef = useRef(KZ_ZOOM);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const initialFitDone = useRef(false);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);

  const showOverlays = statsCount !== undefined || onTileLayerChange !== undefined;

  const POPUP_W = 308;

  // 1. Load Leaflet + cluster plugin
  useEffect(() => {
    loadCss(LEAFLET_CSS);
    loadCss(CLUSTER_CSS);
    loadCss(CLUSTER_CSS_DEFAULT);
    loadScript(LEAFLET_JS)
      .then(() => loadScript(CLUSTER_JS, () => !!(window.L as LeafletStatic & { markerClusterGroup?: unknown })?.markerClusterGroup))
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

    // Вставляем div в overlay-pane (z-index 400) — между тайлами (200) и маркерами (600)
    setTimeout(() => {
      if (!mapRef.current) return;
      const overlayPane = mapRef.current.querySelector('.leaflet-overlay-pane') as HTMLElement | null;
      const hp = document.createElement('div');
      hp.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
      (overlayPane ?? mapRef.current).appendChild(hp);
      heatPaneRef.current = hp;
    }, 0);

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

    // Remove existing cluster group / markers
    // Remove old markers / cluster
    markersMap.current.forEach(({ marker }) => marker.remove());
    markersMap.current.clear();
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.removeLayer(clusterRef.current as any);
      clusterRef.current = null;
    }

    const withCoords = listings.filter(l => l.lat != null && l.lng != null);

    // Tier per listing ID, cached to prevent color flips on zoom/searchAsMove
    // New listings get assigned based on current median; existing ones keep their tier
    const sortedPrices = [...withCoords].map(l => l.price).sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)] ?? 0;
    withCoords.forEach(l => {
      if (!tiersCacheRef.current.has(l.id)) {
        tiersCacheRef.current.set(l.id, l.price >= median ? 1 : 0);
      }
    });
    const getTier = (id: string | number) => tiersCacheRef.current.get(id) ?? 0;

    const zl = mapZoomRef.current;
    const anchorY = zl < 9 ? 12 : zl < 12 ? 16 : 22;

    // Create cluster group if plugin is loaded
    const useCluster = typeof L.markerClusterGroup === 'function';
    const clusterGroup = useCluster ? L.markerClusterGroup!({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 14,  // zoom ≥14 → individual dots (design spec)
      minimumClusterSize: 2,
      iconCreateFunction: (cluster: { getChildCount: () => number }) => {
        const count = cluster.getChildCount();
        // S <100 → 36px green | M 100-500 → 44px green | L >500 → 52px ink-dark
        const isL = count > 500;
        const isM = count >= 100;
        const size = isL ? 52 : isM ? 44 : 36;
        const bg   = isL ? '#021A0E' : '#066F36';
        const pulse = isL ? 'rgba(2,26,14,0.25)' : 'rgba(6,111,54,0.28)';
        const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
        return L.divIcon({
          html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;overflow:visible;">
            <div style="position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;border-radius:50%;background:${pulse};animation:dot-pulse 2.4s ease-out infinite;pointer-events:none;"></div>
            <div style="position:relative;z-index:1;width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 2px 14px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-size:${isL ? 11 : isM ? 12 : 14}px;font-weight:800;font-family:ui-monospace,monospace;">${label}</div>
          </div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    }) : null;

    withCoords.forEach(listing => {
      const priceLabel = formatPrice(listing.price);
      const isHighlighted = highlightedId != null && String(highlightedId) === String(listing.id);
      const isVisited = visitedIds?.has(listing.id) ?? false;
      const tier = getTier(listing.id);
      const isDot = zl < 10;
      const isBiz = listing.listingCategory === 'business';
      const icon = L.divIcon({
        className: '',
        html: isDot
          ? makeMarkerHtml(priceLabel, isHighlighted, false, isVisited, zl, tier, isBiz)
          : `<div style="animation:markerPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;">${makeMarkerHtml(priceLabel, isHighlighted, false, isVisited, zl, tier, isBiz)}</div>`,
        ...(isDot ? { iconSize: [28, 28], iconAnchor: [14, 14] } : { iconAnchor: [0, anchorY] }),
      });

      const marker = L.marker([listing.lat!, listing.lng!], { icon })
        .on('click', (e: LeafletMouseEvent) => {
          setPinPoint(e?.containerPoint ?? null);
          setActive(prev => prev?.id === listing.id ? null : listing);
          setImgError(false);
          onMarkerClick?.(listing);
        });

      if (clusterGroup) {
        clusterGroup.addLayer(marker);
      } else {
        (marker as LMarker & { addTo: (m: LMap) => LMarker }).addTo(map);
      }
      markersMap.current.set(listing.id, { marker, listing, tier });
    });

    if (clusterGroup) {
      clusterGroup.addTo(map);
      clusterRef.current = clusterGroup;
    }

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
    const anchorY = zl < 9 ? 12 : zl < 12 ? 16 : 22;
    markersMap.current.forEach(({ marker, listing, tier }) => {
      const isHighlighted = highlightedId != null && String(highlightedId) === String(listing.id);
      const isActive = active != null && String(active.id) === String(listing.id);
      const isVisited = visitedIds?.has(listing.id) ?? false;
      const priceLabel = formatPrice(listing.price);
      const isDot = zl < 10;
      marker.setIcon(L.divIcon({
        className: '',
        html: isDot
          ? makeMarkerHtml(priceLabel, isHighlighted, isActive, isVisited, zl, tier)
          : `<div style="display:inline-block;transform:translateX(-50%);">${makeMarkerHtml(priceLabel, isHighlighted, isActive, isVisited, zl, tier)}</div>`,
        ...(isDot ? { iconSize: [28, 28], iconAnchor: [14, 14] } : { iconAnchor: [0, anchorY] }),
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
          const p = map.latLngToLayerPoint([l.lat!, l.lng!]);
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
    // heat points only need recompute on zoom (layer coords stable with pan)
    map.on('zoomend', compute);
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);
    return () => {
      map.off('zoomend', compute);
      map.off('moveend', emitBounds);
      map.off('zoomend', emitBounds);
    };
  }, [ready, listings]);

  // 5b. Обновляем тепловую карту в overlay-pane (z:400, между тайлами 200 и маркерами 600)
  useEffect(() => {
    const pane = heatPaneRef.current;
    if (!pane) return;
    if (!showHeatMap || heatPoints.length === 0) { pane.style.background = ''; return; }
    const prices = heatPoints.map(p => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;
    const blobR = Math.max(40, Math.min(140, 520 / Math.pow(2, mapZoom - 5)));
    const pad = blobR * 2;
    const minX = Math.min(...heatPoints.map(p => p.x)) - pad;
    const minY = Math.min(...heatPoints.map(p => p.y)) - pad;
    const maxX = Math.max(...heatPoints.map(p => p.x)) + pad;
    const maxY = Math.max(...heatPoints.map(p => p.y)) + pad;
    pane.style.left   = `${minX}px`;
    pane.style.top    = `${minY}px`;
    pane.style.width  = `${maxX - minX}px`;
    pane.style.height = `${maxY - minY}px`;
    const gradients = heatPoints.map(p => {
      const ratio = (p.price - minP) / range;
      const alpha = (0.12 + ratio * 0.30).toFixed(2);
      const rx = Math.round(blobR * 1.2);
      const ry = Math.round(blobR);
      const gx = Math.round(p.x - minX);
      const gy = Math.round(p.y - minY);
      return `radial-gradient(ellipse ${rx}px ${ry}px at ${gx}px ${gy}px, rgba(52,211,153,${alpha}) 0%, transparent 100%)`;
    });
    pane.style.background = gradients.join(',');
  }, [showHeatMap, heatPoints, mapZoom]);

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
      <div className="flex items-center justify-center h-full text-sm" style={{ background: 'var(--paper-2)', color: 'var(--ink-400)' }}>
        Не удалось загрузить карту. Проверьте интернет.
      </div>
    );
  }

  const LAYERS = [
    { key: 'schema',    label: 'Схема'   },
    { key: 'satellite', label: 'Спутник' },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Loading */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'var(--paper-2)' }}>
          <div className="flex flex-col items-center gap-2" style={{ color: 'var(--ink-300)' }}>
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
            <div className="bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden flex divide-x text-[12px]" style={{ border: '1px solid var(--line)', borderColor: 'var(--line)', boxShadow: 'var(--sh-1)' }}>
              <div className="px-3 py-2" style={{ borderColor: 'var(--line-soft)' }}>
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>видимо</div>
                <div className="font-black tracking-tight text-[15px]" style={{ color: 'var(--ink-900)' }}>
                  {statsCount.toLocaleString('ru-RU')}
                </div>
              </div>
              {(statsMedian ?? 0) > 0 && (
                <div className="px-3 py-2" style={{ borderColor: 'var(--line-soft)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>медиана</div>
                  <div className="font-black tracking-tight text-[15px]" style={{ color: 'var(--ink-900)' }}>
                    {fmtM(statsMedian!)} млн
                  </div>
                </div>
              )}
              {(statsPerSotka ?? 0) > 0 && (
                <div className="px-3 py-2" style={{ borderColor: 'var(--line-soft)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>за сотку</div>
                  <div className="font-black tracking-tight text-[15px] text-primary">
                    {fmtM(statsPerSotka!)} млн
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search-as-move toggle */}
          {onSearchAsMoveChange && (
            <label className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer text-[12px] font-medium select-none" style={{ border: '1px solid var(--line)', boxShadow: 'var(--sh-1)', color: 'var(--ink-700)' }}>
              <span className={`relative flex-shrink-0 w-8 h-4 rounded-full transition-colors duration-200 ${searchAsMove ? 'bg-primary' : ''}`} style={searchAsMove ? {} : { background: 'var(--ink-200)' }}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${searchAsMove ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
              Искать при движении
              <input type="checkbox" className="sr-only" checked={!!searchAsMove} onChange={e => onSearchAsMoveChange(e.target.checked)} />
            </label>
          )}
        </div>
      )}

      {/* TOP-RIGHT: zoom controls */}
      {showOverlays && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end" style={{ zIndex: 800 }}>
          {/* Zoom controls */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-1 flex flex-col" style={{ border: '1px solid var(--line)', boxShadow: 'var(--sh-1)' }}>
            <button
              onClick={() => leafletMap.current?.zoomIn()}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-colors hover:bg-[var(--paper-2)]"
              style={{ color: 'var(--ink-700)' }}
            >+</button>
            <span className="h-px mx-1.5" style={{ background: 'var(--line-soft)' }} />
            <button
              onClick={() => leafletMap.current?.zoomOut()}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-colors hover:bg-[var(--paper-2)]"
              style={{ color: 'var(--ink-700)' }}
            >−</button>
            <span className="h-px mx-1.5" style={{ background: 'var(--line-soft)' }} />
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--paper-2)]"
              style={{ color: 'var(--ink-500)' }}
              title="Моё местоположение"
              onClick={() => {
                if (!navigator.geolocation || !leafletMap.current) return;
                navigator.geolocation.getCurrentPosition(
                  (pos) => leafletMap.current?.setView([pos.coords.latitude, pos.coords.longitude], 13),
                  () => {}
                );
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* HEAT MAP — плотность + цена в видимом окне */}
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
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-1.5 text-[12px] font-semibold text-primary flex items-center gap-2" style={{ border: '1px solid var(--line)', boxShadow: 'var(--sh-2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Поиск…
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: Layer tabs */}
      {showOverlays && onTileLayerChange && (
        <div className="absolute left-4 flex flex-col gap-2 items-start" style={{ zIndex: 800, bottom: compareList && compareList.length > 0 ? '76px' : '16px' }}>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-1 flex gap-px text-[12px] font-medium" style={{ border: '1px solid var(--line)', boxShadow: 'var(--sh-1)' }}>
            {LAYERS.map(layer => (
              <button
                key={layer.key}
                onClick={() => onTileLayerChange(layer.key)}
                className="px-3 h-7 rounded-lg transition-colors"
                style={tileLayer === layer.key
                  ? { background: 'var(--ink-900)', color: '#fff' }
                  : { color: 'var(--ink-500)' }
                }
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: Compare strip */}
      {compareList && compareList.length > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white rounded-2xl p-3" style={{ zIndex: 900, border: '1px solid var(--line)', boxShadow: 'var(--sh-3)' }}>
          <div className="shrink-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ink-400)' }}>Сравнение</div>
            <div className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--ink-900)' }}>{compareList.length} <span className="font-normal" style={{ color: 'var(--ink-400)' }}>из 4</span></div>
          </div>
          <span className="w-px h-10 shrink-0" style={{ background: 'var(--line-soft)' }} />
          <div className="flex items-center gap-2">
            {compareList.map(item => (
              <div key={item.id} className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-primary/70 ring-offset-1 shrink-0" style={{ background: 'var(--paper-2)' }}>
                {item.image
                  ? <img src={item.image} className="w-full h-full object-cover" alt="" loading="lazy" />
                  : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--paper-2), var(--paper-3))' }} />
                }
                <button
                  onClick={() => onRemoveCompare?.(item.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] leading-none flex items-center justify-center hover:bg-black/90 transition-colors"
                  style={{ zIndex: 1 }}
                >×</button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-2 pb-0.5 px-0.5">
                  <span className="block text-white text-[9px] font-bold text-center tabular-nums">
                    {fmtM(item.price)}м
                  </span>
                </div>
              </div>
            ))}
            {compareList.length < 4 && (
              <div className="w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl shrink-0" style={{ borderColor: 'var(--line)', color: 'var(--ink-300)' }}>+</div>
            )}
          </div>
          <span className="w-px h-10 shrink-0" style={{ background: 'var(--line-soft)' }} />
          <button
            onClick={onCompare}
            className="h-10 px-5 rounded-xl bg-primary text-white text-[12.5px] font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            Сравнить <span className="opacity-70">→</span>
          </button>
        </div>
      )}

      {/* BOTTOM-RIGHT: Analytics card (hidden when active pin popup is shown) */}
      {!active && showOverlays && (statsPerSotka ?? 0) > 0 && (
        <div className="absolute bottom-4 right-4 w-[260px]" style={{ zIndex: 900 }}>
          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid var(--line)', boxShadow: 'var(--sh-2)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>в окне карты</div>
              <Link href="/analytics" className="text-[10.5px] font-mono text-primary font-bold hover:underline">Аналитика →</Link>
            </div>
            <div className="font-black tracking-tight text-[26px] leading-none" style={{ color: 'var(--ink-900)' }}>
              {fmtM(statsPerSotka!)} млн ₸
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-400)' }}>средняя цена за сотку</div>
            <div className="mt-4 flex items-end gap-1 h-12">
              {[30, 42, 38, 55, 48, 62, 70, 78, 88, 100].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${i >= 8 ? 'bg-primary' : ''}`}
                  style={{ height: `${h}%`, background: i >= 8 ? undefined : i >= 5 ? 'var(--ink-200)' : 'var(--paper-3)' }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px]" style={{ color: 'var(--ink-400)' }}>
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

function relDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'сегодня';
  if (d === 1) return 'вчера';
  if (d < 7)  return `${d} дн`;
  if (d < 30) return `${Math.floor(d / 7)} нед`;
  return `${Math.floor(d / 30)} мес`;
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
  const mapW = mapRef.current?.offsetWidth  ?? 800;
  const mapH = mapRef.current?.offsetHeight ?? 600;
  const POPUP_H = 340;
  const GAP = 20;

  const px = pinPoint?.x ?? mapW / 2;
  const py = pinPoint?.y ?? mapH / 2;

  // Position: starts 16px to the right of the pin center, above the pin
  let left = px + 16;
  // Clamp so card doesn't overflow right edge
  if (left + popupW > mapW - 8) left = px - popupW - 16;
  left = Math.max(8, left);

  const showBelow = py < POPUP_H + GAP + 40;
  const topPx = showBelow ? py + GAP : py - GAP;
  const transformY = showBelow ? '0%' : '-100%';

  const typeLabel = active.purpose || active.landType || '';
  const perSotka = active.area && active.area > 0 ? Math.round(active.price / active.area) : 0;

  // Если заголовок — хлебные крошки (дублирует локацию) — строим читаемый из данных
  const cityName = active.location.split(',')[0].trim();
  const looksLikeBreadcrumb = cityName && active.title.toLowerCase().includes(cityName.toLowerCase());
  const displayTitle = looksLikeBreadcrumb
    ? `Участок${active.area ? ` ${active.area} сот` : ''}${cityName ? ` в ${cityName}` : ''}`
    : active.title;

  // 3 чипа внизу карточки
  const statCols: Array<{ label: string; value: string; accent?: boolean }> = [];
  if (typeLabel) statCols.push({ label: 'Назначение', value: typeLabel });
  if (active.area && active.area > 0) statCols.push({ label: 'Площадь', value: `${active.area} сот` });
  if (active.hasStateAct !== undefined) statCols.push({ label: 'Кадастр', value: active.hasStateAct ? 'проверен' : 'нет акта', accent: active.hasStateAct });
  // добиваем до 3 коммуникациями если нужно
  if (statCols.length < 3) {
    const comms = [active.hasElectricity && 'Свет', active.hasGas && 'Газ', active.hasWater && 'Вода', active.hasRoadAccess && 'Дорога'].filter(Boolean) as string[];
    if (comms.length) statCols.push({ label: 'Коммуникации', value: comms.join(', ') });
  }
  const stats = statCols.slice(0, 3);

  return (
    <div style={{ zIndex: 900, position: 'absolute', left, top: topPx, width: popupW, transform: `translateY(${transformY})` }}>
      <div className="bg-white overflow-hidden" style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', boxShadow: 'var(--sh-3)' }}>
        {/* Image */}
        <div className="relative h-[120px]" style={{ background: 'var(--paper-2)' }}>
          {active.image && !imgError ? (
            <img src={active.image} alt={active.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full plot-img" />
          )}
          <button
            onClick={() => { setActive(null); setPinPoint(null); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Тип · локация */}
          <p className="text-[10.5px] font-medium uppercase tracking-wider truncate" style={{ color: 'var(--ink-400)' }}>
            {[typeLabel, active.location].filter(Boolean).join(' · ')}
          </p>

          {/* Заголовок */}
          <h4 className="mt-0.5 font-semibold text-[14.5px] leading-snug line-clamp-2" style={{ color: 'var(--ink-900)' }}>{displayTitle}</h4>

          {/* Цена + кнопка */}
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div>
              <div className="font-black tracking-tight text-[19px] leading-none tabular-nums" style={{ color: 'var(--ink-900)' }}>
                {formatPrice(active.price)}
              </div>
              {perSotka > 0 && (
                <div className="mt-0.5 text-[10.5px] font-mono tabular-nums" style={{ color: 'var(--ink-400)' }}>
                  {formatPrice(perSotka)} / сотка
                </div>
              )}
            </div>
            <Link
              href={listingUrl(active)}
              className="shrink-0 h-8 px-3.5 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors hover:opacity-90"
              style={{ borderRadius: 'var(--r-md)', background: 'var(--ink-900)' }}
            >
              Открыть →
            </Link>
          </div>

          {/* 3 стата */}
          {stats.length > 0 && (
            <div className="mt-3 pt-2.5 grid gap-x-2" style={{ borderTop: '1px solid var(--line-soft)', gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'var(--ink-400)' }}>{s.label}</div>
                  <div className="text-[12px] font-bold tabular-nums leading-tight" style={{ color: s.accent ? 'var(--brand)' : 'var(--ink-700)' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
