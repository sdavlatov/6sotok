'use client';

import { useEffect, useRef, useState } from 'react';

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
}

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const TILES = {
  map:       { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',       attr: '© OpenStreetMap © CARTO' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
  cadastre:  { url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  attr: '© OpenStreetMap © CARTO' },
};

// Static POIs offset from center (fake data — will be replaced by Overpass API)
const makePois = (lat: number, lng: number) => [
  { lat: lat + 0.0045, lng: lng - 0.0060, dot: '#18181b', label: 'школа №3 · 800 м' },
  { lat: lat + 0.0010, lng: lng + 0.0110, dot: '#2563eb', label: 'река Талгар · 600 м' },
  { lat: lat - 0.0050, lng: lng + 0.0080, dot: '#18181b', label: 'магазин Magnum · 1.2 км' },
];

// Approximate rectangular polygon around center (≈32×57m)
const makePlotPolygon = (lat: number, lng: number) => {
  const dLat = 0.000145; // ~16m
  const dLng = 0.000320; // ~28m
  return [
    [lat + dLat, lng - dLng],
    [lat + dLat, lng + dLng],
    [lat - dLat, lng + dLng],
    [lat - dLat, lng - dLng],
  ];
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
    if (existing) {
      existing.addEventListener('load', () => resolve());
    } else {
      const s = document.createElement('script');
      s.src = LEAFLET_JS; s.onload = () => resolve();
      document.head.appendChild(s);
    }
  });
}

export function ListingMap({ lat, lng, title }: ListingMapProps) {
  const ref       = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<any>(null);
  const tileRef   = useRef<any>(null);
  const poisRef   = useRef<any[]>([]);
  const [layer,   setLayer]   = useState<'map' | 'satellite' | 'cadastre'>('map');
  const [showPoi, setShowPoi] = useState(false);

  /* ── Init map ── */
  useEffect(() => {
    let map: any = null;
    loadLeaflet().then(() => {
      if (!ref.current) return;
      const L = (window as any).L;

      map = L.map(ref.current, {
        zoomControl: false,          // отключаем дефолтный
        scrollWheelZoom: false,
        dragging: true,
        tap: false,
        attributionControl: false,   // убираем атрибуцию
      }).setView([lat, lng], 15);

      // Зум — правый нижний угол
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      tileRef.current = L.tileLayer(TILES.map.url, { maxZoom: 19 }).addTo(map);

      // Пилюля-маркер
      const icon = L.divIcon({
        html: `
          <div style="position:relative;display:inline-flex;align-items:center;gap:6px;padding:0 10px 0 4px;height:36px;border-radius:999px;background:#18181b;color:#fff;font-family:inherit;font-size:12.5px;font-weight:900;letter-spacing:-0.02em;box-shadow:0 6px 24px rgba(0,0,0,0.35);border:2px solid #fff;white-space:nowrap;">
            <span style="width:24px;height:24px;border-radius:50%;background:#2CA64E;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">★</span>
            Этот участок
          </div>
        `,
        iconSize: [160, 36],
        iconAnchor: [80, 18],
        className: '',
      });
      L.marker([lat, lng], { icon }).addTo(map);

      // Контур участка — пунктирный прямоугольник
      const poly = makePlotPolygon(lat, lng);
      L.polygon(poly, {
        color: '#2CA64E',
        weight: 2.5,
        dashArray: '6 4',
        fillColor: '#2CA64E',
        fillOpacity: 0.10,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => { if (map) map.remove(); };
  }, [lat, lng]);

  /* ── Switch tiles ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;
    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILES[layer].url, { maxZoom: 19 }).addTo(map);
  }, [layer]);

  /* ── Toggle POI markers ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;

    // Убираем старые
    poisRef.current.forEach(m => map.removeLayer(m));
    poisRef.current = [];

    if (!showPoi) return;

    makePois(lat, lng).forEach(p => {
      const icon = L.divIcon({
        html: `<div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:#3f3f46;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);border-radius:8px;padding:3px 8px;white-space:nowrap;box-shadow:0 1px 6px rgba(0,0,0,0.1);border:1px solid #e4e4e7;">
          <span style="width:7px;height:7px;border-radius:50%;background:${p.dot};flex-shrink:0;"></span>
          ${p.label}
        </div>`,
        iconSize: [180, 24],
        iconAnchor: [0, 12],
        className: '',
      });
      const m = L.marker([p.lat, p.lng], { icon, interactive: false }).addTo(map);
      poisRef.current.push(m);
    });
  }, [showPoi, lat, lng]);

  const tabs = [
    { id: 'map' as const,       label: 'Карта' },
    { id: 'satellite' as const, label: 'Спутник' },
    { id: 'cadastre' as const,  label: 'Кадастр' },
  ];

  return (
    <>
      <style>{`
        .leaflet-container { font-family: inherit; }
        .leaflet-control-zoom {
          border: 1px solid #e4e4e7 !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08) !important;
          margin-bottom: 12px !important;
          margin-right: 12px !important;
        }
        .leaflet-control-zoom a {
          color: #3f3f46 !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #f4f4f5 !important;
        }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
      `}</style>

      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />

        {/* Переключатель слоёв — фиксированный в левом верхнем углу */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          background: '#fff', borderRadius: 12, border: '1px solid #e4e4e7',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)', padding: 4,
          display: 'flex', gap: 2, pointerEvents: 'auto',
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setLayer(t.id)}
              style={{
                padding: '0 10px', height: 28, borderRadius: 8,
                fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                background: layer === t.id ? '#18181b' : 'transparent',
                color: layer === t.id ? '#fff' : '#52525b',
              }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowPoi(v => !v)}
            style={{
              padding: '0 10px', height: 28, borderRadius: 8,
              fontSize: 11.5, fontWeight: 600, border: 'none', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              background: showPoi ? '#18181b' : 'transparent',
              color: showPoi ? '#fff' : '#52525b',
            }}>
            Что рядом
          </button>
        </div>
      </div>
    </>
  );
}
