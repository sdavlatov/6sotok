'use client';

/**
 * MapView — интерактивная карта на Leaflet + OpenStreetMap (без API ключа).
 *
 * Leaflet грузится через CDN в useEffect — npm install не нужен.
 * Когда npm станет доступен, можно переключиться на react-leaflet
 * без изменения интерфейса компонента (props остаются теми же).
 *
 * npm install leaflet react-leaflet @types/leaflet
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Listing } from '@/types/listing';

// ─── Константы ──────────────────────────────────────────────────────────────
const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS  = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

/** Центр Казахстана, зум на всю страну */
const KZ_CENTER: [number, number] = [48.0, 68.0];
const KZ_ZOOM = 5;

// ─── Типы Leaflet (минимальные — только то что используем) ──────────────────
interface LMap {
  setView(center: [number, number], zoom: number): LMap;
  remove(): void;
  fitBounds(bounds: LLatLngBounds, options?: { padding?: [number, number]; maxZoom?: number }): LMap;
  on(event: string, fn: (e: { latlng: { lat: number; lng: number } }) => void): LMap;
}
interface LMarker {
  addTo(map: LMap): LMarker;
  bindPopup(content: string): LMarker;
  on(event: string, fn: () => void): LMarker;
  remove(): void;
  setLatLng(latlng: [number, number]): LMarker;
}
interface LLatLngBounds {
  isValid(): boolean;
}
interface LeafletStatic {
  map(el: HTMLElement, options?: object): LMap;
  tileLayer(url: string, options?: object): { addTo(map: LMap): void };
  marker(latlng: [number, number], options?: object): LMarker;
  divIcon(options: object): object;
  latLngBounds(latlngs: [number, number][]): LLatLngBounds;
}

declare global {
  interface Window { L?: LeafletStatic }
}

// ─── Утилиты ────────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)} млн ₸`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(0)} тыс ₸`;
  return `${price} ₸`;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Уже загружен — L готов
    if (window.L) { resolve(); return; }
    // Тег уже есть, но L ещё не готов — ждём события
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('leaflet load error')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('leaflet load error'));
    document.head.appendChild(s);
  });
}

function loadCss(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = href;
  document.head.appendChild(link);
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface MapViewProps {
  listings: Listing[];
  /** Клик по маркеру — прокручивает к карточке в сетке */
  onMarkerClick?: (listing: Listing) => void;
}

// ─── Компонент ───────────────────────────────────────────────────────────────
export function MapView({ listings, onMarkerClick }: MapViewProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<LMap | null>(null);
  const markersRef  = useRef<LMarker[]>([]);
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState(false);
  const [active, setActive] = useState<Listing | null>(null);

  // Загружаем Leaflet один раз
  useEffect(() => {
    loadCss(LEAFLET_CSS);
    loadScript(LEAFLET_JS)
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  // Инициализируем карту после загрузки Leaflet
  useEffect(() => {
    if (!ready || !mapRef.current || leafletMap.current || !window.L) return;
    // Защита от повторной инициализации Leaflet на том же DOM-узле (React Strict Mode)
    if ((mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;
    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    map.setView(KZ_CENTER, KZ_ZOOM);
    leafletMap.current = map;
  }, [ready]);

  // Обновляем маркеры при изменении листингов
  useEffect(() => {
    if (!ready || !leafletMap.current || !window.L) return;
    const L = window.L;
    const map = leafletMap.current;

    // Удаляем старые маркеры
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const withCoords = listings.filter(l => l.lat != null && l.lng != null);

    withCoords.forEach(listing => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: #16a34a;
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          padding: 3px 7px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          font-family: system-ui, sans-serif;
        ">${formatPrice(listing.price)}</div>`,
        iconAnchor: [0, 0],
      });

      const marker = L.marker([listing.lat!, listing.lng!], { icon })
        .addTo(map)
        .on('click', () => {
          setActive(listing);
          onMarkerClick?.(listing);
        });

      markersRef.current.push(marker);
    });

    // Если есть маркеры — подгоняем bounds
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(l => [l.lat!, l.lng!]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      }
    } else {
      map.setView(KZ_CENTER, KZ_ZOOM);
    }
  }, [listings, ready, onMarkerClick]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-500 text-sm">
        Не удалось загрузить карту. Проверьте подключение к интернету.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Карта */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10">
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <svg className="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-[12px] font-semibold">Загрузка карты...</span>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full"
          style={{ height: 420 }}
        />
        {/* Счётчик маркеров */}
        {ready && (
          <div className="absolute bottom-3 left-3 z-[999] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[11px] font-bold text-zinc-700 shadow-md border border-zinc-200">
            {listings.filter(l => l.lat != null).length} объявлений на карте
          </div>
        )}
      </div>

      {/* Попап выбранного объявления */}
      {active && (
        <div className="relative -mt-1 mx-2">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 flex gap-4 items-start">
            <img
              src={active.image}
              alt={active.title}
              className="w-20 h-16 rounded-xl object-cover shrink-0 bg-zinc-100"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-zinc-900 leading-snug line-clamp-2">{active.title}</p>
              <p className="text-[12px] text-zinc-500 mt-0.5">{active.location}</p>
              <p className="text-[14px] font-black text-primary mt-1">{formatPrice(active.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => setActive(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
              <Link
                href={`/listing/${active.slug}`}
                className="text-[11px] font-bold text-primary hover:text-primary-hover border border-primary/30 rounded-lg px-2.5 py-1 transition-colors"
              >
                Открыть →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
