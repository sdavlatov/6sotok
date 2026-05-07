'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/container';
import { useRouter, useParams } from 'next/navigation';
import { pushDataLayer } from '@/lib/analytics';
import { LAND_CATEGORIES, UTILITIES, LEGAL_FILTERS } from '@/lib/listing-constants';
import { useAuth } from '@/context/auth-context';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const fmtPrice = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
};
const rawPrice = (v: string) => Number(v.replace(/\s/g, ''));

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const KZ_CENTER: [number, number] = [48.0, 68.0];
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

type LatLng = { lat: number; lng: number };

function LocationPicker({ value, onChange }: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { loadLeaflet().then(() => setReady(true)).catch(() => {}); }, []);

  useEffect(() => {
    if (!ready || !mapEl.current || mapRef.current || !window.L) return;
    if ((mapEl.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;
    const L = window.L;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = L.map(mapEl.current, {
      zoomControl: true, scrollWheelZoom: true,
      maxBounds: KZ_BOUNDS, maxBoundsViscosity: 1.0,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    map.fitBounds(KZ_BOUNDS);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (!value) { pinRef.current?.remove(); pinRef.current = null; return; }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#066F36;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
      iconAnchor: [9, 9],
    });
    if (pinRef.current) {
      pinRef.current.setLatLng([value.lat, value.lng]);
    } else {
      pinRef.current = L.marker([value.lat, value.lng], { icon }).addTo(mapRef.current);
      mapRef.current.setView([value.lat, value.lng], 13);
    }
  }, [value, ready]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200" style={{ isolation: 'isolate' }}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10 text-xs font-semibold text-zinc-400">
            Загрузка карты...
          </div>
        )}
        <div ref={mapEl} style={{ height: 240 }} />
        {ready && !value && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-[400]">
            <span className="bg-black/60 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              Нажмите чтобы переставить точку
            </span>
          </div>
        )}
      </div>
      {value && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{value.lat}, {value.lng}</span>
          <button type="button" onClick={() => onChange(null)}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            Убрать точку
          </button>
        </div>
      )}
    </div>
  );
}

const KZ_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау', 'Павлодар', 'Семей',
  'Қарағанды', 'Тараз', 'Өскемен', 'Актау', 'Уральск', 'Петропавловск',
  'Талдыкорган', 'Кызылорда', 'Туркестан', 'Кокшетау', 'Темиртау',
  'Экибастуз', 'Рудный', 'Жанаозен', 'Конаев', 'Степногорск', 'Балхаш',
  'Каскелен', 'Талгар', 'Есик', 'Капшагай', 'Щучинск', 'Боралдай',
];

const RELIEF_TYPES = ['Ровный', 'Под уклон'];
const LOCATION_TYPES = [
  { value: 'city', label: 'В городе' },
  { value: 'suburb', label: 'В пригороде' },
  { value: 'highway', label: 'Вдоль трассы' },
  { value: 'water', label: 'Возле водоёма' },
  { value: 'foothills', label: 'В предгорьях' },
  { value: 'dacha', label: 'В дачном массиве' },
] as const;
const PLOT_SHAPES = ['Прямоугольный', 'Квадратный', 'Г-образный', 'Трапеция', 'Нестандартный'] as const;

export default function EditListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(null);

  const [fd, setFd] = useState({
    dealType: 'sale' as 'sale' | 'rent',
    landType: '', area: '', price: '',
    location: '', address: '',
    locationType: [] as string[],
    hasElectricity: false, hasGas: false, hasWater: false, hasSewer: false, hasRoadAccess: false,
    hasStateAct: false, isPledged: false, isDivisible: false, isOnRedLine: false,
    hasEncumbrances: false, canChangePurpose: false,
    ownershipType: '', purpose: '',
    cadastralNumber: '',
    reliefType: '', plotShape: '',
    description: '',
    name: '', phone: '', hasWhatsApp: false,
    status: 'draft' as string,
  });

  // Загрузка существующего объявления
  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/listings/${listingId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (!data?.id) return;
        const comms = data.communications ?? [];
        const addr = data.address ?? '';
        setFd({
          dealType: data.dealType ?? 'sale',
          landType: data.landType ?? '',
          area: data.area ? String(data.area) : '',
          price: data.price ? fmtPrice(String(data.price)) : '',
          location: data.location ?? '',
          address: addr,
          locationType: data.locationType ?? [],
          hasElectricity: comms.includes('Свет') || !!data.hasElectricity,
          hasGas: comms.includes('Газ') || !!data.hasGas,
          hasWater: comms.includes('Вода') || !!data.hasWater,
          hasSewer: comms.includes('Канализация') || !!data.hasSewer,
          hasRoadAccess: comms.includes('Дорога') || !!data.hasRoadAccess,
          hasStateAct: !!data.hasStateAct,
          isPledged: !!data.isPledged,
          isDivisible: !!data.isDivisible,
          isOnRedLine: !!data.isOnRedLine,
          hasEncumbrances: !!data.hasEncumbrances,
          canChangePurpose: !!data.canChangePurpose,
          ownershipType: data.ownershipType ?? '',
          purpose: data.purpose ?? '',
          cadastralNumber: data.cadastralNumber ?? '',
          reliefType: data.reliefType ?? '',
          plotShape: data.plotShape ?? '',
          description: typeof data.description === 'string' ? data.description : '',
          name: data.sellerName ?? '',
          phone: data.sellerPhone ?? '',
          hasWhatsApp: !!data.sellerHasWhatsApp,
          status: data.status ?? 'draft',
        });
        if (data.lat && data.lng) setMarkerPos({ lat: data.lat, lng: data.lng });
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [listingId]);

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

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fd.area || Number(fd.area) <= 0) e.area = 'Укажите площадь';
    if (!fd.price || rawPrice(fd.price) <= 0) e.price = 'Укажите цену';
    if (!fd.phone.trim()) e.phone = 'Укажите телефон';
    return e;
  };

  const save = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        document.querySelector<HTMLElement>('[data-error="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const body = {
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
        hasEncumbrances: fd.hasEncumbrances, canChangePurpose: fd.canChangePurpose,
        ownershipType: fd.ownershipType || undefined,
        purpose: fd.purpose || undefined,
        cadastralNumber: fd.cadastralNumber || undefined,
        reliefType: fd.reliefType || undefined,
        plotShape: fd.plotShape || undefined,
        description: fd.description || undefined,
        sellerName: fd.name, sellerPhone: fd.phone,
        sellerHasWhatsApp: fd.hasWhatsApp,
        lat: markerPos?.lat, lng: markerPos?.lng,
      };
      const r = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Ошибка сервера');
      pushDataLayer('edit_listing_save');
      setIsSaved(true);
      setTimeout(() => router.push('/profile'), 1500);
    } catch {
      setErrors({ submit: 'Не удалось сохранить. Попробуйте ещё раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${err ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`;

  const SectionHead = ({ title, hint }: { title: string; hint?: string }) => (
    <div className="mb-5">
      <h2 className="text-base font-bold text-zinc-900 leading-snug">{title}</h2>
      {hint && <p className="text-xs text-zinc-400 mt-0.5">{hint}</p>}
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

  const boolVals: Record<string, boolean> = {
    hasElectricity: fd.hasElectricity, hasGas: fd.hasGas, hasWater: fd.hasWater,
    hasSewer: fd.hasSewer, hasRoadAccess: fd.hasRoadAccess,
    isPledged: fd.isPledged, isOnRedLine: fd.isOnRedLine, isDivisible: fd.isDivisible,
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="py-8 pb-28">
        <Container>
          <div className="max-w-2xl mx-auto mb-7">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors mb-5">
              <ChevronLeft className="size-4" />
              Личный кабинет
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">Редактировать объявление</h1>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {/* ── Основное ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-5">
              <SectionHead title="Основная информация" />

              <div className="flex rounded-2xl bg-zinc-100 p-1 gap-1">
                {(['sale', 'rent'] as const).map(dt => (
                  <button key={dt} type="button" onClick={() => set('dealType', dt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      fd.dealType === dt ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                    }`}>
                    {dt === 'sale' ? 'Продажа' : 'Сдать в аренду'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Тип участка</label>
                <div className="flex flex-wrap gap-2">
                  {LAND_CATEGORIES.map(cat => (
                    <Pill key={cat} label={cat} active={fd.landType === cat}
                      onClick={() => set('landType', fd.landType === cat ? '' : cat)} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Площадь <span className="text-red-400">*</span></label>
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Цена <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" placeholder="15 000 000"
                      value={fd.price} onChange={e => set('price', fmtPrice(e.target.value))}
                      data-error={errors.price ? 'true' : undefined}
                      className={inputCls(errors.price)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">₸</span>
                  </div>
                  {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                </div>
              </div>
            </section>

            {/* ── Расположение ───────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead title="Расположение" />
              <LocationPicker value={markerPos} onChange={setMarkerPos} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Город</label>
                  <input type="text" list="kz-cities-edit" placeholder="Алматы..."
                    value={fd.location} onChange={e => set('location', e.target.value)} className={inputCls()} />
                  <datalist id="kz-cities-edit">{KZ_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Адрес / ориентир</label>
                  <input type="text" placeholder="вдоль трассы..."
                    value={fd.address} onChange={e => set('address', e.target.value)} className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Окружение</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_TYPES.map(({ value, label }) => (
                    <Pill key={value} label={label} active={fd.locationType.includes(value)}
                      onClick={() => toggleLocationType(value)} />
                  ))}
                </div>
              </div>
            </section>

            {/* ── Характеристики ─────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-5">
              <SectionHead title="Характеристики участка" />
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
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Право собственности</label>
                  <div className="flex gap-2 flex-wrap">
                    <Pill label="Частная собственность" active={fd.ownershipType === 'Частная собственность'}
                      onClick={() => set('ownershipType', fd.ownershipType === 'Частная собственность' ? '' : 'Частная собственность')} />
                    <Pill label="Гос. аренда" active={fd.ownershipType === 'Аренда'}
                      onClick={() => set('ownershipType', fd.ownershipType === 'Аренда' ? '' : 'Аренда')} />
                  </div>
                </div>
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
                        <Pill key={s} label={s} active={fd.plotShape === s}
                          onClick={() => set('plotShape', fd.plotShape === s ? '' : s)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Юридика ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead title="Юридические данные" />
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

            {/* ── Описание ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-3">
              <div className="flex items-start justify-between">
                <SectionHead title="Описание" hint="Необязательно, но помогает покупателям" />
                <span className="text-xs text-zinc-400 mt-1">{fd.description.length}/2000</span>
              </div>
              <textarea rows={4} maxLength={2000}
                placeholder="Плюсы участка, особенности, история продажи..."
                value={fd.description} onChange={e => set('description', e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:text-zinc-400 resize-none transition-all" />
            </section>

            {/* ── Контакты ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-4">
              <SectionHead title="Ваши контакты" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Имя</label>
                  <input type="text" placeholder="Как к вам обращаться"
                    value={fd.name} onChange={e => set('name', e.target.value)} className={inputCls()} />
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

            {/* ── Статус ─────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-7 space-y-3">
              <SectionHead title="Статус объявления" />
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'published', 'sold'] as const).map(s => {
                  const labels = { draft: 'Черновик', published: 'Опубликовано', sold: 'Продано' };
                  const colors = {
                    draft: fd.status === s ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-500',
                    published: fd.status === s ? 'bg-primary border-primary text-white' : 'bg-white border-zinc-200 text-zinc-500',
                    sold: fd.status === s ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-zinc-200 text-zinc-500',
                  };
                  return (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${colors[s]} hover:border-zinc-300`}>
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-400">«Продано» сохраняет страницу в поиске Google, но убирает из каталога</p>
            </section>

            {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}

            {isSaved ? (
              <div className="rounded-2xl bg-primary-soft border border-primary/20 px-6 py-5 text-center">
                <p className="font-bold text-primary">Изменения сохранены ✓</p>
                <p className="text-sm text-zinc-500 mt-1">Возврат в личный кабинет...</p>
              </div>
            ) : (
              <button type="button" onClick={save} disabled={isSubmitting}
                className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:pointer-events-none">
                {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
