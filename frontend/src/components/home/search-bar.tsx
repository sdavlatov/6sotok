'use client';

import { Search, MapPin, Ruler, Wallet, Zap, Flame, Droplets, ShieldCheck, AlertTriangle, Scissors, List, Map } from 'lucide-react';
import { Container } from '../layout/container';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushDataLayer } from '@/lib/analytics';

type ViewMode = 'list' | 'map';

const PURPOSES = [
  { label: 'Все участки', value: '' },
  { label: 'ИЖС', value: 'ИЖС' },
  { label: 'Коммерция', value: 'Коммерция' },
  { label: 'Сельхоз', value: 'Сельхоз' },
  { label: 'Дача', value: 'Дача' },
];

const UTILITIES = [
  { key: 'Электричество', icon: Zap, label: 'Электричество' },
  { key: 'Газ', icon: Flame, label: 'Газ' },
  { key: 'Вода', icon: Droplets, label: 'Вода' },
];

const LEGAL = [
  { key: 'Без залога', icon: ShieldCheck, label: 'Без залога' },
  { key: 'Без красной линии', icon: AlertTriangle, label: 'Без красной линии' },
  { key: 'Делимый', icon: Scissors, label: 'Делимый' },
];

export function SearchBar() {
  const router = useRouter();
  const [purpose, setPurpose] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [location, setLocation] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  const handleSearch = () => {
    pushDataLayer('search_submit', {
      type: purpose || null,
      price_from: priceFrom || null,
      price_to: priceTo || null,
      location: location || null,
    });
    const params = new URLSearchParams();
    if (purpose) params.set('type', purpose);
    if (priceFrom) params.set('priceFrom', priceFrom);
    if (priceTo) params.set('priceTo', priceTo);
    if (location) params.set('location', location);
    router.push(`/catalog${params.toString() ? '?' + params.toString() : ''}`);
  };

  const toggleFilter = (key: string) => {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isActive = (key: string) => activeFilters.includes(key);

  return (
    <Container className="relative z-20 -mt-12 mb-24">
      <div className="mx-auto max-w-7xl rounded-2xl bg-white shadow-[0_8px_48px_-8px_rgba(0,0,0,0.14)] border border-zinc-200 overflow-hidden">

        {/* Row 1: Назначение вкладки + List/Map toggle */}
        <div className="flex items-center justify-between gap-2 px-6 pt-5 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {PURPOSES.map(p => (
              <button
                key={p.value}
                onClick={() => setPurpose(p.value)}
                className={`shrink-0 px-5 py-2.5 text-[14px] font-semibold rounded-t-xl border-b-2 transition-all ${
                  purpose === p.value
                    ? 'border-primary text-primary bg-primary-soft/30'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* List / Map Toggle */}
          <div className="flex items-center shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <List className="w-4 h-4" strokeWidth={2} />
              Список
            </button>
            <Link
              href="/catalog"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Map className="w-4 h-4" strokeWidth={2} />
              На карте
            </Link>
          </div>
        </div>

        <div className="border-b border-zinc-100 mx-6" />

        {/* Row 2: Основные поля */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-5">

          {/* Локация */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Локация</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
              <input
                type="text"
                placeholder="Город, район, трасса..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none"
              />
            </div>
          </div>

          {/* Площадь */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Площадь, соток</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
                <Ruler className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
                <input type="number" placeholder="От" className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
              </div>
              <span className="text-zinc-300 text-lg shrink-0">—</span>
              <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
                <input type="number" placeholder="До" className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
              </div>
            </div>
          </div>

          {/* Цена */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Цена, ₸</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
                <Wallet className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2} />
                <input type="number" placeholder="От" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
              </div>
              <span className="text-zinc-300 text-lg shrink-0">—</span>
              <div className="flex-1 flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 focus-within:border-primary focus-within:bg-white transition-all">
                <input type="number" placeholder="До" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} className="w-full bg-transparent text-[14px] font-medium text-zinc-900 placeholder-zinc-400 outline-none" />
              </div>
            </div>
          </div>

        </div>

        {/* Row 3: Коммуникации + Юридическая чистота + Кнопка */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-6 pb-5">

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">

            {/* Коммуникации */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Коммуникации</span>
              <div className="flex gap-2">
                {UTILITIES.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleFilter(key)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all select-none ${
                      isActive(key)
                        ? 'border-primary bg-primary-soft text-primary shadow-sm'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Вертикальный разделитель */}
            <div className="hidden sm:block w-px bg-zinc-100 self-stretch mx-2" />

            {/* Юридическая чистота */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Юридическая чистота</span>
              <div className="flex gap-2">
                {LEGAL.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleFilter(key)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all select-none ${
                      isActive(key)
                        ? 'border-primary bg-primary-soft text-primary shadow-sm'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Кнопка поиска */}
          <button
            onClick={handleSearch}
            className="flex w-full lg:w-auto shrink-0 items-center justify-center gap-2.5 rounded-xl bg-primary px-10 py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95"
          >
            <Search className="w-5 h-5" strokeWidth={2.5} />
            Найти участки
          </button>

        </div>

      </div>
    </Container>
  );
}
