'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pushDataLayer } from '@/lib/analytics';
import { LAND_CATEGORIES, UTILITIES, LEGAL_FILTERS } from '@/lib/listing-constants';
import { useAuth } from '@/context/auth-context';
import { ChevronLeft } from 'lucide-react';

// ── форматирование цены ──────────────────────────────────────────────────────
const fmtPrice = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
};
const rawPrice = (v: string) => Number(v.replace(/\s/g, ''));

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const KZ_CENTER: [number, number] = [48.0, 68.0];
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

// ── Карта: точка + рисование границ участка ─────────────────────────────────
type LatLng = { lat: number; lng: number };

function LocationPicker({ value, onChange, boundary, onBoundaryChange }: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  boundary: LatLng[] | null;
  onBoundaryChange: (b: LatLng[] | null) => void;
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
      zoomControl: true, scrollWheelZoom: true,
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
        // Видимый маркер-точка
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

  // Render saved boundary
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
    if (boundary && boundary.length >= 3) {
      polygonRef.current = L.polygon(boundary.map(p => [p.lat, p.lng]), {
        color: '#066F36', weight: 2, fillOpacity: 0.15,
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(polygonRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [boundary, ready]);

  // Render pin
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

  return (
    <div className="space-y-2">
      {/* Переключатель режима */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => { cancelDraw(); setMode('pin'); }}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${mode === 'pin' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}`}>
          Отметить точку
        </button>
        <button type="button" onClick={() => setMode('draw')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${mode === 'draw' ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}`}>
          Нарисовать границы участка
        </button>
        {boundary && (
          <button type="button" onClick={() => onBoundaryChange(null)}
            className="ml-auto text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            Очистить границу
          </button>
        )}
      </div>

      {/* Карта */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200" style={{ isolation: 'isolate' }}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10 text-xs font-semibold text-zinc-400">
            Загрузка карты...
          </div>
        )}
        <div ref={mapEl} style={{ height: 280 }} />
        {ready && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-[400]">
            {mode === 'pin' && !value && !boundary && (
              <span className="bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                Нажмите чтобы поставить точку
              </span>
            )}
            {mode === 'draw' && (
              <span className="bg-primary text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                {drawCount === 0
                  ? 'Кликайте по углам участка'
                  : `${drawCount} точ${drawCount === 1 ? 'ка' : drawCount < 5 ? 'ки' : 'ек'} · минимум 3 для завершения`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Кнопки рисования */}
      {mode === 'draw' && (
        <div className="flex gap-2">
          <button type="button" onClick={finishDraw} disabled={drawCount < 3}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white disabled:opacity-40 transition-all">
            Сохранить границу ({drawCount} точек)
          </button>
          <button type="button" onClick={cancelDraw}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all">
            Отмена
          </button>
        </div>
      )}

      {value && mode === 'pin' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{value.lat}, {value.lng}</span>
          <button type="button" onClick={() => onChange(null)}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            Убрать точку
          </button>
        </div>
      )}
      {boundary && <p className="text-xs text-primary font-semibold">✓ Граница участка сохранена ({boundary.length} точек)</p>}
    </div>
  );
}

// ── Константы ────────────────────────────────────────────────────────────────
const KZ_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау', 'Павлодар', 'Семей',
  'Қарағанды', 'Тараз', 'Өскемен', 'Актау', 'Уральск', 'Петропавловск',
  'Талдыкорган', 'Кызылорда', 'Туркестан', 'Кокшетау', 'Темиртау',
  'Экибастуз', 'Рудный', 'Жанаозен', 'Конаев', 'Степногорск', 'Балхаш',
  'Сатпаев', 'Риддер', 'Байконур', 'Жезказган', 'Каскелен', 'Талгар',
  'Есик', 'Капшагай', 'Щучинск', 'Бурабай', 'Хромтау', 'Боралдай',
  'Отеген батыр', 'Жаркент', 'Ленгер', 'Кентау', 'Сарыагаш', 'Шардара',
  'Арысь', 'Аксай', 'Аркалык', 'Аксу', 'Приозёрск', 'Абай', 'Житикара',
  'Аральск', 'Форт-Шевченко', 'Бейнеу', 'Зайсан', 'Алтай', 'Каратау',
  'Шу', 'Мамлютка', 'Лисаковск', 'Ушарал',
];

const RELIEF_TYPES = ['Ровный', 'Под уклон'];

const OWNERSHIP_TYPES = ['Частная собственность', 'Аренда'] as const;
const LOCATION_TYPES = [
  { value: 'city', label: 'В городе' },
  { value: 'suburb', label: 'В пригороде' },
  { value: 'highway', label: 'Вдоль трассы' },
  { value: 'water', label: 'Возле водоёма' },
  { value: 'foothills', label: 'В предгорьях' },
  { value: 'dacha', label: 'В дачном массиве' },
] as const;
const PLOT_SHAPES = ['Прямоугольный', 'Квадратный', 'Г-образный', 'Трапеция', 'Нестандартный'] as const;

// ── Главный компонент ────────────────────────────────────────────────────────
export default function AddListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [countdown, setCountdown]       = useState(5);
  const [photos, setPhotos]             = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex]       = useState<number | null>(null);
  const [dragOver, setDragOver]         = useState<number | null>(null);
  const [markerPos, setMarkerPos]       = useState<LatLng | null>(null);
  const [plotBoundary, setPlotBoundary] = useState<LatLng[] | null>(null);
  const [isGeocoding, setIsGeocoding]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fd, setFd] = useState({
    dealType: 'sale' as 'sale' | 'rent',
    landType: '', area: '', price: '',
    location: '', address: '',
    locationType: [] as string[],
    hasElectricity: false, hasGas: false, hasWater: false, hasSewer: false, hasRoadAccess: false,
    hasStateAct: true, isPledged: false, isDivisible: false, isOnRedLine: false,
    hasEncumbrances: false, canChangePurpose: false,
    ownershipType: '', purpose: '',
    landCategory: '', cadastralNumber: '',
    reliefType: '', plotShape: '',
    description: '',
    name: '', phone: '', hasWhatsApp: false,
  });

  // Заполнить контакты из аккаунта
  useEffect(() => {
    if (user) {
      setFd(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const set = (k: keyof typeof fd, v: string | boolean | string[]) =>
    setFd(prev => ({ ...prev, [k]: v }));

  const toggle = (k: keyof typeof fd) =>
    setFd(prev => ({ ...prev, [k]: !prev[k] }));

  const toggleLocationType = (val: string) =>
    setFd(prev => ({
      ...prev,
      locationType: prev.locationType.includes(val)
        ? prev.locationType.filter(v => v !== val)
        : [...prev.locationType, val],
    }));

  const autoTitle = [
    fd.landType || 'Участок',
    fd.area ? `${fd.area} сот.` : '',
    fd.location,
  ].filter(Boolean).join(' · ');

  // Обратное геокодирование при постановке точки
  useEffect(() => {
    if (!markerPos) return;
    const controller = new AbortController();
    setIsGeocoding(true);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${markerPos.lat}&lon=${markerPos.lng}&format=json&accept-language=ru`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(data => {
        const addr = data.address ?? {};
        const road   = addr.road || addr.residential || addr.pedestrian || '';
        const nbhd   = addr.neighbourhood || addr.suburb || addr.city_district || '';
        const city   = addr.city || addr.town || addr.village || addr.county || '';
        const state  = (addr.state || '').replace(/\s*область$/i, ' обл.').trim();
        // Улица/район → поле address; город+область → location
        const streetParts = [road, nbhd].filter(Boolean);
        if (streetParts.length) set('address', streetParts.join(', '));
        const cityParts = [city, state].filter(Boolean);
        if (cityParts.length) set('location', cityParts.join(', '));
      })
      .catch(() => {})
      .finally(() => setIsGeocoding(false));
    return () => controller.abort();
  }, [markerPos]);

  useEffect(() => {
    pushDataLayer('add_listing_open');
    return () => { photoPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, j) => j !== i));
    setPhotoPreviews(prev => { URL.revokeObjectURL(prev[i]); return prev.filter((_, j) => j !== i); });
  };

  const movePhoto = (from: number, to: number) => {
    if (from === to) return;
    const reorder = <T,>(arr: T[]) => {
      const next = [...arr];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    };
    setPhotos(prev => reorder(prev));
    setPhotoPreviews(prev => reorder(prev));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fd.area || Number(fd.area) <= 0) e.area = 'Укажите площадь';
    if (!fd.price || rawPrice(fd.price) <= 0) e.price = 'Укажите цену';
    if (!fd.phone.trim()) e.phone = 'Укажите телефон';
    if (photos.length === 0) e.photos = 'Добавьте хотя бы одно фото';
    return e;
  };

  const submit = async (status: 'draft' | 'published') => {
    pushDataLayer('add_listing_submit_attempt');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      pushDataLayer('add_listing_submit_error', { form: 'add_listing' });
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const mediaIds: string[] = [];
      for (const file of photos) {
        const form = new FormData();
        form.append('file', file);
        const r = await fetch('/api/media', { method: 'POST', body: form });
        if (r.ok) { const d = await r.json(); mediaIds.push(d.doc.id); }
      }
      const body = {
        title: autoTitle || 'Участок',
        listingCategory: 'land',
        dealType: fd.dealType,
        landType: fd.landType || 'ИЖС',
        area: Number(fd.area),
        price: rawPrice(fd.price),
        location: fd.location || 'Казахстан',
        address: fd.address || undefined,
        locationType: fd.locationType.length ? fd.locationType : undefined,
        hasElectricity: fd.hasElectricity, hasGas: fd.hasGas,
        hasWater: fd.hasWater, hasSewer: fd.hasSewer, hasRoadAccess: fd.hasRoadAccess,
        hasStateAct: fd.hasStateAct, isPledged: fd.isPledged,
        isDivisible: fd.isDivisible, isOnRedLine: fd.isOnRedLine,
        hasEncumbrances: fd.hasEncumbrances,
        canChangePurpose: fd.canChangePurpose,
        ownershipType: fd.ownershipType || undefined,
        purpose: fd.purpose || undefined,
        landCategory: fd.landCategory || undefined,
        cadastralNumber: fd.cadastralNumber || undefined,
        reliefType: fd.reliefType || undefined,
        plotShape: fd.plotShape || undefined,
        plotBoundary: plotBoundary ? JSON.stringify(plotBoundary) : undefined,
        description: fd.description || undefined,
        seller: user?.id || undefined,
        sellerName: fd.name, sellerPhone: fd.phone, sellerHasWhatsApp: fd.hasWhatsApp,
        sellerIsAgency: user?.isAgency ?? false,
        lat: markerPos?.lat, lng: markerPos?.lng,
        status,
        images: mediaIds.map(id => ({ image: id })),
      };
      const r = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.errors?.[0]?.message ?? 'Ошибка сервера');
      }
      pushDataLayer('add_listing_submit_success', { form: 'add_listing', status });
      setIsSubmitted(true);
      let c = 5;
      const timer = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) { clearInterval(timer); router.push('/profile'); }
      }, 1000);
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Ошибка при отправке. Попробуйте ещё раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const boolVals: Record<string, boolean> = {
    hasElectricity: fd.hasElectricity, hasGas: fd.hasGas, hasWater: fd.hasWater,
    hasSewer: fd.hasSewer, hasRoadAccess: fd.hasRoadAccess,
    isPledged: fd.isPledged, isOnRedLine: fd.isOnRedLine, isDivisible: fd.isDivisible,
  };

  const inputCls = (err?: string) =>
    `w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${err ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`;

  const SectionHead = ({ n, title, hint }: { n: number; title: string; hint?: string }) => (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-black text-white">{n}</span>
      </div>
      <div>
        <h2 className="text-base font-bold text-zinc-900 leading-snug">{title}</h2>
        {hint && <p className="text-xs text-zinc-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );

  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
        active
          ? 'bg-primary border-primary text-white shadow-sm'
          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="py-8 pb-28">
        <Container>

          <div className="max-w-2xl mx-auto mb-7">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors mb-5">
              <ChevronLeft className="size-4" />
              Личный кабинет
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Новое объявление</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Земельный участок · Казахстан</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); submit('draft'); }} className="max-w-2xl mx-auto space-y-3">

            {/* ── 1. Основное ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-5">
              <SectionHead n={1} title="Основная информация" />

              {/* Тип сделки — сегментированный контрол */}
              <div className="flex rounded-2xl bg-zinc-100 p-1 gap-1">
                {(['sale', 'rent'] as const).map(dt => (
                  <button key={dt} type="button" onClick={() => set('dealType', dt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      fd.dealType === dt
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}>
                    {dt === 'sale' ? 'Продажа' : 'Сдать в аренду'}
                  </button>
                ))}
              </div>

              {/* Тип участка */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Тип участка <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LAND_CATEGORIES.map(cat => (
                    <Pill key={cat} label={cat}
                      active={fd.landType === cat}
                      onClick={() => set('landType', fd.landType === cat ? '' : cat)} />
                  ))}
                </div>
              </div>

              {/* Площадь + Цена */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Площадь <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type="number" min="1" placeholder="6"
                      value={fd.area} onChange={e => set('area', e.target.value)}
                      data-error={errors.area ? 'true' : undefined}
                      className={inputCls(errors.area)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">сот.</span>
                  </div>
                  {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    {fd.dealType === 'rent' ? 'Аренда / мес.' : 'Цена'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input type="text" inputMode="numeric"
                      placeholder={fd.dealType === 'rent' ? '150 000' : '15 000 000'}
                      value={fd.price} onChange={e => set('price', fmtPrice(e.target.value))}
                      className={inputCls(errors.price)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                      {fd.dealType === 'rent' ? '₸/мес' : '₸'}
                    </span>
                  </div>
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                </div>
              </div>

              {autoTitle && (
                <p className="text-xs text-zinc-400">
                  Заголовок: <span className="font-semibold text-zinc-600">{autoTitle}</span>
                </p>
              )}
            </section>

            {/* ── 2. Фото ───────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead n={2} title="Фото и видео" hint="Фото и видео увеличивают просмотры в 3–5 раз" />

              {/* Подсказки форматов */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-primary/20 bg-primary-soft p-3 flex gap-2.5 items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary mt-0.5 shrink-0"><rect x="2" y="6" width="15" height="12" rx="2"/><path d="m17 9 5-3v12l-5-3V9Z"/></svg>
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Видео 9:16</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">как Reels · MP4/MOV · до 200 МБ</p>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex gap-2.5 items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 mt-0.5 shrink-0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Фото</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">JPG · PNG · до 50 МБ</p>
                  </div>
                </div>
              </div>

              {photoPreviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-zinc-400">Перетащите чтобы изменить порядок · первое — обложка</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photoPreviews.map((src, i) => {
                      const isVid = photos[i]?.type.startsWith('video/');
                      return (
                        <div key={i} draggable
                          onDragStart={() => setDragIndex(i)}
                          onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                          onDrop={e => { e.preventDefault(); if (dragIndex !== null) movePhoto(dragIndex, i); setDragIndex(null); setDragOver(null); }}
                          onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                          className={`relative aspect-square rounded-xl overflow-hidden bg-zinc-100 group cursor-grab transition-all ${dragOver === i && dragIndex !== i ? 'ring-2 ring-primary' : ''} ${dragIndex === i ? 'opacity-40' : ''}`}>
                          {i === 0 && <div className="absolute top-1 left-1 z-10 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">1</div>}
                          {isVid ? (
                            <>
                              <video src={src} className="w-full h-full object-cover" muted playsInline />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <img src={src} alt="" className="w-full h-full object-cover" />
                          )}
                          <button type="button" onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <label data-error={errors.photos ? 'true' : undefined} className={`flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all group ${
                errors.photos ? 'border-red-300 bg-red-50' : 'border-zinc-200 bg-zinc-50 hover:border-primary/40 hover:bg-primary-soft/30'
              } ${photoPreviews.length > 0 ? 'h-20' : 'h-36'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`mb-1.5 text-zinc-400 group-hover:text-primary transition-colors ${photoPreviews.length > 0 ? 'w-5 h-5' : 'w-7 h-7'}`}>
                  <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-zinc-500 group-hover:text-primary transition-colors">
                  {photos.length > 0 ? 'Добавить ещё' : 'Загрузить фото или видео'}
                </span>
                {photos.length === 0 && <span className="text-xs text-zinc-400 mt-0.5">JPG, PNG, MP4, MOV · до 200 МБ</span>}
                <input ref={fileInputRef} type="file" className="hidden" multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handlePhotoChange} />
              </label>
              {errors.photos && <p className="text-xs text-red-500">{errors.photos}</p>}
            </section>

            {/* ── 3. Расположение ───────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead n={3} title="Расположение" />

              <LocationPicker
                value={markerPos} onChange={setMarkerPos}
                boundary={plotBoundary} onBoundaryChange={setPlotBoundary}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Город</label>
                  <div className="relative">
                    <input type="text" list="kz-cities" placeholder="Алматы, Каскелен..."
                      value={fd.location} onChange={e => set('location', e.target.value)}
                      className={inputCls()} />
                    {isGeocoding && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-primary animate-pulse">Определяем...</span>}
                  </div>
                  <datalist id="kz-cities">{KZ_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Адрес / ориентир</label>
                  <input type="text" placeholder="вдоль трассы БАК..."
                    value={fd.address} onChange={e => set('address', e.target.value)}
                    className={inputCls()} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Окружение</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_TYPES.map(({ value, label }) => (
                    <Pill key={value} label={label}
                      active={fd.locationType.includes(value)}
                      onClick={() => toggleLocationType(value)} />
                  ))}
                </div>
              </div>
            </section>

            {/* ── 4. Характеристики ─────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-5">
              <SectionHead n={4} title="Характеристики участка" />

              {/* Коммуникации */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Коммуникации</label>
                <div className="flex flex-wrap gap-2">
                  {UTILITIES.map(({ key, icon: Icon, label, active }) => (
                    <button key={key} type="button" onClick={() => toggle(key as keyof typeof fd)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                        boolVals[key] ? active : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                      }`}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 space-y-4">
                {/* Право собственности */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Право собственности</label>
                  <div className="flex gap-2 flex-wrap">
                    <Pill label="Частная собственность"
                      active={fd.ownershipType === 'Частная собственность'}
                      onClick={() => set('ownershipType', fd.ownershipType === 'Частная собственность' ? '' : 'Частная собственность')} />
                    <Pill label="Гос. аренда"
                      active={fd.ownershipType === 'Аренда'}
                      onClick={() => set('ownershipType', fd.ownershipType === 'Аренда' ? '' : 'Аренда')} />
                  </div>
                </div>

                {/* Геометрия */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Геометрия</label>
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Рельеф</p>
                    <div className="flex gap-2">
                      {RELIEF_TYPES.map(r => (
                        <button key={r} type="button" onClick={() => set('reliefType', fd.reliefType === r ? '' : r)}
                          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            fd.reliefType === r ? 'bg-primary border-primary text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Форма участка</p>
                    <div className="flex flex-wrap gap-2">
                      {PLOT_SHAPES.map(s => (
                        <Pill key={s} label={s}
                          active={fd.plotShape === s}
                          onClick={() => set('plotShape', fd.plotShape === s ? '' : s)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 5. Документы ──────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead n={5} title="Юридические данные" />

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => toggle('hasStateAct')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                    fd.hasStateAct ? 'bg-primary-soft border-primary/30 text-primary' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Гос. акт
                </button>
                {LEGAL_FILTERS.map(({ key, icon: Icon, label, active }) => (
                  <button key={key} type="button" onClick={() => toggle(key as keyof typeof fd)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                      boolVals[key] ? active : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => toggle('hasEncumbrances')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                    fd.hasEncumbrances ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}>
                  Обременения
                </button>
                <button type="button" onClick={() => toggle('canChangePurpose')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                    fd.canChangePurpose ? 'bg-sky-50 border-sky-300 text-sky-700' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}>
                  Смена назначения
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Кадастровый номер</label>
                <input type="text" placeholder="20-315-094-111"
                  value={fd.cadastralNumber} onChange={e => set('cadastralNumber', e.target.value)}
                  className={inputCls()} />
              </div>
            </section>

            {/* ── 6. Описание ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-3">
              <div className="flex items-start justify-between">
                <SectionHead n={6} title="Описание" hint="Необязательно, но помогает покупателям" />
                <span className="text-xs text-zinc-400 mt-1">{fd.description.length}/2000</span>
              </div>
              <textarea rows={4} maxLength={2000}
                placeholder="Плюсы участка, особенности, история продажи, что рядом..."
                value={fd.description} onChange={e => set('description', e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:text-zinc-400 resize-none transition-all" />
            </section>

            {/* ── 7. Контакты ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead n={7} title="Ваши контакты" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Имя</label>
                  <input type="text" placeholder="Как к вам обращаться"
                    value={fd.name} onChange={e => set('name', e.target.value)}
                    className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Телефон <span className="text-red-400">*</span></label>
                  <input type="tel" placeholder="+7 700 000 00 00"
                    value={fd.phone} onChange={e => set('phone', e.target.value)}
                    data-error={errors.phone ? 'true' : undefined}
                    className={inputCls(errors.phone)} />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                <div onClick={() => toggle('hasWhatsApp')}
                  className={`relative w-10 h-6 rounded-full transition-colors ${fd.hasWhatsApp ? 'bg-[#25D366]' : 'bg-zinc-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fd.hasWhatsApp ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-zinc-600">Есть WhatsApp на этом номере</span>
              </label>
            </section>

            {/* ── Кнопки ────────────────────────────────────────────────────── */}
            {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}
            {isSubmitted ? (
              <div className="rounded-2xl bg-primary-soft border border-primary/20 px-6 py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="font-bold text-zinc-900 text-base">Объявление отправлено на проверку</p>
                <p className="text-sm text-zinc-500">Публикация в течение 24 часов</p>
                <p className="text-xs text-zinc-400 pt-1">Переход в личный кабинет через {countdown} сек...</p>
                <button type="button" onClick={() => router.push('/profile')}
                  className="mt-2 text-sm font-semibold text-primary hover:underline">
                  Перейти сейчас →
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => submit('draft')} disabled={isSubmitting}
                  className="sm:w-auto rounded-2xl border border-zinc-200 px-6 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50">
                  Сохранить черновик
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:pointer-events-none">
                  {isSubmitting ? 'Отправка...' : 'Опубликовать'}
                </button>
              </div>
            )}

          </form>
        </Container>
      </div>
    </div>
  );
}
