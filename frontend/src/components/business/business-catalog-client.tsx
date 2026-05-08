'use client';

import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { BusinessCard } from './business-card';

const BUSINESS_TYPES = [
  { value: 'cafe',       label: 'Кафе / Ресторан' },
  { value: 'shop',       label: 'Магазин' },
  { value: 'office',     label: 'Офис' },
  { value: 'warehouse',  label: 'Склад' },
  { value: 'production', label: 'Производство' },
  { value: 'service',    label: 'АЗС / Автосервис' },
  { value: 'hotel',      label: 'Отель / Хостел' },
  { value: 'other',      label: 'Другое' },
];

interface Props {
  allListings: Listing[];
}

export function BusinessCatalogClient({ allListings }: Props) {
  const [dealType, setDealType]       = useState<'all' | 'sale' | 'rent'>('all');
  const [bizType, setBizType]         = useState('');
  const [priceFrom, setPriceFrom]     = useState('');
  const [priceTo, setPriceTo]         = useState('');
  const [areaFrom, setAreaFrom]       = useState('');
  const [areaTo, setAreaTo]           = useState('');
  const [location, setLocation]       = useState('');
  const [isOperational, setIsOperational] = useState(false);
  const [hasParking, setHasParking]   = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasGas, setHasGas]           = useState(false);
  const [hasWater, setHasWater]       = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fmt = (v: string) => v.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const raw = (v: string) => Number(v.replace(/\s/g, ''));

  const locations = useMemo(() =>
    [...new Set(allListings.map(l => l.location).filter(Boolean))].sort(), [allListings]);

  const filtered = useMemo(() => {
    return allListings.filter(l => {
      if (dealType !== 'all' && l.dealType !== dealType) return false;
      if (bizType && l.businessType !== bizType) return false;
      if (location && l.location !== location) return false;
      if (priceFrom && l.price < raw(priceFrom)) return false;
      if (priceTo && l.price > raw(priceTo)) return false;
      if (areaFrom && (l.buildingArea ?? 0) < Number(areaFrom)) return false;
      if (areaTo && (l.buildingArea ?? 0) > Number(areaTo)) return false;
      if (isOperational && !l.isOperational) return false;
      if (hasParking && !l.hasParking) return false;
      if (hasElectricity && !l.hasElectricity) return false;
      if (hasGas && !l.hasGas) return false;
      if (hasWater && !l.hasWater) return false;
      return true;
    });
  }, [allListings, dealType, bizType, location, priceFrom, priceTo, areaFrom, areaTo, isOperational, hasParking, hasElectricity, hasGas, hasWater]);

  const hasActiveFilters = dealType !== 'all' || bizType || location || priceFrom || priceTo || areaFrom || areaTo || isOperational || hasParking || hasElectricity || hasGas || hasWater;

  const reset = () => {
    setDealType('all'); setBizType(''); setLocation('');
    setPriceFrom(''); setPriceTo(''); setAreaFrom(''); setAreaTo('');
    setIsOperational(false); setHasParking(false);
    setHasElectricity(false); setHasGas(false); setHasWater(false);
  };

  const inputCls = 'w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';
  const selectCls = inputCls + ' cursor-pointer';
  const checkCls = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer select-none transition-all ${
      active ? 'bg-primary-soft border-primary text-primary' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
    }`;

  return (
    <div>
      {/* Тип сделки + кнопка фильтров */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex rounded-xl bg-zinc-100 p-1 gap-1">
          {([['all', 'Все'], ['sale', 'Продажа'], ['rent', 'Аренда']] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setDealType(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                dealType === v ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            showFilters || hasActiveFilters ? 'bg-primary text-white border-primary' : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
          }`}>
          <SlidersHorizontal className="size-4" />
          Фильтры
          {hasActiveFilters && <span className="bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">●</span>}
        </button>
        {hasActiveFilters && (
          <button onClick={reset} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="size-3.5" /> Сбросить
          </button>
        )}
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Тип бизнеса */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Тип бизнеса</label>
              <select value={bizType} onChange={e => setBizType(e.target.value)} className={selectCls}>
                <option value="">Все типы</option>
                {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Город */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Город</label>
              <select value={location} onChange={e => setLocation(e.target.value)} className={selectCls}>
                <option value="">Все города</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Площадь */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Площадь (м²)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="От" value={areaFrom} onChange={e => setAreaFrom(e.target.value)} className={inputCls} />
                <input type="number" placeholder="До" value={areaTo} onChange={e => setAreaTo(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Цена от */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Цена от (₸)</label>
              <input placeholder="0" value={priceFrom} onChange={e => setPriceFrom(fmt(e.target.value))} className={inputCls} />
            </div>

            {/* Цена до */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Цена до (₸)</label>
              <input placeholder="Без ограничений" value={priceTo} onChange={e => setPriceTo(fmt(e.target.value))} className={inputCls} />
            </div>
          </div>

          {/* Чекбоксы */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Особенности</label>
            <div className="flex flex-wrap gap-2">
              <label className={checkCls(isOperational)}>
                <input type="checkbox" className="hidden" checked={isOperational} onChange={e => setIsOperational(e.target.checked)} />
                Действующий бизнес
              </label>
              <label className={checkCls(hasParking)}>
                <input type="checkbox" className="hidden" checked={hasParking} onChange={e => setHasParking(e.target.checked)} />
                Парковка
              </label>
              <label className={checkCls(hasElectricity)}>
                <input type="checkbox" className="hidden" checked={hasElectricity} onChange={e => setHasElectricity(e.target.checked)} />
                Электричество
              </label>
              <label className={checkCls(hasGas)}>
                <input type="checkbox" className="hidden" checked={hasGas} onChange={e => setHasGas(e.target.checked)} />
                Газ
              </label>
              <label className={checkCls(hasWater)}>
                <input type="checkbox" className="hidden" checked={hasWater} onChange={e => setHasWater(e.target.checked)} />
                Вода
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Результаты */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">
          {filtered.length === 0 ? 'Ничего не найдено' : `${filtered.length} объявлений`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 px-4 text-center">
          <div className="bg-zinc-100 p-4 rounded-2xl mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <p className="text-base font-semibold text-zinc-700 mb-1">Ничего не найдено</p>
          <p className="text-sm text-zinc-400">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(listing => (
            <BusinessCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
