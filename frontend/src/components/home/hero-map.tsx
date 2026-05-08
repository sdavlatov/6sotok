'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  lat: number;
  lng: number;
  slug?: string;
  title?: string;
  price?: number | null;
  area?: number | null;
  landType?: string | null;
  location?: string | null;
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

// Only keyframes and popup styles go here — dot styles are inline to avoid CSS loading issues
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
  .map-price-pin.tier-viewed { background:#fef3c7; color:#92400e; border:2px solid rgba(217,119,6,0.45); box-shadow:0 2px 10px rgba(217,119,6,0.2); }
  .map-price-pin.tier-mid:hover,    .map-price-pin.tier-mid.active    { background:#111827; color:#fff; border-color:#111827; }
  .map-price-pin.tier-low:hover,    .map-price-pin.tier-low.active    { background:#066F36; color:#fff; border-color:#066F36; }
  .map-price-pin.tier-high:hover,   .map-price-pin.tier-high.active   { background:#066F36; border-color:#066F36; }
  .map-price-pin.tier-viewed:hover, .map-price-pin.tier-viewed.active { background:#d97706; color:#fff; border-color:#d97706; }
  .map-listing-popup .leaflet-popup-content-wrapper {
    border-radius: 16px; padding: 0; overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18); border: 1px solid #e4e4e7;
  }
  .map-listing-popup .leaflet-popup-content { margin: 0; }
  .map-listing-popup .leaflet-popup-tip-container { display: none; }
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
}: {
  dots: Dot[];
  layer?: string;
  onCountChange?: (n: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const onCountRef = useRef(onCountChange);
  onCountRef.current = onCountChange;

  useEffect(() => {
    if (!tileRef.current || !mapRef.current) return;
    tileRef.current.setUrl(TILE_URLS[layer] ?? TILE_URLS.schema);
  }, [layer]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    // Always overwrite so hot-reload picks up CSS changes
    const existing = document.getElementById('heromap-style');
    if (existing) {
      existing.textContent = MAP_STYLE;
    } else {
      const el = document.createElement('style');
      el.id = 'heromap-style';
      el.textContent = MAP_STYLE;
      document.head.appendChild(el);
    }

    loadCss(LEAFLET_CSS);
    loadCss(CLUSTER_CSS1);
    loadCss(CLUSTER_CSS2);

    loadScript(LEAFLET_JS).then(() => loadScript(CLUSTER_JS)).then(() => {
      const L = (window as any).L;
      if (!ref.current || mapRef.current) return;

      // Read viewed slugs from localStorage
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
      });
      mapRef.current = map;

      const tile = L.tileLayer(TILE_URLS[layer] ?? TILE_URLS.schema, { maxZoom: 19 }).addTo(map);
      tileRef.current = tile;

      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
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

      // Icon factories — all dot styles are inline to avoid CSS class loading issues
      const mkDotIcon = (isViewed: boolean) => {
        const ringBg = isViewed ? 'rgba(217,119,6,0.35)' : 'rgba(6,111,54,0.35)';
        const coreBg = isViewed ? '#d97706' : '#066F36';
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

      const mkPriceIcon = (price: number | null | undefined, area: number | null | undefined, isViewed: boolean) => {
        const text = price ? `${fmtShort(price)} ₸` : area ? `${area} сот.` : '•';
        const tier = priceTier(price, isViewed);
        return L.divIcon({
          className: 'map-pin-wrap',
          html: `<div class="map-price-pin tier-${tier}">${isViewed ? '👁 ' : ''}${text}</div>`,
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        });
      };

      const markerData: { marker: any; price: number | null | undefined; area: number | null | undefined; isViewed: boolean }[] = [];

      dots.forEach(({ lat, lng, slug, title, price, area, landType, location }) => {
        const isViewed = !!(slug && viewed.has(slug));
        const marker = L.marker([lat, lng], { icon: mkDotIcon(isViewed) });

        if (slug && title) {
          const priceRow = price
            ? `<div style="font-size:17px;font-weight:900;color:#111;letter-spacing:-0.03em;margin-top:6px">${price.toLocaleString('ru-RU')} ₸</div>${area ? `<div style="font-size:10px;color:#a1a1aa;margin-top:2px;font-family:monospace">${Math.round(price / area).toLocaleString('ru-RU')} ₸/сотка</div>` : ''}`
            : '';
          const viewedBadge = isViewed ? `<div style="display:inline-block;margin-bottom:6px;font-size:10px;font-weight:700;color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:20px">Просмотрено</div>` : '';
          const meta = `<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#a1a1aa">${landType ?? 'ИЖС'}${location ? ' · ' + location : ''}${area ? ' · ' + area + ' сот.' : ''}</div>`;
          const popup = `
            <div style="width:224px;padding:14px 14px 12px">
              ${viewedBadge}
              ${meta}
              <div style="font-size:13px;font-weight:800;color:#111;line-height:1.2;margin-top:4px;letter-spacing:-0.02em">${title}</div>
              ${priceRow}
              <a href="/listing/${slug}" style="display:flex;align-items:center;justify-content:center;margin-top:12px;padding:9px;background:#111827;color:#fff;border-radius:10px;text-decoration:none;font-size:12px;font-weight:700"
                onmouseover="this.style.background='#066F36'" onmouseout="this.style.background='#111827'">
                Открыть объявление →
              </a>
            </div>`;
          marker.bindPopup(popup, { className: 'map-listing-popup', maxWidth: 248 });
          marker.on('popupopen',  () => marker.getElement()?.querySelector('.map-price-pin')?.classList.add('active'));
          marker.on('popupclose', () => marker.getElement()?.querySelector('.map-price-pin')?.classList.remove('active'));
        }

        clusterGroup.addLayer(marker);
        markerData.push({ marker, price, area, isViewed });
      });

      map.addLayer(clusterGroup);

      // Zoom-based icon switch: dots → price labels
      map.on('zoomend', () => {
        const zoom = map.getZoom();
        markerData.forEach(({ marker, price, area, isViewed }) => {
          marker.setIcon(zoom >= PRICE_ZOOM ? mkPriceIcon(price, area, isViewed) : mkDotIcon(isViewed));
        });
      });

      // Dynamic visible count
      const updateCount = () => {
        const bounds = map.getBounds();
        onCountRef.current?.(dots.filter(d => bounds.contains([d.lat, d.lng])).length);
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

  return <div ref={ref} className="w-full h-full" />;
}
