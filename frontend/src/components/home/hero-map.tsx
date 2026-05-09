'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Dot {
  lat: number;
  lng: number;
  slug?: string;
  title?: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
  image?: string | null;
}

interface Selected {
  slug: string;
  title: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
  image?: string | null;
  isPremium: boolean;
  isViewed: boolean;
}

const LEAFLET_CSS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const CLUSTER_CSS1 = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
const CLUSTER_CSS2 = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
const CLUSTER_JS   = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
const KZ_CENTER: [number, number] = [48.0, 68.0];
const PRICE_ZOOM = 10;
const LS_KEY = '6sotok_viewed';

const TILE_URLS: Record<string, string> = {
  schema:    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  cadastre:  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

function loadScript(src: string): Promise<void> {
  return new Promise(resolve => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = () => resolve();
    document.head.appendChild(s);
  });
}
function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

const MAP_STYLE = `
  @keyframes dot-pulse {
    0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.6; }
    100% { transform: translate(-50%,-50%) scale(3.6); opacity: 0; }
  }
  @keyframes cluster-pulse {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(2);   opacity: 0; }
  }
  @keyframes pin-pop {
    0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
    65%  { transform: translate(-50%,-50%) scale(1.1); }
    100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
  }
  .map-price-pin {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%,-50%);
    border-radius: 20px; padding: 6px 12px;
    font-size: 12px; font-weight: 800; white-space: nowrap;
    cursor: pointer; line-height: 1;
    animation: pin-pop 0.2s ease-out both;
    transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
  }
  .map-price-pin:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.28) !important; }
  .map-price-pin.tier-mid    { background:#fff;    color:#111;    border:2px solid rgba(0,0,0,0.14);      box-shadow:0 2px 10px rgba(0,0,0,0.18); }
  .map-price-pin.tier-low    { background:#f0fdf4; color:#065f46; border:2px solid rgba(6,111,54,0.4);   box-shadow:0 2px 10px rgba(6,111,54,0.2); }
  .map-price-pin.tier-high   { background:#021A0E; color:#fff;    border:2px solid rgba(255,255,255,0.1); box-shadow:0 2px 10px rgba(0,0,0,0.3); }
  .map-price-pin.tier-viewed { background:#f4f4f5; color:#71717a; border:2px solid rgba(113,113,122,0.35); box-shadow:0 2px 10px rgba(0,0,0,0.10); }
  .map-price-pin.tier-mid:hover,    .map-price-pin.tier-mid.active    { background:#111827; color:#fff; border-color:#111827; }
  .map-price-pin.tier-low:hover,    .map-price-pin.tier-low.active    { background:#066F36; color:#fff; border-color:#066F36; }
  .map-price-pin.tier-high:hover,   .map-price-pin.tier-high.active   { background:#066F36; border-color:#066F36; }
  .map-price-pin.tier-viewed:hover, .map-price-pin.tier-viewed.active { background:#52525b; color:#fff; border-color:#52525b; }
`;

function priceTier(price: number | null | undefined, viewed: boolean): string {
  if (viewed) return 'viewed';
  if (!price) return 'mid';
  if (price > 25_000_000) return 'high';
  if (price < 6_000_000) return 'low';
  return 'mid';
}

function fmtShort(price: number): string {
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' млн';
  if (price >= 1_000) return (price / 1_000).toFixed(0) + ' тыс';
  return String(price);
}

export function HeroMap({
  dots,
  layer = 'schema',
  onCountChange,
  premiumSlugs = [],
}: {
  dots: Dot[];
  layer?: string;
  onCountChange?: (n: number) => void;
  premiumSlugs?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const onCountRef = useRef(onCountChange);
  onCountRef.current = onCountChange;

  const [selected, setSelected] = useState<Selected | null>(null);
  const [visibleCount, setVisibleCount] = useState(dots.length);
  const setSelectedRef = useRef(setSelected);
  const setVisibleRef = useRef(setVisibleCount);

  useEffect(() => {
    if (!tileRef.current || !mapRef.current) return;
    tileRef.current.setUrl(TILE_URLS[layer] ?? TILE_URLS.schema);
  }, [layer]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const existing = document.getElementById('heromap-style');
    if (existing) existing.textContent = MAP_STYLE;
    else {
      const el = document.createElement('style');
      el.id = 'heromap-style'; el.textContent = MAP_STYLE;
      document.head.appendChild(el);
    }

    loadCss(LEAFLET_CSS);
    loadCss(CLUSTER_CSS1);
    loadCss(CLUSTER_CSS2);

    loadScript(LEAFLET_JS).then(() => loadScript(CLUSTER_JS)).then(() => {
      const L = (window as any).L;
      if (!ref.current || mapRef.current) return;

      let viewed: Set<string> = new Set();
      try {
        const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
        viewed = new Set(raw);
      } catch {}

      const map = L.map(ref.current, {
        center: KZ_CENTER, zoom: 5,
        zoomControl: false, attributionControl: false,
        scrollWheelZoom: true, dragging: true,
        doubleClickZoom: true, touchZoom: true,
        fadeAnimation: false, markerZoomAnimation: false,
      });
      mapRef.current = map;

      const tile = L.tileLayer(TILE_URLS[layer] ?? TILE_URLS.schema, { maxZoom: 19 }).addTo(map);
      tileRef.current = tile;

      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        animate: false,
        iconCreateFunction: (cluster: any) => {
          const n = cluster.getChildCount();
          const lg = n > 100;
          const sz = lg ? 48 : 36;
          const bg = lg ? '#066F36' : '#111827';
          const label = n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
          const wrap = sz + 14;
          return L.divIcon({
            className: '',
            html: `<div style="position:relative;width:${wrap}px;height:${wrap}px;display:flex;align-items:center;justify-content:center">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(6,111,54,0.22);animation:cluster-pulse 2.4s ease-out infinite;pointer-events:none"></div>
              <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};color:#fff;font-size:${lg ? 15 : 13}px;font-weight:900;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.28)">${label}</div>
            </div>`,
            iconSize: [wrap, wrap],
            iconAnchor: [wrap / 2, wrap / 2],
          });
        },
      });

      const mkDotIcon = (isViewed: boolean) => {
        const ringBg = isViewed ? 'rgba(113,113,122,0.25)' : 'rgba(6,111,54,0.35)';
        const coreBg = isViewed ? '#a1a1aa' : '#066F36';
        return L.divIcon({
          className: '',
          html: `<div style="position:relative;width:28px;height:28px;overflow:visible">
            <div style="position:absolute;left:50%;top:50%;width:28px;height:28px;border-radius:50%;background:${ringBg};animation:dot-pulse 2.2s ease-out infinite;pointer-events:none"></div>
            <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:${coreBg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)"></div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
      };

      const premiumSet = new Set(premiumSlugs);

      const mkPriceIcon = (price: number | null | undefined, area: number | null | undefined, isViewed: boolean, isPremium: boolean) => {
        const text = price ? `${fmtShort(price)} ₸` : area ? `${area} сот.` : '•';
        const tier = priceTier(price, isViewed);
        const prefix = isPremium ? '★ ' : '';
        return L.divIcon({
          className: 'map-pin-wrap',
          html: `<div class="map-price-pin tier-${tier}">${prefix}${text}</div>`,
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        });
      };

      const markerData: { marker: any; price: number | null | undefined; area: number | null | undefined; isViewed: boolean; isPremium: boolean }[] = [];

      dots.forEach(({ lat, lng, slug, title, price, area, landType, location, image }) => {
        const isViewed = !!(slug && viewed.has(slug));
        const isPremium = !!(slug && premiumSet.has(slug));
        const marker = L.marker([lat, lng], { icon: mkDotIcon(isViewed) });

        if (slug && title) {
          marker.on('click', () => {
            setSelectedRef.current({ slug, title, price, area, landType, location, image, isPremium, isViewed });
          });
        }

        clusterGroup.addLayer(marker);
        markerData.push({ marker, price, area, isViewed, isPremium });
      });

      map.addLayer(clusterGroup);

      // Close panel on map click (not marker)
      map.on('click', () => setSelectedRef.current(null));

      map.on('zoomend', () => {
        const zoom = map.getZoom();
        markerData.forEach(({ marker, price, area, isViewed, isPremium }) => {
          marker.setIcon(zoom >= PRICE_ZOOM ? mkPriceIcon(price, area, isViewed, isPremium) : mkDotIcon(isViewed));
        });
      });

      const updateCount = () => {
        const bounds = map.getBounds();
        const n = dots.filter(d => bounds.contains([d.lat, d.lng])).length;
        setVisibleRef.current(n);
        onCountRef.current?.(n);
      };
      map.on('moveend zoomend', updateCount);
      updateCount();
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  }, []);

  const sel = selected;
  const priceStr = sel?.price ? sel.price.toLocaleString('ru-RU') + ' ₸' : '';
  const perSotka = sel?.price && sel?.area ? Math.round(sel.price / sel.area).toLocaleString('ru-RU') + ' ₸ / сотка' : '';
  const meta = sel ? [sel.landType ?? 'ИЖС', sel.location?.toUpperCase(), sel.area ? sel.area + ' сот.' : ''].filter(Boolean).join(' · ') : '';

  return (
    <div className="relative w-full h-full">
      <div ref={ref} className="w-full h-full" />

      {/* Counter badge — dimmed when panel open */}
      <div className={`absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur rounded-xl border border-zinc-200/60 px-3 py-2 shadow-sm pointer-events-none transition-opacity duration-200 ${sel ? 'opacity-30' : 'opacity-100'}`}>
        <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500">в окне карты</div>
        <div className="text-[15px] font-black tracking-[-0.035em] text-zinc-900">{visibleCount.toLocaleString('ru-RU')} участков</div>
      </div>

      {/* Bottom panel */}
      {sel && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] pointer-events-auto">
          <div className="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.14)] overflow-hidden">
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 text-base leading-none transition-colors"
            >×</button>

            {/* Image */}
            {sel.image ? (
              <div className="relative h-32 overflow-hidden bg-zinc-100">
                <img src={sel.image} alt={sel.title} className="w-full h-full object-cover" />
                {sel.isPremium && (
                  <span className="absolute top-2 left-2 bg-zinc-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">★ Премиум</span>
                )}
                {sel.isViewed && (
                  <span className="absolute top-2 right-10 bg-zinc-100/90 text-zinc-500 text-[10px] font-semibold px-2 py-1 rounded-md">Просмотрено</span>
                )}
              </div>
            ) : sel.isPremium ? (
              <div className="h-16 bg-gradient-to-r from-[#021A0E] to-[#066F36] flex items-center justify-center">
                <span className="text-white text-[11px] font-bold tracking-widest">★ ПРЕМИУМ</span>
              </div>
            ) : null}

            {/* Info row */}
            <div className="px-4 pt-3 pb-4">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">{meta}</div>
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-zinc-900 leading-snug line-clamp-2">{sel.title}</div>
                  {priceStr && (
                    <div className="mt-1.5 text-[17px] font-black text-zinc-900 tracking-tight leading-none">{priceStr}</div>
                  )}
                  {perSotka && (
                    <div className="mt-0.5 text-[10px] font-mono text-zinc-400">{perSotka}</div>
                  )}
                </div>
                <Link
                  href={`/listing/${sel.slug}`}
                  className="shrink-0 px-4 h-9 rounded-xl bg-zinc-900 hover:bg-primary text-white text-[12.5px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
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
