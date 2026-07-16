'use client';

/**
 * Карта нового каталога (макет «Каталог участков»):
 * пины-пилюли с ценой (белые → чёрные при hover/active, featured — зелёная ★),
 * кластеры-круги (зелёные, тёмные для крупных), реальные тайлы OSM/Esri.
 * Leaflet грузится с CDN — без API-ключей и оплаты.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fmtPrice, hashId } from '@/app/(site)/catalog/catalog-utils';

const LEAFLET_VERSION = '1.9.4';
const CLUSTER_VERSION = '1.5.3';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const CLUSTER_CSS = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.css`;
const CLUSTER_JS = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/leaflet.markercluster.js`;

export const TILES: Record<'scheme' | 'sat', { url: string; attribution: string; subdomains?: string }> = {
  // Светлая «Схема» — CartoDB Positron (бесплатно, без ключа): приглушённая гамма как в макете
  scheme: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd' },
  sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
};

const KZ_CENTER: [number, number] = [45.5, 71.0];
const KZ_ZOOM = 5;

/* eslint-disable @typescript-eslint/no-explicit-any */
type L = any;

function loadScript(src: string, ready: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ready()) { resolve(); return; }
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

export interface MapPinItem {
  id: string;
  lat: number;
  lng: number;
  price: number;
  featured?: boolean;
  viewed?: boolean;
  boundary?: [number, number][] | null;
}

export interface CatalogMapApi {
  zoomIn(): void;
  zoomOut(): void;
  zoomOutFar(): void;
  locate(): void;
  setLayer(layer: 'scheme' | 'sat'): void;
  /** экранная позиция пина внутри контейнера карты */
  pinPoint(id: string): { x: number; y: number } | null;
  fitAll(): void;
  invalidate(): void;
}

export interface CatalogMapProps {
  items: MapPinItem[];
  activeId?: string | null;
  /** ↔ hover из списка */
  hoverId?: string | null;
  onPinHover?(id: string | null): void;
  onPinClick?(id: string): void;
  /** клик по пустому месту карты (не по пину) — например, закрыть карточку */
  onMapClick?(): void;
  /** id объявлений в текущем окне карты; moved=true если юзер двигал карту */
  onViewportChange?(visibleIds: string[], moved: boolean): void;
  apiRef?: React.RefObject<CatalogMapApi | null>;
  className?: string;
}

export function CatalogMap({ items, activeId, hoverId, onPinHover, onPinClick, onMapClick, onViewportChange, apiRef, className }: CatalogMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L>(null);
  const tileRef = useRef<L>(null);
  const clusterRef = useRef<L>(null);
  const markersRef = useRef<Map<string, L>>(new Map());
  const polygonRef = useRef<L>(null);
  const movedByUser = useRef(false);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);

  const cbRef = useRef({ onPinHover, onPinClick, onMapClick, onViewportChange });
  useEffect(() => {
    cbRef.current = { onPinHover, onPinClick, onMapClick, onViewportChange };
  });

  // ── загрузка Leaflet ──
  useEffect(() => {
    let cancelled = false;
    loadCss(LEAFLET_CSS); loadCss(CLUSTER_CSS);
    loadScript(LEAFLET_JS, () => !!(window as any).L)
      .then(() => loadScript(CLUSTER_JS, () => !!(window as any).L?.markerClusterGroup))
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { /* карта не критична — список работает без неё */ });
    return () => { cancelled = true; };
  }, []);

  // ── инициализация ──
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const Lf = (window as any).L;
    if (!Lf || (containerRef.current as any)._leaflet_id) return;
    const map = Lf.map(containerRef.current, { zoomControl: false, attributionControl: true });
    map.setView(KZ_CENTER, KZ_ZOOM);
    tileRef.current = Lf.tileLayer(TILES.scheme.url, { attribution: TILES.scheme.attribution, subdomains: TILES.scheme.subdomains ?? 'abc', maxZoom: 19 }).addTo(map);

    const cluster = Lf.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      iconCreateFunction: (c: L) => {
        const n = c.getChildCount();
        const size = n > 500 ? 58 : n > 100 ? 52 : n > 20 ? 46 : 40;
        const fs = size > 50 ? 15 : size > 44 ? 14 : 12;
        return Lf.divIcon({
          className: 'ccluster',
          html: `<span class="cpin-pulse"></span><span class="cluster ${n > 500 ? 'dark' : ''}" style="font-size:${fs}px">${n}</span>`,
          iconSize: [size, size],
        });
      },
    });
    cluster.addTo(map);
    clusterRef.current = cluster;

    const report = () => {
      const b = map.getBounds();
      const ids: string[] = [];
      markersRef.current.forEach((m, id) => { if (b.contains(m.getLatLng())) ids.push(id); });
      cbRef.current.onViewportChange?.(ids, movedByUser.current);
    };
    map.on('movestart', () => { movedByUser.current = true; });
    map.on('moveend', report);
    map.on('zoomend', report);
    map.on('click', () => cbRef.current.onMapClick?.());

    mapRef.current = map;
    const markers = markersRef.current;
    return () => { map.remove(); mapRef.current = null; markers.clear(); fitted.current = false; };
  }, [ready]);

  // ── маркеры ──
  useEffect(() => {
    const map = mapRef.current, cluster = clusterRef.current;
    const Lf = (window as any).L;
    if (!map || !cluster || !Lf) return;
    cluster.clearLayers();
    markersRef.current.clear();

    const pts: [number, number][] = [];
    for (const it of items) {
      pts.push([it.lat, it.lng]);
      const marker = Lf.marker([it.lat, it.lng], { icon: pinIcon(Lf, it, false) });
      marker.on('click', (e: any) => { e.originalEvent?.stopPropagation?.(); cbRef.current.onPinClick?.(it.id); });
      marker.on('mouseover', () => cbRef.current.onPinHover?.(it.id));
      marker.on('mouseout', () => cbRef.current.onPinHover?.(null));
      markersRef.current.set(it.id, marker);
      cluster.addLayer(marker);
    }
    if (!fitted.current && pts.length) {
      const bounds = Lf.latLngBounds(pts);
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13 });
      fitted.current = true;
      movedByUser.current = false;
    }
    // сразу отчитаться о видимых
    const b = map.getBounds();
    const ids: string[] = [];
    markersRef.current.forEach((m, id) => { if (b.contains(m.getLatLng())) ids.push(id); });
    cbRef.current.onViewportChange?.(ids, false);
  }, [items, ready]);

  // ── активный/hover пин + полигон ──
  useEffect(() => {
    const Lf = (window as any).L;
    const map = mapRef.current;
    if (!map || !Lf) return;
    markersRef.current.forEach((m, id) => {
      const it = items.find(x => x.id === id);
      if (!it) return;
      m.setIcon(pinIcon(Lf, it, id === activeId || id === hoverId));
    });
    // полигон выделенного участка
    polygonRef.current?.remove();
    polygonRef.current = null;
    const sel = items.find(x => x.id === (activeId ?? hoverId));
    if (sel?.boundary?.length) {
      polygonRef.current = Lf.polygon(sel.boundary, {
        className: 'plot-polygon',
        color: '#066F36', weight: 1.5, dashArray: '4 3', fillColor: '#066F36', fillOpacity: 0.18,
      }).addTo(map);
    }
  }, [activeId, hoverId, items]);

  // ── imperative API ──
  const buildApi = useCallback((): CatalogMapApi => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    zoomOutFar: () => { const m = mapRef.current; if (m) m.setZoom(Math.max(4, m.getZoom() - 2)); },
    locate: () => {
      navigator.geolocation?.getCurrentPosition(
        p => mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 12),
        () => { /* отказ — молча игнорируем */ },
      );
    },
    setLayer: (layer) => {
      const Lf = (window as any).L, map = mapRef.current;
      if (!Lf || !map) return;
      tileRef.current?.remove();
      tileRef.current = Lf.tileLayer(TILES[layer].url, { attribution: TILES[layer].attribution, subdomains: TILES[layer].subdomains ?? 'abc', maxZoom: 19 }).addTo(map);
    },
    pinPoint: (id) => {
      const map = mapRef.current, m = markersRef.current.get(id);
      if (!map || !m) return null;
      const ll = m.getLatLng();
      const p = map.latLngToContainerPoint([ll.lat, ll.lng]);
      return { x: p.x, y: p.y };
    },
    fitAll: () => {
      const Lf = (window as any).L, map = mapRef.current;
      if (!Lf || !map || !items.length) return;
      const bounds = Lf.latLngBounds(items.map(i => [i.lat, i.lng]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13 });
      movedByUser.current = false;
    },
    invalidate: () => mapRef.current?.invalidateSize(),
  }), [items]);

  useEffect(() => {
    if (apiRef) apiRef.current = buildApi();
  }, [apiRef, buildApi, ready]);

  return (
    <div ref={containerRef} className={`catalog-map relative z-0 isolate w-full h-full ${className ?? ''}`}>
      {!ready && (
        <div className="w-full h-full flex items-center justify-center bg-[#e6ede7]">
          <span className="text-[12px] font-mono text-zinc-500">Загружаем карту…</span>
        </div>
      )}
    </div>
  );
}

function pinIcon(Lf: L, it: MapPinItem, active: boolean) {
  // активный (кликнутый/наведённый) пин — тёмная пилюля, зелёная звезда, пульс,
  // ровно как в макете. Остальные — белые пилюли с ценой.
  const label = fmtPrice(it.price);
  const w = Math.max(72, label.length * 7.2 + 20 + (active ? 26 : 0));
  return Lf.divIcon({
    className: `cpin ${active ? 'is-active' : ''} ${it.viewed && !active ? 'is-viewed' : ''}`,
    html: `${active ? '<span class="cpin-pulse"></span>' : ''}<span class="pin-price"><span class="star">★</span>${label}</span>`,
    iconSize: [w, active ? 34 : 28],
    iconAnchor: [w / 2, active ? 17 : 14],
  });
}

/** стабильный псевдослучайный сдвиг для объявлений без координат — чтобы не падать в одну точку */
export function jitterLatLng(id: string, base: [number, number]): [number, number] {
  const h = hashId(id);
  return [base[0] + ((h % 200) - 100) / 250, base[1] + (((h >> 8) % 200) - 100) / 180];
}
