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
const MAPLIBRE_VERSION = '4.7.1';
const MAPLIBRE_LEAFLET_VERSION = '0.1.3';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const CLUSTER_CSS = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/MarkerCluster.css`;
const CLUSTER_JS = `https://unpkg.com/leaflet.markercluster@${CLUSTER_VERSION}/dist/leaflet.markercluster.js`;
const MAPLIBRE_CSS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
const MAPLIBRE_JS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_LEAFLET_JS = `https://unpkg.com/@maplibre/maplibre-gl-leaflet@${MAPLIBRE_LEAFLET_VERSION}/leaflet-maplibre-gl.js`;
// Векторный стиль «Схемы» — OpenFreeMap (бесплатно, без ключа и лимитов, можно в прод)
const OFM_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const TILES: Record<'scheme' | 'sat', { url: string; attribution: string; subdomains?: string; maxZoom?: number }> = {
  // Растровый fallback «Схемы» (если MapLibre/WebGL недоступен) — стандартные тайлы OSM.
  // Основная «Схема» — векторная (OpenFreeMap liberty + name:ru), см. getOfmStyle().
  scheme: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors', maxZoom: 19 },
  sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '© Esri' },
};

/** Палитра под 2GIS: тёплый светло-серый фон, жёлтые магистрали, мягкие вода/зелень.
 *  Ключ — исходный цвет в liberty, значение — наш (swap по значению устойчивее, чем по id). */
const OFM_COLOR_SWAP: Record<string, string> = {
  '#f8f4f0': '#f1efe9',                       // фон суши
  'rgb(158,189,255)': '#a6d1e8',              // вода
  '#a0c8f0': '#a6d1e8',                       // реки/ручьи
  '#d8e8c8': '#cfe8b0',                       // парки
  'rgba(176, 213, 154, 1)': '#c9e6ab',        // трава
  'hsla(98,61%,72%,0.7)': 'rgba(185,221,160,0.75)', // лес
  'hsl(35,8%,85%)': '#e5dfd2',                // здания
  '#fc8': '#ffd95e',                          // магистрали
  '#ffdaa6': '#ffe58a',                       // магистрали в тоннелях
  '#fea': '#ffeb99',                          // trunk/primary/secondary
  '#e9ac77': '#dfc26e',                       // оранжевые обводки дорог → жёлто-серые
  '#cfcdca': '#d8d4cb',                       // обводки мелких улиц
};

// зум появления названий улиц (раньше, чем в liberty — как у 2GIS/Krisha)
const STREET_NAME_MINZOOM: Record<string, number> = {
  'highway-name-major': 10,   // было 12.2
  'highway-name-minor': 12,   // было 15
  'highway-name-path': 13.5,  // было 15.5
};

/** Стиль OFM с правками: подписи по-русски (name:ru), улицы раньше, цвета 2GIS */
let ofmStyleCache: Promise<unknown> | null = null;
function getOfmStyle(): Promise<any> {
  if (!ofmStyleCache) {
    ofmStyleCache = fetch(OFM_STYLE_URL)
      .then(r => { if (!r.ok) throw new Error('style fetch failed'); return r.json(); })
      .then((style: any) => {
        // выпилить бледный растровый рельеф natural_earth (z<6) — плоский фон чище, как у 2GIS
        style.layers = (style.layers as any[]).filter(l => l.source !== 'ne2_shaded');
        for (const layer of style.layers ?? []) {
          const tf = layer.layout?.['text-field'];
          // подписи-названия → русский с фолбэком на местное имя (ref/номера домов не трогаем)
          if (tf && JSON.stringify(tf).includes('name')) {
            layer.layout['text-field'] = ['coalesce', ['get', 'name:ru'], ['get', 'name']];
          }
          if (layer.id in STREET_NAME_MINZOOM) layer.minzoom = STREET_NAME_MINZOOM[layer.id];
          // главные улицы: крупнее и контрастнее на городских зумах (в liberty 12px и #666 — терялись)
          if (layer.id === 'highway-name-major') {
            layer.layout['text-size'] = ['interpolate', ['linear'], ['zoom'], 10, 11, 13, 13, 16, 15];
            layer.paint = { ...layer.paint, 'text-color': '#3f3f46', 'text-halo-width': 1.5 };
          }
          // перекраска под 2GIS
          const paint = layer.paint;
          if (paint) {
            for (const key of ['background-color', 'fill-color', 'line-color']) {
              const c = paint[key];
              if (typeof c === 'string' && OFM_COLOR_SWAP[c]) paint[key] = OFM_COLOR_SWAP[c];
            }
          }
        }
        return style;
      });
    ofmStyleCache.catch(() => { ofmStyleCache = null; }); // ошибку не кэшируем
  }
  return ofmStyleCache as Promise<any>;
}

/** Только подписи (города/улицы/вода) — накладываются поверх спутника (гибрид) */
const LABEL_SOURCE_LAYERS = new Set(['place', 'transportation_name', 'water_name', 'aerodrome_label']);
function getOfmLabelsStyle(): Promise<any> {
  return getOfmStyle().then((style: any) => ({
    ...style,
    layers: (style.layers as any[])
      .filter(l => l.type === 'symbol' && LABEL_SOURCE_LAYERS.has(l['source-layer']))
      // на снимках читается только белый текст с тёмным гало (как у гибридов Яндекс/2GIS)
      .map(l => ({
        ...l,
        paint: { ...l.paint, 'text-color': '#ffffff', 'text-halo-color': 'rgba(0,0,0,0.78)', 'text-halo-width': 1.4, 'text-halo-blur': 0.4 },
      })),
  }));
}

function rasterSchemeLayer(Lf: L) {
  return Lf.tileLayer(TILES.scheme.url, { attribution: TILES.scheme.attribution, subdomains: TILES.scheme.subdomains ?? 'abc', maxZoom: TILES.scheme.maxZoom ?? 19 });
}

/** GL-слой нельзя добавлять во время зум-анимации Leaflet — у плагина ещё нет _glMap
 *  и его обработчики зума падают (jumpTo undefined). Ждём zoomend. */
function whenMapIdle(map: L, fn: () => void) {
  if (map._animatingZoom) map.once('zoomend', fn);
  else fn();
}

/** Без WebGL конструктор maplibregl.Map бросает исключение ВНУТРИ addTo — Leaflet
 *  к этому моменту уже привязал обработчики зума слоя, и они «зомби» ломают карту. */
let webglOk: boolean | null = null;
function webglAvailable(): boolean {
  if (webglOk === null) {
    try {
      const c = document.createElement('canvas');
      webglOk = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch { webglOk = false; }
  }
  return webglOk;
}

/** addTo с зачисткой: если GL-слой упал при добавлении — снять его обработчики с карты */
function tryAddGl(Lf: L, map: L, style: unknown): L | null {
  const gl = Lf.maplibreGL({ style });
  try {
    gl.addTo(map);
    return gl;
  } catch {
    try { map.removeLayer(gl); } catch { /* onRemove тоже падает без _glMap */ }
    try { map.off(gl.getEvents(), gl); } catch { /* страховка от зомби-обработчиков */ }
    return null;
  }
}

/** Монтирует «Схему»: векторную (GL), при любой ошибке — растровый OSM.
 *  stale() проверяется перед каждым асинхронным шагом: слой не попадёт
 *  на размонтированную карту (StrictMode) или после переключения на спутник. */
function mountSchemeLayer(Lf: L, map: L, stale: () => boolean, setRef: (layer: L) => void) {
  const mountRaster = () => { const r = rasterSchemeLayer(Lf).addTo(map); setRef(r); };
  if (!Lf.maplibreGL || !webglAvailable()) { mountRaster(); return; }
  getOfmStyle()
    .then(style => {
      if (stale()) return;
      whenMapIdle(map, () => {
        if (stale()) return;
        const gl = tryAddGl(Lf, map, style);
        if (gl) setRef(gl); else mountRaster();
      });
    })
    .catch(() => { if (!stale()) mountRaster(); });
}

// стартовый вид — вся страна (пользователь сам приближается к нужному месту)
const KZ_CENTER: [number, number] = [48.0, 67.5];
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
  const layerModeRef = useRef<'scheme' | 'sat'>('scheme');
  const labelsRef = useRef<L>(null); // GL-подписи поверх спутника (гибрид)
  const [ready, setReady] = useState(false);

  const cbRef = useRef({ onPinHover, onPinClick, onMapClick, onViewportChange });
  useEffect(() => {
    cbRef.current = { onPinHover, onPinClick, onMapClick, onViewportChange };
  });

  // ── загрузка Leaflet ──
  useEffect(() => {
    let cancelled = false;
    loadCss(LEAFLET_CSS); loadCss(CLUSTER_CSS); loadCss(MAPLIBRE_CSS);
    loadScript(LEAFLET_JS, () => !!(window as any).L)
      .then(() => loadScript(CLUSTER_JS, () => !!(window as any).L?.markerClusterGroup))
      // MapLibre (векторная схема) не критичен: не загрузился — работаем на растровом OSM
      .then(() => loadScript(MAPLIBRE_JS, () => !!(window as any).maplibregl)
        .then(() => loadScript(MAPLIBRE_LEAFLET_JS, () => !!(window as any).L?.maplibreGL))
        .catch(() => { /* fallback на растр */ }))
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { /* карта не критична — список работает без неё */ });
    return () => { cancelled = true; };
  }, []);

  // ── инициализация ──
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const Lf = (window as any).L;
    if (!Lf || (containerRef.current as any)._leaflet_id) return;
    // attributionControl: false — по требованию заказчика подпись скрыта.
    // ВНИМАНИЕ: атрибуция «© OpenStreetMap contributors» — условие бесплатного
    // использования тайлов OSM; перед продом желательно вернуть (true).
    let disposed = false;
    const map = Lf.map(containerRef.current, { zoomControl: false, attributionControl: false, maxZoom: 19 });
    map.setView(KZ_CENTER, KZ_ZOOM);
    mountSchemeLayer(Lf, map, () => disposed || layerModeRef.current !== 'scheme', layer => { tileRef.current = layer; });

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
    return () => { disposed = true; map.remove(); mapRef.current = null; labelsRef.current = null; markers.clear(); fitted.current = false; };
  }, [ready]);

  // ── маркеры ──
  useEffect(() => {
    const map = mapRef.current, cluster = clusterRef.current;
    const Lf = (window as any).L;
    if (!map || !cluster || !Lf) return;
    cluster.clearLayers();
    markersRef.current.clear();

    for (const it of items) {
      const marker = Lf.marker([it.lat, it.lng], { icon: pinIcon(Lf, it, false) });
      // только клик по пину открывает карточку; hover по пину не трогаем — при смене
      // иконки Leaflet заменяет DOM-элемент и mouseout теряется (карточка «залипала»)
      marker.on('click', (e: any) => { e.originalEvent?.stopPropagation?.(); cbRef.current.onPinClick?.(it.id); });
      markersRef.current.set(it.id, marker);
      cluster.addLayer(marker);
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
      if (!Lf || !map || layerModeRef.current === layer) return;
      layerModeRef.current = layer;
      tileRef.current?.remove();
      tileRef.current = null;
      labelsRef.current?.remove();
      labelsRef.current = null;
      if (layer === 'sat') {
        tileRef.current = Lf.tileLayer(TILES.sat.url, { attribution: TILES.sat.attribution, maxZoom: TILES.sat.maxZoom ?? 19 }).addTo(map);
        // гибрид: русские подписи (города/улицы) поверх снимков
        if (Lf.maplibreGL && webglAvailable()) {
          const stale = () => mapRef.current !== map || layerModeRef.current !== 'sat';
          getOfmLabelsStyle().then(style => {
            if (stale()) return;
            whenMapIdle(map, () => {
              if (stale()) return;
              labelsRef.current = tryAddGl(Lf, map, style); // null — просто снимки без подписей
            });
          }).catch(() => { /* без подписей — просто снимки */ });
        }
      } else {
        mountSchemeLayer(Lf, map, () => mapRef.current !== map || layerModeRef.current !== 'scheme', l => { tileRef.current = l; });
      }
      // CSS-тюнинг цвета — только для растрового OSM-fallback, спутник/вектор без фильтра
      containerRef.current?.classList.toggle('is-sat', layer === 'sat');
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
