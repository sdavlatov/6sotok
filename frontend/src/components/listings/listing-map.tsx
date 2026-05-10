'use client';

import { useEffect, useRef, useState } from 'react';

export interface MapPOI {
  lat: number;
  lng: number;
  label: string;
  dot: string;
}

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
  pois?: MapPOI[];
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const TILES = {
  map:       'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  cadastre:  'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
};

const makePlotPolygon = (lat: number, lng: number) => {
  const dLat = 0.000145;
  const dLng = 0.000320;
  return [[lat+dLat, lng-dLng],[lat+dLat, lng+dLng],[lat-dLat, lng+dLng],[lat-dLat, lng-dLng]];
};

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).L) { resolve(); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', () => resolve()); }
    else {
      const s = document.createElement('script');
      s.src = LEAFLET_JS; s.onload = () => resolve();
      document.head.appendChild(s);
    }
  });
}

export function ListingMap({ lat, lng, title, pois = [] }: ListingMapProps) {
  const ref     = useRef<HTMLDivElement>(null);
  const mapRef  = useRef<any>(null);
  const tileRef = useRef<any>(null);
  const poisRef = useRef<any[]>([]);
  const [layer,   setLayer]   = useState<'map' | 'satellite' | 'cadastre'>('map');
  const [showPoi, setShowPoi] = useState(false);

  /* ── Init ── */
  useEffect(() => {
    let map: any = null;
    let wheelCleanup: (() => void) | null = null;

    loadLeaflet().then(() => {
      if (!ref.current) return;
      const L = (window as any).L;
      const isMobile = window.matchMedia('(max-width: 768px)').matches;

      map = L.map(ref.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: true,
        tap: false,
        attributionControl: false,
        boxZoom: false,
        doubleClickZoom: false,
      }).setView([lat, lng], 15);

      // Wheel: prevent map zoom, scroll page instead
      const container = map.getContainer();
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const dy = e.deltaMode === 1 ? e.deltaY * 40
                 : e.deltaMode === 2 ? e.deltaY * window.innerHeight
                 : e.deltaY;
        window.scrollBy(0, dy);
      };
      container.addEventListener('wheel', onWheel, { passive: false });
      wheelCleanup = () => container.removeEventListener('wheel', onWheel);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      tileRef.current = L.tileLayer(TILES.map, { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:160px;height:36px;">
            <div style="position:absolute;width:200px;height:64px;border-radius:50%;background:rgba(6,111,54,0.15);animation:mapPing 2.6s cubic-bezier(0.4,0,0.6,1) infinite;pointer-events:none;"></div>
            <div style="position:relative;display:inline-flex;align-items:center;gap:6px;padding:0 10px 0 4px;height:36px;border-radius:999px;background:#18181b;color:#fff;font-size:12.5px;font-weight:900;letter-spacing:-0.02em;box-shadow:0 6px 24px rgba(0,0,0,0.35);border:2px solid #fff;white-space:nowrap;">
              <span style="width:24px;height:24px;border-radius:50%;background:#2CA64E;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">★</span>
              Этот участок
            </div>
          </div>
        `,
        iconSize: [160, 36],
        iconAnchor: [80, 18],
        className: '',
      });
      L.marker([lat, lng], { icon }).addTo(map);

      L.polygon(makePlotPolygon(lat, lng), {
        color: '#2CA64E', weight: 2.5, dashArray: '6 4',
        fillColor: '#2CA64E', fillOpacity: 0.10,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => { wheelCleanup?.(); if (map) map.remove(); };
  }, [lat, lng]);

  /* ── Switch tiles ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILES[layer], { maxZoom: 19 }).addTo(map);
  }, [layer]);

  /* ── POI markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;
    poisRef.current.forEach(m => map.removeLayer(m));
    poisRef.current = [];
    if (!showPoi) return;
    pois.forEach(p => {
      const shortLabel = p.label.length > 28 ? p.label.slice(0, 26) + '…' : p.label;
      const icon = L.divIcon({
        html: `<div style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:#3f3f46;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);border-radius:8px;padding:3px 8px;white-space:nowrap;box-shadow:0 1px 6px rgba(0,0,0,0.10);border:1px solid #e4e4e7;">
          <span style="width:7px;height:7px;border-radius:50%;background:${p.dot};flex-shrink:0;"></span>${shortLabel}
        </div>`,
        iconSize: null as any, iconAnchor: [0, 12], className: '',
      });
      poisRef.current.push(L.marker([p.lat, p.lng], { icon, interactive: false }).addTo(map));
    });
  }, [showPoi, pois]);

  const tabs = [
    { id: 'map' as const,       label: 'Карта' },
    { id: 'satellite' as const, label: 'Спутник' },
    { id: 'cadastre' as const,  label: 'Кадастр' },
  ];

  const btnStyle = (active: boolean) => ({
    padding: '0 10px', height: 28, borderRadius: 8,
    fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    background: active ? '#18181b' : 'transparent',
    color: active ? '#fff' : '#52525b',
  } as React.CSSProperties);

  return (
    <>
      <style>{`
        @keyframes mapPing {
          0%   { transform: scale(0.8); opacity: 0.7; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-control-zoom { border: 1px solid #e4e4e7 !important; border-radius: 12px !important; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.08) !important; margin-bottom: 12px !important; margin-right: 12px !important; }
        .leaflet-control-zoom a { color: #3f3f46 !important; font-weight: 700 !important; border-bottom: 1px solid #f4f4f5 !important; }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
      `}</style>

      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />

        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: '#fff', borderRadius: 12, border: '1px solid #e4e4e7', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 4, display: 'flex', gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setLayer(t.id)} style={btnStyle(layer === t.id)}>{t.label}</button>
          ))}
          <button onClick={() => setShowPoi(v => !v)} style={btnStyle(showPoi)}>
            Что рядом {pois.length > 0 && <span style={{ opacity: 0.6, fontSize: 10 }}>({pois.length})</span>}
          </button>
        </div>
      </div>
    </>
  );
}
