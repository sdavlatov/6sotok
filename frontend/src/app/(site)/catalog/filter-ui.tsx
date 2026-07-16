'use client';

/**
 * Единый набор фильтр-контролов — один и тот же для десктопа (drawer + поповеры)
 * и мобайла (полноэкранный sheet). Все компоненты контролируемые: получают
 * FilterState и отдают изменения через onChange.
 */

import { useMemo, useState } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import type { Listing } from '@/types/listing';
import {
  FilterState, PMAX, AMAX, PRICE_PRESETS, SORTS,
  UTIL_OPTIONS, DOC_OPTIONS, FEAT_OPTIONS, LEGAL_OPTIONS,
  optionPredicates, countBy, topCities, priceHistogram, cloneFilters, nf, landTypeCounts,
} from './catalog-utils';

export interface FilterSectionProps {
  filters: FilterState;
  onChange(next: FilterState): void;
  listings: Listing[];
}

function toggleSet(set: Set<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key); else next.add(key);
  return next;
}

// ─── Сегмент-переключатель ───────────────────────────────────────────────────
export function Seg({ options, value, onSelect }: {
  options: { id: string; label: string }[];
  value: string;
  onSelect(id: string): void;
}) {
  return (
    <div className="inline-flex bg-zinc-100 border border-zinc-200 rounded-[11px] p-[3px] gap-0.5">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className={`h-[30px] px-3 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors ${
            value === o.id ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'text-zinc-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Заголовок секции ────────────────────────────────────────────────────────
export function SectionLabel({ title, count }: { title: string; count?: string | number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</span>
      {count != null && count !== 0 && <span className="text-[11px] font-semibold text-zinc-400">{count}</span>}
    </div>
  );
}

// ─── Тип участка (сетка карточек) ────────────────────────────────────────────
export function TypeGrid({ filters, onChange, listings }: FilterSectionProps) {
  const types = useMemo(() => landTypeCounts(listings), [listings]);
  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map(([label, count]) => {
        const on = filters.types.has(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => { const f = cloneFilters(filters); f.types = toggleSet(f.types, label); onChange(f); }}
            className={`h-[54px] px-3.5 rounded-xl flex flex-col items-start justify-center gap-0.5 text-left transition-colors ${
              on ? 'border-[1.5px] border-primary bg-[var(--brand-50,#f0fdf4)]' : 'border border-zinc-200 bg-white'
            }`}
          >
            <span className={`font-semibold text-[14px] tracking-[-0.02em] ${on ? 'text-[var(--brand-ink,#021A0E)]' : 'text-zinc-900'}`}>{label}</span>
            <span className={`text-[11px] font-mono font-semibold ${on ? 'text-primary' : 'text-zinc-500'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Двойной range ───────────────────────────────────────────────────────────
function DualRange({ lo, hi, max, onInput }: { lo: number; hi: number; max: number; onInput(lo: number, hi: number): void }) {
  const a = Math.min(lo, hi), b = Math.max(lo, hi);
  return (
    <div className="crange">
      <div className="track" />
      <div className="fill" style={{ left: `${a / max * 100}%`, width: `${(b - a) / max * 100}%` }} />
      <input type="range" min={0} max={max} value={lo} onChange={e => onInput(+e.target.value, hi)} aria-label="от" />
      <input type="range" min={0} max={max} value={hi} onChange={e => onInput(lo, +e.target.value)} aria-label="до" />
    </div>
  );
}

function NumRow({ lo, hi, unit, onInput }: { lo: number; hi: number; unit: string; onInput(lo: number, hi: number): void }) {
  const field = 'flex-1 h-[42px] border border-zinc-200 rounded-[10px] flex items-center px-3 gap-1.5';
  const input = 'flex-1 min-w-0 border-none outline-none text-[14px] font-bold text-zinc-900 bg-transparent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none';
  const nk = 'text-[11px] font-semibold text-zinc-400';
  return (
    <div className="flex gap-2 mt-3">
      <div className={field}>
        <span className={nk}>от</span>
        <input type="number" value={lo} onChange={e => onInput(+e.target.value || 0, hi)} className={input} />
        <span className={nk}>{unit}</span>
      </div>
      <div className={field}>
        <span className={nk}>до</span>
        <input type="number" value={hi} onChange={e => onInput(lo, +e.target.value || 0)} className={input} />
        <span className={nk}>{unit}</span>
      </div>
    </div>
  );
}

// ─── Цена ────────────────────────────────────────────────────────────────────
export function PriceSection({ filters, onChange, listings }: FilterSectionProps) {
  const hist = useMemo(() => priceHistogram(listings), [listings]);
  const { pLo, pHi } = filters;
  const a = Math.min(pLo, pHi), b = Math.max(pLo, pHi);
  const set = (lo: number, hi: number) => { const f = cloneFilters(filters); f.pLo = lo; f.pHi = hi; onChange(f); };
  return (
    <div>
      <div className="flex items-center justify-between gap-2.5 mb-3">
        <Seg
          options={[{ id: 'plot', label: 'за участок' }, { id: 'sotka', label: 'за сотку' }]}
          value={filters.priceMode}
          onSelect={id => { const f = cloneFilters(filters); f.priceMode = id as 'plot' | 'sotka'; onChange(f); }}
        />
        <div className="font-extrabold text-[13px] whitespace-nowrap tracking-[-0.02em]">
          {a} – <span className="text-primary">{b >= PMAX ? `${b}+` : b}</span> млн
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {PRICE_PRESETS.map(p => {
          const on = a === p.lo && b === p.hi;
          return (
            <button
              key={p.l}
              type="button"
              onClick={() => set(p.lo, p.hi)}
              className={`h-7 px-2.5 rounded-full border text-[11.5px] font-semibold transition-colors ${
                on ? 'border-primary bg-[var(--brand-50,#f0fdf4)] text-[var(--brand-ink,#021A0E)]' : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              {p.l}
            </button>
          );
        })}
      </div>
      <div className="flex items-end h-11 gap-0.5">
        {hist.map((h, i) => {
          const v = i / (hist.length - 1) * PMAX;
          return <span key={i} className={`flex-1 rounded-t-[2px] ${v >= a && v <= b ? 'bg-primary' : 'bg-zinc-200'}`} style={{ height: `${h}%` }} />;
        })}
      </div>
      <DualRange lo={pLo} hi={pHi} max={PMAX} onInput={set} />
      <NumRow lo={a} hi={b} unit="млн" onInput={set} />
    </div>
  );
}

// ─── Площадь ─────────────────────────────────────────────────────────────────
export function AreaSection({ filters, onChange }: Omit<FilterSectionProps, 'listings'> & { listings?: Listing[] }) {
  const unit = filters.areaUnit === 'sot' ? 'соток' : 'га';
  const { aLo, aHi } = filters;
  const a = Math.min(aLo, aHi), b = Math.max(aLo, aHi);
  const set = (lo: number, hi: number) => { const f = cloneFilters(filters); f.aLo = lo; f.aHi = hi; onChange(f); };
  return (
    <div>
      <div className="flex items-center justify-between gap-2.5 mb-3">
        <Seg
          options={[{ id: 'sot', label: 'соток' }, { id: 'ga', label: 'га' }]}
          value={filters.areaUnit}
          onSelect={id => { const f = cloneFilters(filters); f.areaUnit = id as 'sot' | 'ga'; onChange(f); }}
        />
        <div className="font-extrabold text-[13px] text-primary whitespace-nowrap tracking-[-0.02em]">
          {a} – {b >= AMAX ? `${b}+` : b} {unit}
        </div>
      </div>
      <DualRange lo={aLo} hi={aHi} max={AMAX} onInput={set} />
      <NumRow lo={a} hi={b} unit={unit} onInput={set} />
    </div>
  );
}

// ─── Чипы (коммуникации / документы / особенности / юридика) ────────────────
export function ChipGroup({ filters, onChange, listings, group }: FilterSectionProps & {
  group: 'utils' | 'docs' | 'feats' | 'legal';
}) {
  const { UTIL_PRED, DOC_PRED, FEAT_PRED, LEGAL_PRED } = optionPredicates;
  const conf = {
    utils: { options: UTIL_OPTIONS, preds: UTIL_PRED },
    docs: { options: DOC_OPTIONS, preds: DOC_PRED },
    feats: { options: FEAT_OPTIONS, preds: FEAT_PRED },
    legal: { options: LEGAL_OPTIONS, preds: LEGAL_PRED },
  }[group];
  const set = filters[group];
  return (
    <div className="flex flex-wrap gap-1.5">
      {conf.options.map(label => {
        const on = set.has(label);
        const count = countBy(listings, conf.preds[label]);
        return (
          <button
            key={label}
            type="button"
            onClick={() => { const f = cloneFilters(filters); f[group] = toggleSet(f[group], label); onChange(f); }}
            className={`h-[34px] px-3 rounded-full border text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
              on ? 'border-primary bg-[var(--brand-50,#f0fdf4)] text-[var(--brand-ink,#021A0E)]' : 'border-zinc-200 bg-white text-zinc-900'
            }`}
          >
            {label}
            <span className="text-[10.5px] font-mono opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Город / район (чеклист с поиском) ───────────────────────────────────────
export function CityChecklist({ filters, onChange, listings }: FilterSectionProps) {
  const [q, setQ] = useState('');
  const cities = useMemo(() => topCities(listings, 30), [listings]);
  const shown = q ? cities.filter(c => c.l.toLowerCase().includes(q.toLowerCase())) : cities;
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 h-[42px] px-3 border-b border-zinc-100">
        <Search className="size-[15px] text-zinc-400" strokeWidth={2.2} />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Поиск города или района…"
          className="flex-1 border-none outline-none bg-transparent text-[14px]"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {shown.map(c => {
          const on = filters.cities.has(c.l);
          return (
            <button
              key={c.l}
              type="button"
              onClick={() => { const f = cloneFilters(filters); f.cities = toggleSet(f.cities, c.l); onChange(f); }}
              className="w-full flex items-center gap-2.5 h-[42px] px-3 bg-white text-left border-t border-zinc-50 first:border-t-0"
            >
              <span className={`size-5 rounded-md border-2 shrink-0 flex items-center justify-center text-white ${on ? 'bg-primary border-primary' : 'border-zinc-300'}`}>
                {on && <Check className="size-3" strokeWidth={3.4} />}
              </span>
              <span className="text-[14px] font-medium flex-1 truncate">{c.l}</span>
              <span className="text-[11px] font-mono font-semibold text-zinc-400">{c.c}</span>
            </button>
          );
        })}
        {!shown.length && <div className="px-3 py-4 text-[13px] text-zinc-400">Не найдено</div>}
      </div>
    </div>
  );
}

// ─── Сортировка (вертикальный список с радио) ───────────────────────────────
export function SortList({ filters, onChange }: Omit<FilterSectionProps, 'listings'>) {
  return (
    <div className="flex flex-col gap-1.5">
      {SORTS.map((s, i) => {
        const on = filters.sort === i;
        return (
          <button
            key={s}
            type="button"
            onClick={() => { const f = cloneFilters(filters); f.sort = i; onChange(f); }}
            className={`flex items-center gap-2.5 w-full h-11 px-3 rounded-xl border text-left transition-colors ${
              on ? 'border-primary bg-[var(--brand-50,#f0fdf4)]' : 'border-zinc-200 bg-white'
            }`}
          >
            <span className={`size-[18px] rounded-full border-2 shrink-0 relative ${on ? 'border-primary' : 'border-zinc-300'}`}>
              {on && <span className="absolute inset-[3px] rounded-full bg-primary" />}
            </span>
            <span className={`text-[14px] ${on ? 'font-semibold text-[var(--brand-ink,#021A0E)]' : 'font-medium text-zinc-900'}`}>{s}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Секция с заголовком (для drawer / mobile sheet) ────────────────────────
export function FilterSectionBlock({ title, count, compact, children }: {
  title: string; count?: string | number | null; compact?: boolean; children: React.ReactNode;
}) {
  // «Компактно» → аккордеон (по умолчанию свёрнуто); «Секции» → всегда раскрыто
  const [open, setOpen] = useState(() => !compact);
  const collapsed = compact && !open;
  return (
    <div className="border-b border-zinc-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => compact && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 ${compact ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <SectionLabel title={title} count={count} />
        {compact && <ChevronDown className={`size-4 text-zinc-400 ml-auto transition-transform ${collapsed ? '-rotate-90' : ''}`} />}
      </button>
      {!collapsed && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ─── Полное тело фильтров — единое для drawer и мобильного sheet ────────────
export function AllFiltersBody({ filters, onChange, listings }: FilterSectionProps) {
  const [grouping, setGrouping] = useState<'sections' | 'compact'>('sections');
  const compact = grouping === 'compact';
  return (
    <>
      {/* режим отображения: Секции (всё раскрыто) / Компактно (аккордеон) */}
      <div className="grid grid-cols-2 gap-0.5 bg-zinc-100 border border-zinc-200 rounded-[11px] p-[3px] mb-1">
        {([['sections', 'Секции'], ['compact', 'Компактно']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setGrouping(id)}
            className={`h-8 rounded-lg text-[12.5px] font-semibold transition-colors ${
              grouping === id ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'text-zinc-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* key с grouping — при смене режима блоки перемонтируются с нужным начальным состоянием */}
      <FilterSectionBlock key={`t-${grouping}`} compact={compact} title="Тип участка" count={filters.types.size ? `${filters.types.size} выбрано` : null}>
        <TypeGrid filters={filters} onChange={onChange} listings={listings} />
      </FilterSectionBlock>
      <FilterSectionBlock key={`p-${grouping}`} compact={compact} title="Цена, млн ₸">
        <PriceSection filters={filters} onChange={onChange} listings={listings} />
      </FilterSectionBlock>
      <FilterSectionBlock key={`a-${grouping}`} compact={compact} title="Площадь">
        <AreaSection filters={filters} onChange={onChange} />
      </FilterSectionBlock>
      <FilterSectionBlock key={`u-${grouping}`} compact={compact} title="Коммуникации" count={filters.utils.size || null}>
        <ChipGroup filters={filters} onChange={onChange} listings={listings} group="utils" />
      </FilterSectionBlock>
      <FilterSectionBlock key={`d-${grouping}`} compact={compact} title="Документы" count={filters.docs.size || null}>
        <ChipGroup filters={filters} onChange={onChange} listings={listings} group="docs" />
      </FilterSectionBlock>
      <FilterSectionBlock key={`c-${grouping}`} compact={compact} title="Город / район" count={filters.cities.size || null}>
        <CityChecklist filters={filters} onChange={onChange} listings={listings} />
      </FilterSectionBlock>
      <FilterSectionBlock key={`f-${grouping}`} compact={compact} title="Особенности" count={filters.feats.size || null}>
        <ChipGroup filters={filters} onChange={onChange} listings={listings} group="feats" />
      </FilterSectionBlock>
      <FilterSectionBlock key={`l-${grouping}`} compact={compact} title="Юридика" count={filters.legal.size || null}>
        <ChipGroup filters={filters} onChange={onChange} listings={listings} group="legal" />
      </FilterSectionBlock>
      <FilterSectionBlock key={`s-${grouping}`} compact={compact} title="Сортировка">
        <SortList filters={filters} onChange={onChange} />
      </FilterSectionBlock>
    </>
  );
}

export function applyLabel(n: number): string {
  return `Показать ${nf(n)}`;
}
