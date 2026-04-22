'use client';

import { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { pushDataLayer } from '@/lib/analytics';
import { LAND_CATEGORIES, UTILITIES, LEGAL_FILTERS } from '@/lib/listing-constants';

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
const KZ_BOUNDS: [[number, number], [number, number]] = [[40.5, 50.3], [55.5, 87.3]];

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

// ── Пикер точки на карте (ограничен Казахстаном) ────────────────────────────
function LocationPicker({ value, onChange }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number } | null) => void;
}) {
  const mapEl   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinRef  = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadLeaflet().then(() => setReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || mapRef.current || !window.L) return;
    if ((mapEl.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;
    const L = window.L;
    const map = L.map(mapEl.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      maxBounds: KZ_BOUNDS,
      maxBoundsViscosity: 0.85,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    map.setView(KZ_CENTER, 5);
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (!value) { pinRef.current?.remove(); pinRef.current = null; return; }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:20px;height:20px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconAnchor: [10, 10],
    });
    if (pinRef.current) {
      pinRef.current.setLatLng([value.lat, value.lng]);
    } else {
      pinRef.current = L.marker([value.lat, value.lng], { icon }).addTo(mapRef.current);
    }
  }, [value, ready]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10 text-[12px] font-semibold text-zinc-400">
            Загрузка карты...
          </div>
        )}
        <div ref={mapEl} style={{ height: 280 }} />
        {ready && !value && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-[999]">
            <span className="bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
              Нажмите на карту чтобы указать точку
            </span>
          </div>
        )}
      </div>
      {value && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[12px] font-medium text-zinc-500">
            {value.lat}, {value.lng}
          </span>
          <button type="button" onClick={() => onChange(null)}
            className="text-[12px] font-bold text-red-400 hover:text-red-600 transition-colors">
            Убрать точку
          </button>
        </div>
      )}
    </div>
  );
}

// ── Константы ────────────────────────────────────────────────────────────────
const LOC_TYPES = [
  { value: 'city',      label: 'В городе' },
  { value: 'suburb',    label: 'В пригороде' },
  { value: 'highway',   label: 'Вдоль трассы' },
  { value: 'water',     label: 'Возле водоёма' },
  { value: 'foothills', label: 'В предгорьях' },
  { value: 'dacha',     label: 'В дачном массиве' },
];

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

// ── Главный компонент ────────────────────────────────────────────────────────
export default function AddListingPage() {
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [photos, setPhotos]             = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [markerPos, setMarkerPos]       = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [locationType, setLocationType] = useState<string[]>([]);
  const [fd, setFd] = useState({
    landType: '', area: '', price: '', isNegotiable: false,
    location: '',
    address: '',
    hasElectricity: false, hasGas: false, hasWater: false, hasSewer: false, hasRoadAccess: false,
    hasStateAct: true, isPledged: false, isDivisible: false, isOnRedLine: false,
    reliefType: '', cadastralNumber: '',
    description: '',
    name: '', phone: '', hasWhatsApp: false,
  });

  const set = (k: keyof typeof fd, v: string | boolean) =>
    setFd(prev => ({ ...prev, [k]: v }));

  const toggle = (k: keyof typeof fd) =>
    setFd(prev => ({ ...prev, [k]: !prev[k] }));

  const toggleLocType = (v: string) =>
    setLocationType(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

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
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
        const state = (addr.state || '').replace(/\s*область$/i, ' обл.').trim();
        const parts = [city, state].filter(Boolean);
        if (parts.length) set('location', parts.join(', '));
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
        landType: fd.landType || 'ИЖС',
        isNegotiable: fd.isNegotiable,
        locationType: locationType.length ? locationType : undefined,
        area: Number(fd.area),
        price: rawPrice(fd.price),
        location: fd.location || 'Казахстан',
        address: fd.address || undefined,
        cadastralNumber: fd.cadastralNumber || undefined,
        reliefType: fd.reliefType || undefined,
        hasElectricity: fd.hasElectricity, hasGas: fd.hasGas,
        hasWater: fd.hasWater, hasSewer: fd.hasSewer, hasRoadAccess: fd.hasRoadAccess,
        hasStateAct: fd.hasStateAct, isPledged: fd.isPledged,
        isDivisible: fd.isDivisible, isOnRedLine: fd.isOnRedLine,
        description: fd.description || undefined,
        sellerName: fd.name, sellerPhone: fd.phone, sellerHasWhatsApp: fd.hasWhatsApp,
        lat: markerPos?.lat, lng: markerPos?.lng,
        status,
        images: mediaIds.map(id => ({ image: id })),
      };
      const r = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.errors?.[0]?.message ?? 'Ошибка сервера');
      }
      pushDataLayer('add_listing_submit_success', { form: 'add_listing', status });
      setIsSubmitted(true);
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      <div className="py-10 lg:py-16 pb-32">
        <Container>

          <div className="mb-8 max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Назад
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Подать объявление</h1>
            <p className="mt-3 text-lg font-medium text-zinc-500">Заполните детали, чтобы покупатели могли быстро вас найти.</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); submit('draft'); }} className="max-w-3xl mx-auto space-y-6">

            {/* ── 1. Основная информация ─────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900">Основная информация</h2>
                {autoTitle && (
                  <p className="mt-2 text-[13px] font-medium text-zinc-400">
                    Заголовок объявления: <span className="font-bold text-zinc-700">{autoTitle}</span>
                  </p>
                )}
              </div>

              {/* Тип участка */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-3">Тип участка <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {LAND_CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => set('landType', fd.landType === cat ? '' : cat)}
                      className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${fd.landType === cat ? 'bg-primary border-primary text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Площадь + Цена */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Площадь, сот. <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" min="1" placeholder="Например: 6"
                      value={fd.area} onChange={e => set('area', e.target.value)}
                      className={inputCls(errors.area)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none">сот.</span>
                  </div>
                  {errors.area && <p className="mt-1 text-sm font-medium text-red-500">{errors.area}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Цена <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" placeholder="15 000 000"
                      value={fd.price}
                      onChange={e => set('price', fmtPrice(e.target.value))}
                      className={inputCls(errors.price)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none">₸</span>
                  </div>
                  {errors.price && <p className="mt-1 text-sm font-medium text-red-500">{errors.price}</p>}
                  <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none w-fit">
                    <div onClick={() => toggle('isNegotiable')}
                      className={`relative w-10 h-6 rounded-full transition-colors ${fd.isNegotiable ? 'bg-primary' : 'bg-zinc-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fd.isNegotiable ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-600">Торг уместен</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ── 2. Фото и видео ────────────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900">Фото и видео <span className="text-red-500">*</span></h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">Объявления с фото получают в 5× больше откликов.</p>
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 items-start">
                  {photoPreviews.map((src, i) => {
                    const isVid = photos[i]?.type.startsWith('video/');
                    return (
                      <div key={i} className={`relative rounded-2xl overflow-hidden bg-zinc-100 group ${isVid ? 'aspect-[9/16]' : 'aspect-square'}`}>
                        {isVid ? (
                          <>
                            <video src={src} className="w-full h-full object-cover" muted playsInline />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        )}
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <label className={`flex flex-col items-center justify-center w-full h-36 rounded-3xl border-2 border-dashed bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors group ${errors.photos ? 'border-red-400' : 'border-zinc-300 hover:border-primary/50'}`}>
                <div className="h-11 w-11 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary"><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/></svg>
                </div>
                <span className="text-sm font-bold text-zinc-700">{photos.length > 0 ? 'Добавить ещё' : 'Нажмите или перетащите файлы'}</span>
                <span className="text-xs font-semibold text-zinc-400 mt-1">Фото JPG/PNG · Видео MP4/MOV до 200 МБ</span>
                <input ref={fileInputRef} type="file" className="hidden" multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handlePhotoChange} />
              </label>
              {errors.photos && <p className="text-sm font-medium text-red-500">{errors.photos}</p>}
            </section>

            {/* ── 3. Расположение ────────────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
              <h2 className="text-xl font-extrabold text-zinc-900">Расположение</h2>

              {/* Единое поле города с KZ автодополнением */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Город / Населённый пункт
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="kz-cities"
                    placeholder="Например: Алматы, Каскелен, Талдыкорган..."
                    value={fd.location}
                    onChange={e => set('location', e.target.value)}
                    className={inputCls(errors.location)}
                  />
                  {isGeocoding && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary animate-pulse">
                      Определяем...
                    </span>
                  )}
                </div>
                <datalist id="kz-cities">
                  {KZ_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
                {errors.location && <p className="mt-1 text-sm font-medium text-red-500">{errors.location}</p>}
              </div>

              {/* Адрес */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Адрес или ориентир</label>
                <input type="text" placeholder="Например: вдоль трассы БАК, поворот направо"
                  value={fd.address} onChange={e => set('address', e.target.value)}
                  className={inputCls()} />
              </div>

              {/* Тип местоположения */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-3">Тип местоположения</label>
                <div className="flex flex-wrap gap-2">
                  {LOC_TYPES.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => toggleLocType(value)}
                      className={`px-3.5 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${locationType.includes(value) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Карта — только Казахстан, клик ставит точку и заполняет город */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Точка на карте</label>
                <p className="text-[12px] font-medium text-zinc-400 mb-2">
                  Нажмите на карте — город заполнится автоматически
                </p>
                <LocationPicker value={markerPos} onChange={setMarkerPos} />
              </div>
            </section>

            {/* ── 4. Коммуникации ────────────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
              <h2 className="text-xl font-extrabold text-zinc-900">Коммуникации</h2>
              <div className="flex flex-wrap gap-2">
                {UTILITIES.map(({ key, icon: Icon, label, active }) => (
                  <button key={key} type="button" onClick={() => toggle(key as keyof typeof fd)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${boolVals[key] ? active : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-white'}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── 5. Юридические данные ──────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
              <h2 className="text-xl font-extrabold text-zinc-900">Юридические данные</h2>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">Юридическая чистота</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggle('hasStateAct')}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${fd.hasStateAct ? 'border-green-300 bg-green-50 text-green-700' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Гос. акт
                  </button>
                  {LEGAL_FILTERS.map(({ key, icon: Icon, label, active }) => (
                    <button key={key} type="button" onClick={() => toggle(key as keyof typeof fd)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${boolVals[key] ? active : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-white'}`}>
                      <Icon className="w-4 h-4" strokeWidth={2.5} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Кадастровый номер</label>
                  <input type="text" placeholder="20-315-094-111"
                    value={fd.cadastralNumber} onChange={e => set('cadastralNumber', e.target.value)}
                    className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Рельеф</label>
                  <div className="flex gap-2">
                    {RELIEF_TYPES.map(r => (
                      <button key={r} type="button" onClick={() => set('reliefType', fd.reliefType === r ? '' : r)}
                        className={`flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all ${fd.reliefType === r ? 'bg-primary border-primary text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 6. Описание ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-extrabold text-zinc-900">Описание</h2>
                <span className="text-xs font-bold text-zinc-400">{fd.description.length} / 2000</span>
              </div>
              <textarea rows={4} maxLength={2000}
                placeholder="Расскажите подробнее: форма участка, плюсы, документы..."
                value={fd.description} onChange={e => set('description', e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 resize-none" />
            </section>

            {/* ── 7. Контакты ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
              <h2 className="text-xl font-extrabold text-zinc-900">Ваши контакты</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Имя</label>
                  <input type="text" placeholder="Иван"
                    value={fd.name} onChange={e => set('name', e.target.value)}
                    className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Телефон <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="+7 (___) ___ __ __"
                    value={fd.phone} onChange={e => set('phone', e.target.value)}
                    className={inputCls(errors.phone)} />
                  {errors.phone && <p className="mt-1 text-sm font-medium text-red-500">{errors.phone}</p>}
                  <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none w-fit">
                    <div onClick={() => toggle('hasWhatsApp')}
                      className={`relative w-10 h-6 rounded-full transition-colors ${fd.hasWhatsApp ? 'bg-[#25D366]' : 'bg-zinc-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fd.hasWhatsApp ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-600">Есть WhatsApp на этом номере</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ── Кнопки ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-2 border-t border-zinc-200">
              {errors.submit && <p className="w-full text-sm font-medium text-red-500 text-center">{errors.submit}</p>}
              {isSubmitted ? (
                <div className="w-full rounded-2xl bg-green-50 border border-green-200 px-8 py-5 text-center">
                  <p className="font-extrabold text-green-700">Объявление отправлено на проверку</p>
                  <p className="text-sm font-medium text-green-600 mt-1">Мы свяжемся с вами в течение 24 часов</p>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => submit('draft')} disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-2xl border border-zinc-200 px-8 py-4 text-sm font-extrabold text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50">
                    Сохранить черновик
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-2xl bg-primary px-10 py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none">
                    {isSubmitting ? 'Отправка...' : 'Опубликовать'}
                  </button>
                </>
              )}
            </div>

          </form>
        </Container>
      </div>
    </div>
  );
}
