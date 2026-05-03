'use client';

import { useEffect, useRef } from 'react';

interface ListingMapProps {
  lat: number;
  lng: number;
  title: string;
}

export function ListingMap({ lat, lng, title }: ListingMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;

    const L = (window as any).L;
    if (!L) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const map = L.map(ref.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: !isMobile,
      tap: false,
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      html: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:rgba(6,111,54,0.15);animation:mapPing 2s ease-out infinite;"></div>
          <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(6,111,54,0.25);"></div>
          <div style="position:relative;width:14px;height:14px;background:#066F36;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(6,111,54,0.5);"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: '',
    });

    L.marker([lat, lng], { icon }).addTo(map).bindPopup(
      `<div style="font-family:inherit;font-size:13px;font-weight:600;color:#18181b;padding:2px 0">${title}</div>`,
      { maxWidth: 220 }
    );

    return () => { map.remove(); };
  }, [lat, lng, title]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async />
      <style>{`
        @keyframes mapPing {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div ref={ref} style={{ height: '100%', width: '100%' }} />
      </div>
    </>
  );
}
