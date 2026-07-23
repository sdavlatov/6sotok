'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pushDataLayer } from '@/lib/analytics';
import { generateTitle } from '@/lib/listing-title';
import { useAuth } from '@/context/auth-context';
import { ChevronLeft, ChevronRight, Check, Bookmark, Play, Plane, Lock, Upload, Camera } from 'lucide-react';
import { MapEditor, type LatLng } from './map-editor';
import './submit.css';

/* ───────────────────────── утилиты ───────────────────────── */
export const fmtPrice = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
};
const rawPrice = (v: string) => Number(v.replace(/\s/g, ''));
const human = (n: number) => (isFinite(n) ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0');
const mln = (n: number) => {
  if (!isFinite(n) || n <= 0) return '—';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} млн`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} тыс`;
  return human(n);
};

/* ───────────────────────── справочники ───────────────────────── */
const PLOT_TYPES: { k: string; s: string }[] = [
  { k: 'ИЖС', s: 'жилое строительство' },
  { k: 'Дача', s: 'СНТ · ДСК' },
  { k: 'ЛПХ', s: 'личное хозяйство' },
  { k: 'КХ', s: 'крестьянское хоз-во' },
  { k: 'Коммерция', s: 'нежилое назнач.' },
  { k: 'Сельхоз', s: 'пашня · сенокос' },
  { k: 'Промбаза', s: 'склад · цех' },
  { k: 'Другое', s: 'свой вариант' },
];

const BIZ_CATEGORIES: { k: string; s: string; value: string }[] = [
  { k: 'Кафе / ресторан', s: 'питание', value: 'cafe' },
  { k: 'Розница', s: 'магазин · бутик', value: 'shop' },
  { k: 'Услуги', s: 'салон · сервис', value: 'service' },
  { k: 'Производство', s: 'цех · мини-завод', value: 'production' },
  { k: 'Склад / база', s: 'логистика', value: 'warehouse' },
  { k: 'Гостиница', s: 'отель · дом отдыха', value: 'hotel' },
  { k: 'Автобизнес', s: 'СТО · автомойка', value: 'service' },
  { k: 'Онлайн / IT', s: 'сайт · приложение', value: 'other' },
];

const KZ_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау', 'Павлодар', 'Семей', 'Караганда',
  'Тараз', 'Усть-Каменогорск', 'Актау', 'Уральск', 'Костанай', 'Кызылорда', 'Талдыкорган',
  'Каскелен', 'Талгар', 'Есик', 'Конаев', 'Туркестан', 'Кокшетау', 'Петропавловск',
];

/* Тумблеры участка → маппинг на поля бэкенда */
const LAND_TOGGLES: { key: string; label: string }[] = [
  { key: 'hasStateAct', label: 'Акт на землю' },
  { key: 'hasElectricity', label: 'Электричество' },
  { key: 'hasWater', label: 'Скважина / вода' },
  { key: 'hasGas', label: 'Газ' },
  { key: 'hasSewer', label: 'Канализация / септик' },
  { key: 'hasRoadAccess', label: 'Подъезд / дорога' },
  { key: 'isDivisible', label: 'Делимый участок' },
  { key: 'noEncumbrances', label: 'Без обременений' },
];

const BIZ_ASSETS: { key: string; label: string }[] = [
  { key: 'aEquip', label: 'Оборудование включено' },
  { key: 'aOnline', label: 'Сайт · соцсети · база клиентов' },
  { key: 'aTeam', label: 'Команда остаётся' },
  { key: 'aBrand', label: 'Бренд и торговая марка' },
  { key: 'aLease', label: 'Договор аренды (пролонгация)' },
  { key: 'aSuppliers', label: 'Поставщики (контракты)' },
];

const CHART = [44, 52, 58, 62, 60, 68, 72, 70, 75, 78, 84, 88];

/* ───────────────────────── мелкие UI-примитивы ───────────────────────── */
const Lab = ({ children }: { children: React.ReactNode }) => (
  <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-500">{children}</span>
);
const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{children}</span>
);

function Field({ label, value, onChange, placeholder, prefix, suffix, mono, type = 'text', inputMode, list }: {
  label?: string; value: string; onChange?: (v: string) => void; placeholder?: string;
  prefix?: string; suffix?: string; mono?: boolean; type?: string;
  inputMode?: 'text' | 'numeric' | 'decimal'; list?: string;
}) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      {label && <Lab>{label}</Lab>}
      <span className="flex h-12 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 transition-shadow focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_4px_rgba(6,111,54,0.1)]">
        {prefix && <span className={`shrink-0 text-sm font-semibold text-ink-400 ${mono ? 'mono' : ''}`}>{prefix}</span>}
        <input
          type={type} inputMode={inputMode} value={value} placeholder={placeholder} list={list}
          onChange={e => onChange?.(e.target.value)} readOnly={!onChange}
          className={`min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300 ${mono ? 'mono' : ''}`}
        />
        {suffix && <span className="mono shrink-0 text-[11.5px] font-medium text-ink-400">{suffix}</span>}
      </span>
    </label>
  );
}

const CityDatalist = () => (
  <datalist id="kz-cities">{KZ_CITIES.map(c => <option key={c} value={c} />)}</datalist>
);

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? 'border-[var(--brand)] bg-[var(--brand-50)]' : 'border-[var(--line)] bg-white hover:border-ink-300'}`}>
      <span className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${on ? 'bg-[var(--brand)]' : 'bg-zinc-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[14px]' : 'left-0.5'}`} />
      </span>
      <span className="flex-1 text-[13px] font-medium leading-tight text-ink-900">{label}</span>
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${active ? 'border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand-ink)]' : 'border-[var(--line)] bg-white text-ink-900 hover:border-ink-300'}`}>
      {active && <span className="flex size-3.5 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-black text-white">✓</span>}
      {label}
    </button>
  );
}

function Tile({ k, s, active, onClick }: { k: string; s: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`h-16 rounded-xl border px-3 py-2 text-left transition-colors ${active ? 'border-[1.5px] border-[var(--brand)] bg-[var(--brand-50)]' : 'border-[var(--line)] bg-white hover:border-ink-300'}`}>
      <div className={`text-[13.5px] font-extrabold leading-tight tracking-[-0.02em] ${active ? 'text-[var(--brand-ink)]' : 'text-ink-900'}`}>{k}</div>
      <div className={`mono mt-0.5 text-[9.5px] leading-tight ${active ? 'text-[var(--brand)]' : 'text-ink-400'}`}>{s}</div>
    </button>
  );
}

const H3 = ({ children, req }: { children: React.ReactNode; req?: boolean }) => (
  <div className="mb-3 flex items-baseline justify-between">
    <h3 className="text-[17px] font-extrabold tracking-[-0.035em] text-ink-900">{children}</h3>
    {req && <span className="mono text-[10px] uppercase tracking-[0.08em] text-ink-400">обязательно</span>}
  </div>
);

/* Зелёная плашка «сверено / бесплатно» */
const GreenNote = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(6,111,54,0.18)] bg-[rgba(6,111,54,0.06)] px-3.5 py-2.5">
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white"><Check className="size-3.5" strokeWidth={3} /></span>
    <div className="flex-1 text-[13px] leading-snug text-[var(--brand-ink)]">{children}</div>
  </div>
);

/* ───────────────────────── экран выбора типа ───────────────────────── */
function TypeChooser({ onPick }: { onPick: (e: 'land' | 'business') => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Tag>новое объявление</Tag>
      <h1 className="mt-3 text-3xl font-black leading-[1.05] tracking-[-0.05em] text-ink-900 sm:text-4xl">
        Что будете продавать?
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-500">
        Поля и проверки разные — выберите, чтобы мы не задавали лишнего.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Участок */}
        <button type="button" onClick={() => onPick('land')}
          className="group overflow-hidden rounded-3xl border-[1.5px] border-[var(--brand)] bg-[var(--brand-50)] text-left transition-shadow hover:shadow-lg">
          <div className="map-bg relative h-32">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 128" preserveAspectRatio="none">
              <polygon className="dash" points="80,34 230,22 300,60 250,104 120,110" fill="rgba(6,111,54,0.22)" stroke="#066F36" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            <span className="mono absolute right-3 top-3 rounded bg-[rgba(9,9,11,0.85)] px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">~3 мин</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-[-0.04em] text-[var(--brand-ink)]">Участок земли</h3>
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--brand)] text-white transition-transform group-hover:translate-x-0.5"><ChevronRight className="size-3.5" strokeWidth={3} /></span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-ink-700">
              ИЖС, дача, ЛПХ, коммерция или с/х. Контур на карте, сверка с кадастром.
            </p>
          </div>
        </button>

        {/* Бизнес */}
        <button type="button" onClick={() => onPick('business')}
          className="group overflow-hidden rounded-3xl border border-[var(--line)] bg-white text-left transition-shadow hover:shadow-lg">
          <div className="ph-biz noise relative h-32">
            <span className="mono absolute left-3 top-3 rounded bg-[rgba(9,9,11,0.85)] px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.06em] text-white">NDA</span>
            <span className="mono absolute right-3 top-3 rounded bg-[rgba(9,9,11,0.85)] px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.06em] text-white">~5 мин</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black tracking-[-0.04em] text-ink-900">Готовый бизнес</h3>
              <span className="flex size-6 items-center justify-center rounded-full bg-ink-900 text-white transition-transform group-hover:translate-x-0.5"><ChevronRight className="size-3.5" strokeWidth={3} /></span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-ink-500">
              Кафе, магазин, сервис, производство. Финансы под NDA, окупаемость и P&amp;L.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-6 text-center">
        <a href="tel:+77000000000" className="text-[13px] font-medium text-ink-500">
          Помощь с публикацией <span className="font-bold text-[var(--brand)]">· бесплатный звонок</span>
        </a>
      </div>
    </div>
  );
}

/* ───────────────────────── рельс шагов (десктоп) ───────────────────────── */
function StepRail({ steps, current, percent, minutes }: {
  steps: { t: string; s: string }[]; current: number; percent: number; minutes: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const done = i < current, now = i === current;
        return (
          <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${now ? 'bg-[var(--paper-2)]' : ''}`}>
            <span className={`mono flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${done ? 'bg-[var(--brand)] text-white' : now ? 'bg-ink-900 text-white' : 'border border-[var(--line)] bg-white text-ink-400'}`}>
              {done ? '✓' : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-[13px] font-bold tracking-[-0.02em] ${done || now ? 'text-ink-900' : 'text-ink-400'}`}>{s.t}</div>
              <div className="truncate text-[11px] text-ink-400">{s.s}</div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 rounded-xl bg-[var(--paper-2)] p-3.5">
        <Lab>заполнено</Lab>
        <div className="mt-1.5 text-2xl font-black tracking-[-0.04em] text-[var(--brand-ink)]">{percent}%</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2.5 text-[11px] leading-snug text-ink-500">~{minutes} мин до публикации.</p>
      </div>
    </div>
  );
}

/* Мобильный прогресс (шапка) */
function MobileProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1 lg:hidden">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-[3px] flex-1 rounded-full ${i <= step ? 'bg-[var(--brand)]' : 'bg-[var(--paper-3)]'}`} />
      ))}
    </div>
  );
}

/* Загрузка документов (локально к заявке — бэкенд-поля нет, прикладывается к модерации) */
function DocUploader() {
  const [docs, setDocs] = useState<File[]>([]);
  const dref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2.5">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-[var(--brand)] bg-gradient-to-b from-[var(--brand-50)] to-white px-5 py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand)] text-white"><Upload className="size-5" /></span>
        <div className="text-[15px] font-black tracking-[-0.02em] text-[var(--brand-ink)]">Перетащите файлы или выберите</div>
        <div className="max-w-sm text-[12px] leading-snug text-ink-500">Можно фото бумаги с телефона — выправим перспективу. До 20 МБ за файл.</div>
        <input ref={dref} type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.heic,.docx"
          onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) setDocs(p => [...p, ...f]); e.target.value = ''; }} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => dref.current?.click()} className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-left">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ink-900 text-white"><Camera className="size-4" /></span>
          <div className="flex-1"><div className="text-[13px] font-bold text-ink-900">Сфотографировать</div><div className="text-[11px] text-ink-500">камера телефона</div></div>
        </button>
        <button type="button" onClick={() => dref.current?.click()} className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-left">
          <span className="mono flex size-8 items-center justify-center rounded-lg bg-[#003B7A] text-[11px] font-black text-white">eG</span>
          <div className="flex-1"><div className="text-[13px] font-bold text-ink-900">Из eGov.kz</div><div className="text-[11px] text-ink-500">выписка по ИИН</div></div>
        </button>
      </div>
      {docs.length > 0 && (
        <div className="flex flex-col gap-2">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5">
              <span className="mono flex h-11 w-9 items-center justify-center rounded border border-[var(--line)] text-[9px] font-black text-[var(--brand)]">{(d.name.split('.').pop() || 'DOC').slice(0, 4).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink-900">{d.name}</div>
                <div className="mono flex items-center gap-1.5 text-[10.5px] text-ink-500"><Lock className="size-3" /> {(d.size / 1024 / 1024).toFixed(1)} МБ · защищено NDA</div>
              </div>
              <button type="button" onClick={() => setDocs(p => p.filter((_, j) => j !== i))} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>
          ))}
          <p className="mono text-[10.5px] text-ink-400">Документы прикладываются к заявке — модератор проверит перед публикацией.</p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── главный компонент ───────────────────────── */
export type LandForm = {
  dealType: 'sale' | 'rent';
  landType: string; area: string; price: string; priceUsd: boolean; mortgage: boolean;
  location: string; address: string; cadastralNumber: string;
  hasStateAct: boolean; hasElectricity: boolean; hasWater: boolean; hasGas: boolean;
  hasSewer: boolean; hasRoadAccess: boolean; isDivisible: boolean; noEncumbrances: boolean;
  canChangePurpose: boolean; description: string;
  name: string; phone: string; wantCall: boolean; wantWhatsApp: boolean;
};
export type BizForm = {
  category: string; name: string; age: string; legalForm: string; employees: string;
  location: string; address: string; buildingArea: string; rent: string; floor: string;
  revenue: string; profit: string; price: string; hideUntilNda: boolean;
  aEquip: boolean; aOnline: boolean; aTeam: boolean; aBrand: boolean; aLease: boolean; aSuppliers: boolean;
  description: string; name2: string; phone: string; wantCall: boolean; wantWhatsApp: boolean;
};
export type ExistingImage = { id: string; url: string; video?: boolean };

export interface ListingWizardInit {
  entity: 'land' | 'business';
  fd?: Partial<LandForm>;
  bd?: Partial<BizForm>;
  boundary?: LatLng[] | null;
  marker?: LatLng | null;
  images?: ExistingImage[];
}

const LAND_DEFAULTS: LandForm = {
  dealType: 'sale',
  landType: '', area: '', price: '', priceUsd: false, mortgage: false,
  location: '', address: '', cadastralNumber: '',
  hasStateAct: false, hasElectricity: false, hasWater: false, hasGas: false,
  hasSewer: false, hasRoadAccess: false, isDivisible: false, noEncumbrances: false,
  canChangePurpose: false, description: '',
  name: '', phone: '', wantCall: true, wantWhatsApp: true,
};
const BIZ_DEFAULTS: BizForm = {
  category: '', name: '', age: '', legalForm: '', employees: '',
  location: '', address: '', buildingArea: '', rent: '', floor: '',
  revenue: '', profit: '', price: '', hideUntilNda: true,
  aEquip: false, aOnline: false, aTeam: false, aBrand: false, aLease: false, aSuppliers: false,
  description: '', name2: '', phone: '', wantCall: true, wantWhatsApp: true,
};

export default function AddListingPage() {
  return <ListingWizard mode="create" />;
}

export function ListingWizard({ mode = 'create', listingId, init }: { mode?: 'create' | 'edit'; listingId?: string; init?: ListingWizardInit }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isEdit = mode === 'edit';
  const nextParam = isEdit && listingId ? `/edit-listing/${listingId}` : '/add-listing';

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${nextParam}`);
  }, [loading, user, router, nextParam]);

  const [entity, setEntity] = useState<'land' | 'business' | null>(init?.entity ?? null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(init?.images ?? []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [markerPos, setMarkerPos] = useState<LatLng | null>(init?.marker ?? null);
  const [boundary, setBoundary] = useState<LatLng[] | null>(init?.boundary ?? null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Данные участка
  const [fd, setFd] = useState<LandForm>({ ...LAND_DEFAULTS, ...(init?.fd ?? {}) });
  // Данные бизнеса
  const [bd, setBd] = useState<BizForm>({ ...BIZ_DEFAULTS, ...(init?.bd ?? {}) });

  useEffect(() => {
    if (user) {
      setFd(p => ({ ...p, name: p.name || user.name || '', phone: p.phone || user.phone || '' }));
      setBd(p => ({ ...p, name2: p.name2 || user.name || '', phone: p.phone || user.phone || '' }));
    }
  }, [user]);

  useEffect(() => { pushDataLayer('add_listing_open'); }, []);
  useEffect(() => () => { photoPreviews.forEach(u => URL.revokeObjectURL(u)); }, [photoPreviews]);

  const setL = (k: keyof typeof fd, v: string | boolean) => setFd(p => ({ ...p, [k]: v }));
  const setB = (k: keyof typeof bd, v: string | boolean) => setBd(p => ({ ...p, [k]: v }));

  // Обратное геокодирование при постановке точки (участок)
  useEffect(() => {
    if (!markerPos) return;
    const ctrl = new AbortController();
    setIsGeocoding(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${markerPos.lat}&lon=${markerPos.lng}&format=json&accept-language=ru`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        const a = data.address ?? {};
        const road = a.road || a.residential || a.pedestrian || '';
        const nbhd = a.neighbourhood || a.suburb || a.city_district || '';
        const city = a.city || a.town || a.village || a.county || '';
        const state = (a.state || '').replace(/\s*область$/i, ' обл.').trim();
        const street = [road, nbhd].filter(Boolean).join(', ');
        const loc = [city, state].filter(Boolean).join(', ');
        if (street) setL('address', street);
        if (loc) setL('location', loc);
      })
      .catch(() => {})
      .finally(() => setIsGeocoding(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerPos]);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotos(p => [...p, ...files]);
    setPhotoPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };
  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, j) => j !== i));
    setPhotoPreviews(p => { URL.revokeObjectURL(p[i]); return p.filter((_, j) => j !== i); });
  };
  const removeExisting = (i: number) => setExistingImages(p => p.filter((_, j) => j !== i));
  const movePhoto = (from: number, to: number) => {
    if (from === to) return;
    const re = <T,>(arr: T[]) => { const n = [...arr]; const [it] = n.splice(from, 1); n.splice(to, 0, it); return n; };
    setPhotos(re); setPhotoPreviews(re);
  };

  // ── деривативы ──
  const landAutoTitle = generateTitle({
    landType: fd.landType, area: fd.area ? Number(fd.area) : undefined,
    hasStateAct: fd.hasStateAct, hasElectricity: fd.hasElectricity, hasWater: fd.hasWater, hasGas: fd.hasGas,
  });
  const landPerSotka = fd.area && fd.price ? rawPrice(fd.price) / Number(fd.area) : 0;
  const bizMargin = bd.revenue && bd.profit ? (rawPrice(bd.profit) / rawPrice(bd.revenue)) * 100 : 0;
  const bizPayback = bd.profit && bd.price ? rawPrice(bd.price) / rawPrice(bd.profit) : 0;
  const bizMultiple = bd.profit && bd.price ? rawPrice(bd.price) / (rawPrice(bd.profit) * 12) : 0;

  const landSteps = [
    { t: 'Тип и расположение', s: 'Категория · карта · кадастр' },
    { t: 'Параметры и цена', s: 'Площадь, цена, документы' },
    { t: 'Фотографии', s: 'Минимум 4 · обложка' },
    { t: 'Контакты и публикация', s: 'Кто отвечает покупателю' },
  ];
  const bizSteps = [
    { t: 'Категория бизнеса', s: 'Сегмент · возраст · персонал' },
    { t: 'Локация и помещение', s: 'Адрес · площадь · аренда' },
    { t: 'Финансы и цена', s: 'Выручка, прибыль, окупаемость' },
    { t: 'Документы и фото', s: 'Опись активов · фото' },
    { t: 'Контакты и публикация', s: 'NDA · кто отвечает' },
  ];
  const steps = entity === 'business' ? bizSteps : landSteps;
  const total = steps.length;
  const minutes = entity === 'business' ? 5 : 3;

  // Чек-лист (участок) для процента и сайдбара
  const landChecklist: [string, boolean][] = [
    ['Тип и категория', !!fd.landType],
    ['Адрес и контур', !!markerPos || !!boundary || !!fd.location.trim()],
    ['Площадь и цена', !!fd.area && rawPrice(fd.price) > 0],
    ['Документы', LAND_TOGGLES.some(t => (fd as Record<string, unknown>)[t.key])],
    ['Описание ≥ 200 знаков', fd.description.trim().length >= 200],
    ['Фото ≥ 4 шт', photos.length >= 4],
    ['Контакты', !!fd.phone.trim()],
  ];
  const bizChecklist: [string, boolean][] = [
    ['Категория и название', !!bd.category && !!bd.name.trim()],
    ['Локация и площадь', !!bd.location.trim() && !!bd.buildingArea],
    ['Финансы и цена', rawPrice(bd.revenue) > 0 && rawPrice(bd.price) > 0],
    ['Опись активов', BIZ_ASSETS.some(a => (bd as Record<string, unknown>)[a.key])],
    ['Фото ≥ 4 шт', photos.length >= 4],
    ['Контакты', !!bd.phone.trim()],
  ];
  const checklist = entity === 'business' ? bizChecklist : landChecklist;
  const percent = useMemo(() => Math.round((checklist.filter(c => c[1]).length / checklist.length) * 100), [checklist]);

  const isLast = step === total - 1;

  /* ── навигация ── */
  const goNext = () => {
    setErrors({});
    if (isLast) { submit('published'); return; }
    setStep(s => Math.min(s + 1, total - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    if (step === 0) { setEntity(null); return; }
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── боевой сабмит ── */
  const uploadPhotos = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const file of photos) {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/media', { method: 'POST', body: form });
      if (r.ok) { const d = await r.json(); ids.push(d.doc.id); }
    }
    return ids;
  };

  const submit = async (status: 'draft' | 'published') => {
    pushDataLayer('add_listing_submit_attempt', { entity });
    // финальная валидация
    const e: Record<string, string> = {};
    if (entity === 'land') {
      if (!fd.landType) e.landType = 'Выберите тип участка';
      if (!fd.area || Number(fd.area) <= 0) e.area = 'Укажите площадь';
      if (rawPrice(fd.price) <= 0) e.price = 'Укажите цену';
      if (!fd.phone.trim()) e.phone = 'Укажите телефон';
      if (photos.length + existingImages.length === 0) e.photos = 'Добавьте хотя бы одно фото';
    } else {
      if (!bd.category) e.category = 'Выберите категорию';
      if (!bd.name.trim()) e.name = 'Укажите название';
      if (rawPrice(bd.price) <= 0) e.price = 'Укажите цену';
      if (!bd.phone.trim()) e.phone = 'Укажите телефон';
      if (photos.length + existingImages.length === 0) e.photos = 'Добавьте хотя бы одно фото';
    }
    if (Object.keys(e).length) {
      setErrors(e);
      pushDataLayer('add_listing_submit_error', { entity });
      // Перепрыгнуть на шаг с первой ошибкой, чтобы она была видна
      const landStepOf: Record<string, number> = { landType: 0, area: 1, price: 1, photos: 2, phone: 3 };
      const bizStepOf: Record<string, number> = { category: 0, name: 0, price: 2, photos: 3, phone: 4 };
      const map = entity === 'business' ? bizStepOf : landStepOf;
      const firstStep = Object.keys(e).map(k => map[k]).filter(v => v !== undefined).sort((a, b) => a - b)[0];
      if (firstStep !== undefined && firstStep !== step) {
        setStep(firstStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    setIsSubmitting(true);
    try {
      // существующие (при редактировании) + заново загруженные, в текущем порядке
      const newIds = await uploadPhotos();
      const images = [...existingImages.map(im => im.id), ...newIds].map(id => ({ image: id }));
      let body: Record<string, unknown>;
      if (entity === 'land') {
        body = {
          title: landAutoTitle || 'Участок',
          listingCategory: 'land',
          dealType: fd.dealType,
          landType: fd.landType || 'ИЖС',
          area: Number(fd.area),
          price: rawPrice(fd.price),
          location: fd.location || 'Казахстан',
          address: fd.address || undefined,
          hasElectricity: fd.hasElectricity, hasGas: fd.hasGas, hasWater: fd.hasWater,
          hasSewer: fd.hasSewer, hasRoadAccess: fd.hasRoadAccess,
          hasStateAct: fd.hasStateAct, isDivisible: fd.isDivisible,
          hasEncumbrances: !fd.noEncumbrances,
          canChangePurpose: fd.canChangePurpose,
          cadastralNumber: fd.cadastralNumber || undefined,
          plotBoundary: boundary ? JSON.stringify(boundary) : undefined,
          description: fd.description || undefined,
          lat: markerPos?.lat, lng: markerPos?.lng,
        };
      } else {
        const parts: string[] = [];
        if (bd.legalForm) parts.push(`Юр. форма: ${bd.legalForm}`);
        if (bd.age) parts.push(`Возраст: ${bd.age}`);
        if (bd.employees) parts.push(`Сотрудников: ${bd.employees}`);
        if (bd.profit) parts.push(`Чистая прибыль/мес: ${human(rawPrice(bd.profit))} ₸`);
        if (bd.rent) parts.push(`Аренда/собственность: ${bd.rent}`);
        const assetsOn = BIZ_ASSETS.filter(a => (bd as Record<string, unknown>)[a.key]).map(a => a.label);
        if (assetsOn.length) parts.push(`В продажу входит: ${assetsOn.join(', ')}`);
        const extra = parts.length ? `\n\n${parts.join(' · ')}` : '';
        body = {
          title: bd.name || 'Готовый бизнес',
          listingCategory: 'business',
          dealType: 'sale',
          businessType: bd.category || 'other',
          price: rawPrice(bd.price),
          buildingArea: bd.buildingArea ? Number(bd.buildingArea) : undefined,
          monthlyRevenue: bd.revenue ? rawPrice(bd.revenue) : undefined,
          paybackMonths: bizPayback ? Math.round(bizPayback) : undefined,
          isOperational: true,
          floor: bd.floor ? Number(bd.floor) : undefined,
          location: bd.location || 'Казахстан',
          address: bd.address || undefined,
          description: (bd.description || '') + extra || undefined,
          lat: markerPos?.lat, lng: markerPos?.lng,
        };
      }
      const common = {
        seller: user?.id || undefined,
        sellerName: entity === 'land' ? fd.name : bd.name2,
        sellerPhone: entity === 'land' ? fd.phone : bd.phone,
        sellerHasWhatsApp: entity === 'land' ? fd.wantWhatsApp : bd.wantWhatsApp,
        sellerIsAgency: user?.isAgency ?? false,
        // при редактировании статус не меняем (иначе «Сохранить» могло бы снять
        // объявление с публикации); задаём его только при создании
        ...(isEdit ? {} : { status }),
        images,
      };
      const r = await fetch(isEdit ? `/api/listings/${listingId}` : '/api/listings', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...body, ...common }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.errors?.[0]?.message ?? 'Ошибка сервера');
      }
      pushDataLayer(isEdit ? 'edit_listing_submit_success' : 'add_listing_submit_success', { entity, status });
      setIsSubmitted(true);
      let c = 5;
      const timer = setInterval(() => {
        c -= 1; setCountdown(c);
        if (c <= 0) { clearInterval(timer); router.push('/profile'); }
      }, 1000);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка при отправке. Попробуйте ещё раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── экраны загрузки/гварда ── */
  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[var(--paper)]">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="submit-page min-h-[calc(100vh-140px)]">
        <TypeChooser onPick={(e) => { setEntity(e); setStep(0); pushDataLayer('add_listing_pick_entity', { entity: e }); }} />
      </div>
    );
  }

  /* ── успех ── */
  if (isSubmitted) {
    return (
      <div className="submit-page flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--brand)]">
            <Check className="size-7 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-lg font-black tracking-tight text-ink-900">{isEdit ? 'Изменения сохранены' : 'Отправлено на модерацию'}</h2>
          <p className="mt-1.5 text-[13px] text-ink-500">{isEdit ? 'Объявление обновлено. Изменения уже применены.' : 'Публикация бесплатна. Объявление пройдёт проверку — обычно до 15 минут.'}</p>
          <p className="mono mt-3 text-[11px] text-ink-400">Переход в кабинет через {countdown} сек…</p>
          <button onClick={() => router.push('/profile')} className="mt-3 text-[13px] font-bold text-[var(--brand)] hover:underline">Перейти сейчас →</button>
        </div>
      </div>
    );
  }

  /* ───────────────────────── мастер ───────────────────────── */
  return (
    <div className="submit-page min-h-[calc(100vh-140px)] pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки + заголовок */}
        <div className="pt-6">
          <div className="flex items-center gap-1.5 text-[12.5px] text-ink-500">
            <Link href="/profile" className="hover:text-ink-900">Кабинет</Link>
            <span className="text-ink-300">/</span>
            {isEdit
              ? <span className="hover:text-ink-900">Редактирование</span>
              : <button onClick={() => setEntity(null)} className="hover:text-ink-900">Новое объявление</button>}
            <span className="text-ink-300">/</span>
            <span className="font-semibold text-ink-900">{entity === 'business' ? 'Готовый бизнес' : 'Участок'}</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <Tag>{String(step + 1).padStart(2, '0')} · {steps[step].t.toLowerCase()}</Tag>
              <h1 className="mt-1.5 text-2xl font-black leading-none tracking-[-0.05em] text-[var(--brand-ink)] sm:text-3xl">
                {isEdit ? 'Редактирование' : 'Подача объявления'} — <span className="text-ink-300">{entity === 'business' ? 'бизнес' : 'участок'}</span>
              </h1>
            </div>
            {!isEdit && (
              <button onClick={() => submit('draft')} disabled={isSubmitting}
                className="hidden shrink-0 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-bold text-ink-700 transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50 sm:block">
                Сохранить черновик
              </button>
            )}
          </div>
        </div>

        {/* Мобильный прогресс */}
        <div className="mt-4 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">Шаг {step + 1} из {total}</span>
            <span className="mono text-[10px] font-semibold text-[var(--brand)]">{percent}%</span>
          </div>
          <MobileProgress step={step} total={total} />
        </div>

        {/* Сетка: рельс | форма | сайдбар */}
        <div className="mt-6 grid gap-7 lg:grid-cols-[220px_1fr_320px]">
          {/* Рельс */}
          <aside className="hidden lg:block">
            <StepRail steps={steps} current={step} percent={percent} minutes={minutes} />
          </aside>

          {/* Форма */}
          <div className="min-w-0">
            {entity === 'land' ? renderLandStep() : renderBizStep()}
          </div>

          {/* Сайдбар — превью + чек-лист */}
          <aside className="hidden flex-col gap-3.5 lg:flex">
            {entity === 'land' ? LandPreview() : BizPreview()}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
              <Lab>чек-лист</Lab>
              <div className="mt-2.5 flex flex-col gap-2">
                {checklist.map(([t, ok], i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`flex size-4 items-center justify-center rounded-full text-[10px] font-black ${ok ? 'bg-[var(--brand)] text-white' : 'border-[1.5px] border-dashed border-ink-300'}`}>{ok ? '✓' : ''}</span>
                    <span className={`flex-1 text-[12.5px] ${ok ? 'text-ink-900' : 'text-ink-500'}`}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-[var(--brand-ink)] p-4 text-white">
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">совет</span>
              <div className="mt-2 text-[14px] font-extrabold tracking-[-0.025em]">
                {entity === 'business' ? 'P&L за 12 месяцев' : 'Живое фото — большой плюс'}
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-white/70">
                {entity === 'business'
                  ? 'Опись активов и отчёт P&L повышают доверие. Серьёзные покупатели фильтруют по детализации.'
                  : 'Объявления с реальными фото участка и подъезда кликают заметно чаще стоковых.'}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky-панель действий */}
      <div className="sticky bottom-0 z-30 mt-8 border-t border-[var(--line)] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={goBack} disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-4 text-[13px] font-bold text-ink-700 transition-colors hover:bg-[var(--paper-2)] disabled:opacity-50">
              <ChevronLeft className="size-4" /> Назад
            </button>
            <span className="mono hidden text-[10.5px] uppercase tracking-[0.08em] text-ink-400 sm:block">
              шаг {step + 1} из {total} · ~{minutes} мин
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-ink-500 sm:block">Публикация — бесплатно</span>
            <button onClick={goNext} disabled={isSubmitting}
              className={`inline-flex h-12 items-center gap-2 rounded-xl px-5 text-[14px] font-bold text-white transition-all disabled:opacity-60 ${isLast ? 'bg-[var(--brand)] shadow-[0_10px_30px_-12px_rgba(6,111,54,0.6)] hover:bg-[var(--brand-700)]' : 'bg-ink-900 hover:bg-black'}`}>
              {isSubmitting ? 'Отправка…' : isLast ? (isEdit ? 'Сохранить изменения' : 'Опубликовать бесплатно') : `Дальше — ${steps[step + 1].t.split(' ')[0]}`}
              {!isSubmitting && <ChevronRight className="size-4" />}
            </button>
          </div>
        </div>
        {errors.submit && <p className="pb-2 text-center text-[12px] text-ink-900">{errors.submit}</p>}
      </div>
    </div>
  );

  /* ═══════════════ участок — шаги ═══════════════ */
  function renderLandStep() {
    if (step === 0) return (
      <div className="space-y-7">
        <section>
          <H3 req>Тип участка</H3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLOT_TYPES.map(t => (
              <Tile key={t.k} k={t.k} s={t.s} active={fd.landType === t.k}
                onClick={() => setL('landType', fd.landType === t.k ? '' : t.k)} />
            ))}
          </div>
          {errors.landType && <p className="mt-2 text-[12px] text-ink-900">{errors.landType}</p>}
        </section>

        <section>
          <H3>Адрес и границы</H3>
          <div className="mb-3 grid gap-2.5 sm:grid-cols-2">
            <div className="relative">
              <CityDatalist />
              <Field label="Область / город" value={fd.location} onChange={v => setL('location', v)} placeholder="Алматинская обл., Талгар" list="kz-cities" />
              {isGeocoding && <span className="mono absolute right-3 top-9 text-[10px] font-bold text-[var(--brand)]">определяем…</span>}
            </div>
            <Field label="Кадастровый номер" value={fd.cadastralNumber} onChange={v => setL('cadastralNumber', v)} placeholder="03-068-026-841" mono />
          </div>
          <MapEditor value={markerPos} onChange={setMarkerPos} boundary={boundary} onBoundaryChange={setBoundary} />
          {boundary && (
            <div className="mt-2.5">
              <GreenNote><strong>Контур сохранён.</strong> Площадь по контуру подставится автоматически — сверьте с выпиской из кадастра.</GreenNote>
            </div>
          )}
          <div className="mt-3">
            <Field label="Адрес / ориентир" value={fd.address} onChange={v => setL('address', v)} placeholder="вдоль трассы, рядом школа…" />
          </div>
        </section>
      </div>
    );

    if (step === 1) return (
      <div className="space-y-7">
        <section>
          <H3 req>Площадь и цена</H3>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Field label="Площадь" value={fd.area} onChange={v => setL('area', v.replace(/[^\d.]/g, ''))} placeholder="6" suffix="соток" mono inputMode="decimal" />
            <Field label={fd.dealType === 'rent' ? 'Аренда / мес.' : 'Цена'} value={fd.price} onChange={v => setL('price', fmtPrice(v))} placeholder="15 000 000" prefix="₸" mono inputMode="numeric" />
            <Field label="Цена за сотку" value={landPerSotka ? `≈ ${human(landPerSotka)}` : ''} placeholder="считаем сами" suffix="₸ / сот." mono />
          </div>
          {(errors.area || errors.price) && <p className="mt-2 text-[12px] text-ink-900">{errors.area || errors.price}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip label="Цена в долларах" active={fd.priceUsd} onClick={() => setL('priceUsd', !fd.priceUsd)} />
            <Chip label="Возможна ипотека" active={fd.mortgage} onClick={() => setL('mortgage', !fd.mortgage)} />
          </div>
        </section>

        <section>
          <H3>Документы и коммуникации</H3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LAND_TOGGLES.map(t => (
              <Toggle key={t.key} label={t.label} on={!!(fd as Record<string, unknown>)[t.key]}
                onClick={() => setL(t.key as keyof typeof fd, !(fd as Record<string, unknown>)[t.key])} />
            ))}
          </div>
          <div className="mt-2">
            <Toggle label="Возможна смена целевого назначения" on={fd.canChangePurpose} onClick={() => setL('canChangePurpose', !fd.canChangePurpose)} />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <H3>Описание</H3>
            <span className="mono text-[10px] text-ink-400">{fd.description.length} / 1500</span>
          </div>
          <textarea rows={5} maxLength={1500} value={fd.description} onChange={e => setL('description', e.target.value)}
            placeholder="Что выгодно отличает участок: соседи, подъезд, вид, история продажи…"
            className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 text-[14px] leading-relaxed text-ink-900 outline-none transition-shadow placeholder:text-ink-300 focus:border-[var(--brand)] focus:shadow-[0_0_0_4px_rgba(6,111,54,0.1)]" />
          <p className="mt-1.5 text-[11.5px] text-ink-400">Без эмодзи и КАПСА — алгоритм понижает такие тексты в выдаче.</p>
        </section>
      </div>
    );

    if (step === 2) return PhotosStep({ min: 4, kind: 'land' });

    return ContactsStep({ kind: 'land' });
  }

  /* ═══════════════ бизнес — шаги ═══════════════ */
  function renderBizStep() {
    if (step === 0) return (
      <div className="space-y-7">
        <section>
          <H3 req>Категория и формат</H3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BIZ_CATEGORIES.map(t => (
              <Tile key={t.k} k={t.k} s={t.s} active={bd.category === t.value}
                onClick={() => setB('category', bd.category === t.value ? '' : t.value)} />
            ))}
          </div>
          {errors.category && <p className="mt-2 text-[12px] text-ink-900">{errors.category}</p>}
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            <Field label="Название бизнеса" value={bd.name} onChange={v => setB('name', v)} placeholder="Кофейня «Талгар Бин»" />
            <Field label="Возраст" value={bd.age} onChange={v => setB('age', v)} placeholder="4 года" />
            <Field label="Юр. форма" value={bd.legalForm} onChange={v => setB('legalForm', v)} placeholder="ИП на упрощёнке" />
          </div>
          {errors.name && <p className="mt-2 text-[12px] text-ink-900">{errors.name}</p>}
        </section>
      </div>
    );

    if (step === 1) return (
      <div className="space-y-7">
        <section>
          <H3>Помещение и адрес</H3>
          <div className="mb-2.5 grid gap-2.5 sm:grid-cols-2">
            <div><CityDatalist /><Field label="Город" value={bd.location} onChange={v => setB('location', v)} placeholder="Алматы, мкр Самал-1" list="kz-cities" /></div>
            <Field label="Адрес" value={bd.address} onChange={v => setB('address', v)} placeholder="ул. Жолдасбекова, 28" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Field label="Площадь помещения" value={bd.buildingArea} onChange={v => setB('buildingArea', v.replace(/\D/g, ''))} placeholder="86" suffix="м²" mono inputMode="numeric" />
            <Field label="Этаж" value={bd.floor} onChange={v => setB('floor', v.replace(/\D/g, ''))} placeholder="1" mono inputMode="numeric" />
            <Field label="Сотрудников" value={bd.employees} onChange={v => setB('employees', v.replace(/\D/g, ''))} placeholder="5" mono inputMode="numeric" />
          </div>
          <div className="mt-2.5">
            <Field label="Аренда / собственность" value={bd.rent} onChange={v => setB('rent', v)} placeholder="Аренда · 800 000 ₸/мес · до 2028" />
          </div>
        </section>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-7">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-[17px] font-extrabold tracking-[-0.035em] text-ink-900">Финансы</h3>
            <button type="button" onClick={() => setB('hideUntilNda', !bd.hideUntilNda)} className="flex items-center gap-2">
              <span className="text-[11.5px] text-ink-500">Скрывать суммы до NDA</span>
              <span className={`relative h-5 w-8 rounded-full transition-colors ${bd.hideUntilNda ? 'bg-[var(--brand)]' : 'bg-zinc-300'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${bd.hideUntilNda ? 'left-[14px]' : 'left-0.5'}`} />
              </span>
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Field label="Выручка / месяц" value={bd.revenue} onChange={v => setB('revenue', fmtPrice(v))} placeholder="4 200 000" prefix="₸" mono inputMode="numeric" />
            <Field label="Чистая прибыль / мес" value={bd.profit} onChange={v => setB('profit', fmtPrice(v))} placeholder="850 000" prefix="₸" mono inputMode="numeric" />
            <Field label="Маржа" value={bizMargin ? `≈ ${bizMargin.toFixed(1)} %` : ''} placeholder="считаем сами" mono />
          </div>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
            <Field label="Цена бизнеса" value={bd.price} onChange={v => setB('price', fmtPrice(v))} placeholder="14 500 000" prefix="₸" mono inputMode="numeric" />
            <Field label="Окупаемость" value={bizPayback ? `${Math.round(bizPayback)} мес` : ''} placeholder="—" mono />
            <Field label="Кратность к прибыли" value={bizMultiple ? `× ${bizMultiple.toFixed(1)}` : ''} placeholder="—" mono />
          </div>
          {errors.price && <p className="mt-2 text-[12px] text-ink-900">{errors.price}</p>}

          {/* мини-чарт */}
          <div className="mt-3.5 rounded-xl border border-[var(--line)] bg-white p-4">
            <div className="flex items-baseline justify-between">
              <Lab>выручка по месяцам · 12 мес</Lab>
              <span className="mono text-[11px] font-bold text-[var(--brand)]">↑ тренд роста</span>
            </div>
            <div className="mt-3 flex h-16 items-end gap-1">
              {CHART.map((h, i) => (
                <div key={i} className="flex-1 rounded-t-[3px]" style={{ height: `${h}%`, background: i >= 9 ? 'var(--brand)' : i >= 5 ? 'var(--brand-300)' : 'var(--paper-3)' }} />
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--brand-ink)] p-3.5 text-white">
              <Lock className="mt-0.5 size-4 shrink-0 text-[var(--brand-300)]" />
              <div className="text-[12px] leading-snug">
                <strong>Скрытые финансы открываются после NDA.</strong>{' '}
                <span className="text-white/70">В превью — только диапазон и кратность. Точные цифры покупатель увидит после согласия с NDA.</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <H3>Что входит в продажу</H3>
          <div className="grid gap-2 sm:grid-cols-2">
            {BIZ_ASSETS.map(a => (
              <Toggle key={a.key} label={a.label} on={!!(bd as Record<string, unknown>)[a.key]}
                onClick={() => setB(a.key as keyof typeof bd, !(bd as Record<string, unknown>)[a.key])} />
            ))}
          </div>
        </section>
      </div>
    );

    if (step === 3) return (
      <div className="space-y-7">
        {PhotosStep({ min: 4, kind: 'business' })}
        <section>
          <H3>Документы (по NDA)</H3>
          <DocUploader />
          <p className="mt-2 text-[11.5px] text-ink-400">
            Форматы: PDF · JPG · PNG · HEIC · DOCX→PDF. Документы с меткой NDA видны покупателю только после согласия с соглашением о неразглашении.
          </p>
        </section>
      </div>
    );

    return ContactsStep({ kind: 'business' });
  }

  /* ═══════════════ общие шаги ═══════════════ */
  function PhotosStep({ min, kind }: { min: number; kind: 'land' | 'business' }) {
    return (
      <div className="space-y-4">
        <div>
          <H3 req>Фотографии</H3>
          <p className="-mt-1 text-[13px] leading-snug text-ink-500">
            Минимум <strong>{min} фото</strong>. Первое станет обложкой — выбирайте лучшее{kind === 'business' ? ': фасад, зал, кухня' : ': вид, границы, подъезд'}.
          </p>
        </div>

        {existingImages.length > 0 && (
          <div>
            <Lab>уже загружены</Lab>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {existingImages.map((im, i) => (
                <div key={im.id} className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--paper-2)] ${i === 0 && photoPreviews.length === 0 ? 'border-2 border-[var(--brand)]' : 'border border-[var(--line)]'}`}>
                  {i === 0 && photoPreviews.length === 0 && <span className="absolute left-1.5 top-1.5 z-10 rounded bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Обложка</span>}
                  {im.video
                    ? <video src={im.url} className="h-full w-full object-cover" muted playsInline />
                    : <img src={im.url} alt="" className="h-full w-full object-cover" />}
                  <button type="button" onClick={() => removeExisting(i)}
                    className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photoPreviews.map((src, i) => {
              const isVid = photos[i]?.type.startsWith('video/');
              return (
                <div key={i} draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                  onDrop={e => { e.preventDefault(); if (dragIndex !== null) movePhoto(dragIndex, i); setDragIndex(null); setDragOver(null); }}
                  onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                  className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl bg-[var(--paper-2)] transition-all ${dragOver === i && dragIndex !== i ? 'ring-2 ring-[var(--brand)]' : ''} ${dragIndex === i ? 'opacity-40' : ''} ${i === 0 ? 'border-2 border-[var(--brand)]' : 'border border-[var(--line)]'}`}>
                  {i === 0 && <span className="absolute left-1.5 top-1.5 z-10 rounded bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Обложка</span>}
                  {isVid
                    ? <><video src={src} className="h-full w-full object-cover" muted playsInline /><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="flex size-8 items-center justify-center rounded-full bg-black/50"><Play className="size-3.5 text-white" fill="white" /></span></div></>
                    : <img src={src} alt="" className="h-full w-full object-cover" />}
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">✕</button>
                </div>
              );
            })}
          </div>
        )}

        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed transition-colors ${errors.photos ? 'border-ink-400 bg-[var(--paper-2)]' : 'border-ink-300 bg-[var(--paper-2)] hover:border-[var(--brand)]'} ${photoPreviews.length || existingImages.length ? 'h-20' : 'h-36'}`}>
          <Upload className="mb-1.5 size-5 text-ink-400" />
          <span className="text-[13px] font-semibold text-ink-600">{photos.length || existingImages.length ? 'Добавить ещё' : 'Загрузить фото или видео'}</span>
          {!(photos.length || existingImages.length) && <span className="mt-0.5 text-[11px] text-ink-400">JPG · PNG · MP4 · MOV · до 200 МБ</span>}
          <input ref={fileRef} type="file" className="hidden" multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={handlePhotos} />
        </label>
        {errors.photos && <p className="text-[12px] text-ink-900">{errors.photos}</p>}

        {kind === 'land' && (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink-300 bg-white px-3.5 py-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--paper-2)]"><Play className="size-4 text-ink-500" /></span>
              <div className="flex-1"><div className="text-[13px] font-bold text-ink-900">Видео-обход</div><div className="text-[11px] text-ink-500">до 60 сек · +35% к просмотрам</div></div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink-300 bg-white px-3.5 py-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--paper-2)]"><Plane className="size-4 text-ink-500" /></span>
              <div className="flex-1"><div className="text-[13px] font-bold text-ink-900">Аэро-фото / дрон</div><div className="text-[11px] text-ink-500">заказать у фотографа · сервис</div></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ContactsStep({ kind }: { kind: 'land' | 'business' }) {
    const name = kind === 'land' ? fd.name : bd.name2;
    const phone = kind === 'land' ? fd.phone : bd.phone;
    const call = kind === 'land' ? fd.wantCall : bd.wantCall;
    const wa = kind === 'land' ? fd.wantWhatsApp : bd.wantWhatsApp;
    const setName = (v: string) => kind === 'land' ? setL('name', v) : setB('name2', v);
    const setPhone = (v: string) => kind === 'land' ? setL('phone', v) : setB('phone', v);
    const setCall = () => kind === 'land' ? setL('wantCall', !call) : setB('wantCall', !call);
    const setWa = () => kind === 'land' ? setL('wantWhatsApp', !wa) : setB('wantWhatsApp', !wa);
    const initials = (name || 'ВЫ').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
      <div className="space-y-7">
        <section>
          <H3>Кто ответит покупателю</H3>
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3.5 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[14px] font-extrabold text-white">{initials}</span>
            <div className="flex-1">
              <div className="text-[14px] font-bold tracking-[-0.02em] text-ink-900">{name || 'Ваше имя'} · {user?.isAgency ? 'агент' : 'хозяин'}</div>
              <div className="mono text-[11px] text-ink-500">{phone || '+7 (___) ___ __ __'}</div>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Field label="Имя" value={name} onChange={setName} placeholder="Как к вам обращаться" />
            <Field label="Телефон" value={phone} onChange={setPhone} placeholder="+7 700 000 00 00" mono />
          </div>
          {errors.phone && <p className="mt-2 text-[12px] text-ink-900">{errors.phone}</p>}
        </section>

        <section>
          <H3>Способы связи</H3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Звонок" on={call} onClick={setCall} />
            <Toggle label="WhatsApp" on={wa} onClick={setWa} />
          </div>
        </section>

        <GreenNote>
          <strong>Публикация бесплатна.</strong> Продвинуть объявление (Срочно, Реклама) можно позже — из личного кабинета.
        </GreenNote>

        <p className="rounded-xl bg-[var(--paper-2)] px-3.5 py-3 text-[11.5px] leading-snug text-ink-500">
          Нажимая «Опубликовать», вы подтверждаете <Link href="/terms" className="text-ink-900 underline">оферту</Link> и достоверность данных. Объявление пройдёт модерацию — обычно до 15 минут.
        </p>
      </div>
    );
  }

  /* ═══════════════ живой превью ═══════════════ */
  function LandPreview() {
    return (
      <div>
        <Lab>превью карточки</Lab>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="ph-plot noise relative aspect-[5/3]">
            {(photoPreviews[0] || existingImages[0]?.url) && <img src={photoPreviews[0] || existingImages[0]?.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute left-2.5 top-2.5 rounded bg-[var(--brand-ink)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">Черновик</span>
            <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-lg border border-black/5 bg-white/90 text-ink-500"><Bookmark className="size-3.5" /></span>
          </div>
          <div className="p-4">
            <div className="mono text-[10px] uppercase tracking-[0.08em] text-ink-400">{fd.landType || 'участок'}{fd.location ? ` · ${fd.location.split(',')[0]}` : ''}</div>
            <div className="mt-1 text-[16px] font-black leading-tight tracking-[-0.035em] text-ink-900">{landAutoTitle || 'Заголовок появится автоматически'}</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-xl font-black tracking-[-0.04em] text-ink-900">{fd.price ? `${mln(rawPrice(fd.price))} ₸` : '— ₸'}</div>
                <div className="mono mt-0.5 text-[10px] text-[var(--brand)]">{landPerSotka ? `${mln(landPerSotka)} / сотка` : 'цена за сотку'}</div>
              </div>
              <span className="mono text-[10px] font-bold text-[var(--brand)]">только что</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function BizPreview() {
    return (
      <div>
        <Lab>превью карточки</Lab>
        <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="ph-biz noise relative aspect-[5/3]">
            {(photoPreviews[0] || existingImages[0]?.url) && <img src={photoPreviews[0] || existingImages[0]?.url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute left-2.5 top-2.5 rounded bg-[var(--brand-ink)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">Бизнес</span>
            {bizMultiple > 0 && <span className="mono absolute right-2.5 top-2.5 rounded bg-white px-1.5 py-0.5 text-[9.5px] font-bold text-ink-900">× {bizMultiple.toFixed(1)}</span>}
          </div>
          <div className="p-4">
            <div className="mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
              {BIZ_CATEGORIES.find(c => c.value === bd.category)?.k.split(' ')[0] || 'бизнес'}{bd.location ? ` · ${bd.location.split(',')[0]}` : ''}
            </div>
            <div className="mt-1 text-[16px] font-black leading-tight tracking-[-0.035em] text-ink-900">{bd.name || 'Название бизнеса'}</div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 border-y border-[var(--line)] py-2.5">
              <div><div className="mono text-[9px] uppercase tracking-[0.08em] text-ink-400">Выручка/мес</div><div className="mt-0.5 text-[13px] font-extrabold tracking-[-0.02em] text-ink-900">{bd.hideUntilNda ? 'по NDA' : bd.revenue ? `${mln(rawPrice(bd.revenue))} ₸` : '—'}</div></div>
              <div><div className="mono text-[9px] uppercase tracking-[0.08em] text-ink-400">Окупаемость</div><div className="mt-0.5 text-[13px] font-extrabold tracking-[-0.02em] text-ink-900">{bizPayback ? `${Math.round(bizPayback)} мес` : '—'}</div></div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div className="text-xl font-black tracking-[-0.04em] text-ink-900">{bd.price ? `${mln(rawPrice(bd.price))} ₸` : '— ₸'}</div>
              <span className="mono text-[10px] font-bold text-[var(--brand)]">NDA · открыть</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
