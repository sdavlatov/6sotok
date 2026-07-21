'use client';

import { useState, useEffect, useRef } from 'react';

// ── Загрузка Leaflet с CDN (пакет не установлен — типы глобальные) ───────────
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
// Приблизительные границы Казахстана
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const KZ_BOUNDS: any = [[40.5, 50.3], [55.5, 87.3]];

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = LEAFLET_CSS;
      document.head.appendChild(l);
    }
    const ex = document.querySelector<HTMLScriptElement>(`script[src="${LEAFLET_JS}"]`);
    if (ex) { ex.addEventListener('load', () => resolve(), { once: true }); return; }
    const s = document.createElement('script');
    s.src = LEAFLET_JS; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

export type LatLng = { lat: number; lng: number };

// ── Карта-редактор: точка + рисование контура участка (по макету MapEditor) ──
export function MapEditor({ value, onChange, boundary, onBoundaryChange, height = 260 }: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  boundary: LatLng[] | null;
  onBoundaryChange: (b: LatLng[] | null) => void;
  height?: number;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polygonRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const draftPolyRef = useRef<any>(null);
  const drawPtsRef = useRef<[number, number][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dotMarkersRef = useRef<any[]>([]);
  const modeRef = useRef<'pin' | 'draw'>('pin');
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'pin' | 'draw'>('pin');
  const [drawCount, setDrawCount] = useState(0);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { loadLeaflet().then(() => setReady(true)).catch(() => {}); }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || mapRef.current || !window.L) return;
    if ((mapEl.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;
    const L = window.L;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = L.map(mapEl.current, {
      zoomControl: false, scrollWheelZoom: true,
      maxBounds: KZ_BOUNDS, maxBoundsViscosity: 1.0, doubleClickZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    map.fitBounds(KZ_BOUNDS);
    map.once('moveend', () => map.setMinZoom(map.getZoom()));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      if (modeRef.current === 'pin') {
        onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
      } else {
        const pt: [number, number] = [+lat.toFixed(6), +lng.toFixed(6)];
        drawPtsRef.current.push(pt);
        setDrawCount(drawPtsRef.current.length);
        const dot = L.circleMarker(pt, {
          radius: 6, color: '#ffffff', weight: 2,
          fillColor: '#066F36', fillOpacity: 1,
        }).addTo(map);
        dotMarkersRef.current.push(dot);
        if (draftPolyRef.current) draftPolyRef.current.remove();
        if (drawPtsRef.current.length >= 2) {
          draftPolyRef.current = L.polygon(drawPtsRef.current, {
            color: '#066F36', weight: 2, dashArray: '6 4', fillOpacity: 0.08,
          }).addTo(map);
        }
      }
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Сохранённый контур
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
    if (boundary && boundary.length >= 3) {
      polygonRef.current = L.polygon(boundary.map(p => [p.lat, p.lng]), {
        color: '#066F36', weight: 2, fillOpacity: 0.15,
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [24, 24] });
    }
  }, [boundary, ready]);

  // Точка
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (!value) { pinRef.current?.remove(); pinRef.current = null; return; }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#066F36;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconAnchor: [9, 9],
    });
    if (pinRef.current) pinRef.current.setLatLng([value.lat, value.lng]);
    else pinRef.current = L.marker([value.lat, value.lng], { icon }).addTo(mapRef.current);
  }, [value, ready]);

  const clearDots = () => {
    dotMarkersRef.current.forEach(d => d.remove());
    dotMarkersRef.current = [];
  };
  const finishDraw = () => {
    if (drawPtsRef.current.length >= 3) {
      onBoundaryChange(drawPtsRef.current.map(([lat, lng]) => ({ lat, lng })));
    }
    if (draftPolyRef.current) { draftPolyRef.current.remove(); draftPolyRef.current = null; }
    clearDots();
    drawPtsRef.current = []; setDrawCount(0); setMode('pin');
  };
  const cancelDraw = () => {
    if (draftPolyRef.current) { draftPolyRef.current.remove(); draftPolyRef.current = null; }
    clearDots();
    drawPtsRef.current = []; setDrawCount(0); setMode('pin');
  };

  const area = boundary && boundary.length >= 3 ? polygonAreaSotka(boundary) : null;

  return (
    <div className="submit-map relative overflow-hidden rounded-xl border border-[var(--line)]" style={{ isolation: 'isolate' }}>
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--paper-2)] text-xs font-semibold text-ink-400">
          Загрузка карты…
        </div>
      )}
      <div ref={mapEl} style={{ height }} />

      {/* Режимы — угол карты (по макету) */}
      {ready && (
        <div className="pointer-events-auto absolute left-3 top-3 z-[500] flex gap-1.5">
          <button type="button" onClick={() => { cancelDraw(); setMode('pin'); }}
            className={`h-7 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${mode === 'pin' ? 'border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand-ink)]' : 'border-[var(--line)] bg-white text-ink-700 hover:bg-[var(--paper-2)]'}`}>
            ○ Точка
          </button>
          <button type="button" onClick={() => setMode('draw')}
            className={`h-7 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${mode === 'draw' ? 'border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand-ink)]' : 'border-[var(--line)] bg-white text-ink-700 hover:bg-[var(--paper-2)]'}`}>
            ◌ Нарисовать
          </button>
        </div>
      )}

      {/* Статус площади (кадастр) */}
      {ready && area && (
        <div className="absolute right-3 top-3 z-[500]">
          <span className="mono inline-block rounded-md bg-[rgba(9,9,11,0.85)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            {area} сот · по контуру
          </span>
        </div>
      )}

      {/* Подсказка режима */}
      {ready && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-[500] flex justify-center">
          {mode === 'pin' && !value && !boundary && (
            <span className="rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              Нажмите, чтобы поставить точку
            </span>
          )}
          {mode === 'draw' && (
            <span className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-[11px] font-semibold text-white">
              {drawCount === 0 ? 'Кликайте по углам участка' : `${drawCount} точек · минимум 3`}
            </span>
          )}
        </div>
      )}

      {/* Нижняя панель действий рисования / контроль */}
      <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-[500] flex items-center gap-2">
        {mode === 'draw' ? (
          <>
            <button type="button" onClick={finishDraw} disabled={drawCount < 3}
              className="h-8 rounded-lg bg-[var(--brand)] px-3 text-[11px] font-bold text-white transition-opacity disabled:opacity-40">
              Сохранить контур ({drawCount})
            </button>
            <button type="button" onClick={cancelDraw}
              className="h-8 rounded-lg bg-white/90 px-3 text-[11px] font-bold text-ink-600 backdrop-blur-sm">
              Отмена
            </button>
          </>
        ) : (
          <>
            {value && (
              <span className="mono rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-ink-500 backdrop-blur-sm">
                {value.lat}, {value.lng}
              </span>
            )}
            <div className="ml-auto flex overflow-hidden rounded-lg border border-[var(--line)] bg-white">
              <button type="button" onClick={() => mapRef.current?.zoomIn()} className="flex size-8 items-center justify-center text-base font-bold text-ink-700 hover:bg-[var(--paper-2)]">+</button>
              <span className="w-px bg-[var(--line)]" />
              <button type="button" onClick={() => mapRef.current?.zoomOut()} className="flex size-8 items-center justify-center text-base font-bold text-ink-700 hover:bg-[var(--paper-2)]">−</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Грубая оценка площади полигона (соток) через формулу шнурования на сфере
function polygonAreaSotka(pts: LatLng[]): string {
  const R = 6378137;
  const rad = (d: number) => (d * Math.PI) / 180;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += rad(b.lng - a.lng) * (2 + Math.sin(rad(a.lat)) + Math.sin(rad(b.lat)));
  }
  const m2 = Math.abs((s * R * R) / 2);
  return (m2 / 100).toFixed(1);
}
