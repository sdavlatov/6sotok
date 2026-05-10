'use client';

import { useEffect, useRef, useState } from 'react';

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const TILE_LAYERS = {
  map:      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  cadastre: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
};

const POIS = [
  { top: '18%', left: '20%', dot: '#18181b', label: 'школа №3 · 800 м' },
  { top: '36%', left: '76%', dot: '#2563eb', label: 'река Талгар · 600 м' },
  { top: '70%', left: '62%', dot: '#18181b', label: 'магазин Magnum · 1.2 км' },
];

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve(); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
    } else {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.onload = () => resolve();
      document.head.appendChild(script);
    }
  });
}

export function ListingMap({ lat, lng, title }: ListingMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const [layer, setLayer] = useState<'map' | 'satellite' | 'cadastre'>('map');
  const [showPoi, setShowPoi] = useState(false);

  useEffect(() => {
    let map: any = null;
    loadLeaflet().then(() => {
      if (!ref.current) return;
      const L = (window as any).L;
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      map = L.map(ref.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: !isMobile,
        tap: false,
        attributionControl: true,
      }).setView([lat, lng], 15);

      tileRef.current = L.tileLayer(TILE_LAYERS.map, {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Pill-shaped marker
      const icon = L.divIcon({
        html: `
          <div style="position:relative;display:inline-flex;align-items:center;gap:6px;padding:0 10px 0 4px;height:36px;border-radius:999px;background:#18181b;color:#fff;font-family:inherit;font-size:12.5px;font-weight:900;letter-spacing:-0.02em;box-shadow:0 6px 24px rgba(0,0,0,0.35);border:2px solid #fff;white-space:nowrap;">
            <span style="width:24px;height:24px;border-radius:50%;background:#2CA64E;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">★</span>
            Этот участок
          </div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:rgba(6,111,54,0.15);animation:mapPing 2.6s ease-out infinite;z-index:-1;pointer-events:none;"></div>
        `,
        iconSize: [160, 36],
        iconAnchor: [80, 18],
        className: '',
      });

      L.marker([lat, lng], { icon }).addTo(map);
      mapRef.current = map;
    });

    return () => { if (map) map.remove(); };
  }, [lat, lng]);

  // Switch tile layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;
    if (tileRef.current) { map.removeLayer(tileRef.current); }
    tileRef.current = L.tileLayer(
      layer === 'satellite' ? TILE_LAYERS.satellite : layer === 'cadastre' ? TILE_LAYERS.cadastre : TILE_LAYERS.map,
      { attribution: '© OpenStreetMap', maxZoom: 19 }
    ).addTo(map);
  }, [layer]);

  const tabs = [
    { id: 'map',       label: 'Карта' },
    { id: 'satellite', label: 'Спутник' },
    { id: 'cadastre',  label: 'Кадастр' },
  ] as const;

  return (
    <>
      <style>{`
        @keyframes mapPing {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-control-zoom { border: 1px solid #e4e4e7 !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important; }
        .leaflet-control-zoom a { color: #3f3f46 !important; font-weight: 700 !important; }
      `}</style>
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        {/* Карта */}
        <div ref={ref} style={{ height: '100%', width: '100%' }} />

        {/* Переключатель слоёв */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: '#fff', borderRadius: 12, border: '1px solid #e4e4e7', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 4, display: 'flex', gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setLayer(t.id)}
              style={{
                padding: '0 10px', height: 28, borderRadius: 8, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: layer === t.id ? '#18181b' : 'transparent',
                color: layer === t.id ? '#fff' : '#52525b',
              }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowPoi(v => !v)}
            style={{
              padding: '0 10px', height: 28, borderRadius: 8, fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: showPoi ? '#18181b' : 'transparent',
              color: showPoi ? '#fff' : '#52525b',
            }}>
            Что рядом
          </button>
        </div>

        {/* POI лейблы */}
        {showPoi && POIS.map((p, i) => (
          <div key={i} style={{ position: 'absolute', top: p.top, left: p.left, zIndex: 999, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#3f3f46', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '3px 8px', pointerEvents: 'none' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.dot, flexShrink: 0 }} />
            {p.label}
          </div>
        ))}
      </div>
    </>
  );
}
