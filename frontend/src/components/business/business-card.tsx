'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { CardMediaSlider } from '@/components/listings/card-media-slider';

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  cafe:       'Кафе / Ресторан',
  shop:       'Магазин',
  office:     'Офис',
  warehouse:  'Склад',
  production: 'Производство',
  service:    'АЗС / Автосервис',
  hotel:      'Отель / Хостел',
  land:       'Земля под бизнес',
  other:      'Другое',
};

const CONDITION_LABEL: Record<string, string> = {
  renovated:    'Свежий ремонт',
  good:         'Хорошее',
  needs_repair: 'Требует ремонта',
  shell:        'Под чистовую',
};

export function BusinessCard({ listing }: { listing: Listing }) {
  const price = new Intl.NumberFormat('ru-RU').format(listing.price);
  const perM2 = listing.buildingArea
    ? new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.buildingArea))
    : null;
  const allMedia = listing.images?.length ? listing.images : listing.image ? [listing.image] : [];
  const typeLabel = listing.businessType ? BUSINESS_TYPE_LABEL[listing.businessType] : null;
  const address = listing.address || listing.location;

  return (
    <Link
      href={`/business/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] bg-white border border-[var(--line)] shadow-[var(--sh-1)] hover:shadow-[var(--sh-2)] hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Фото */}
      <div className="relative w-full overflow-hidden bg-[var(--paper-2)] shrink-0" style={{ aspectRatio: '4/3' }}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          {allMedia.length > 0
            ? <CardMediaSlider images={allMedia} title={listing.title} />
            : <div className="w-full h-full bg-gradient-to-br from-[var(--paper-2)] to-[var(--paper-3)] flex items-center justify-center">
                <span className="text-4xl opacity-40">🏢</span>
              </div>
          }
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />

        {/* Бейджи */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
          {listing.dealType === 'rent' && (
            <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Аренда</span>
          )}
          {listing.isOperational && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Действующий</span>
          )}
        </div>

        {allMedia.length > 1 && (
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            {allMedia.length}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col px-3 pt-3 pb-3 gap-2 sm:px-4 sm:pt-4 sm:pb-4 sm:gap-3">
        {/* Тип · Площадь */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--ink-400)] font-medium">
          {typeLabel && <span className="text-[var(--ink-500)] font-semibold">{typeLabel}</span>}
          {typeLabel && listing.buildingArea && <span>·</span>}
          {listing.buildingArea && <span>{listing.buildingArea} м²</span>}
          {listing.floor != null && <><span>·</span><span>{listing.floor} эт.</span></>}
        </div>

        {/* Цена */}
        <div className="-mt-0.5">
          <p className="text-lg sm:text-2xl font-bold text-[var(--ink-900)] leading-none tabular-nums tracking-tight">
            {price} ₸
          </p>
          {perM2 && <p className="text-[11px] sm:text-xs text-[var(--ink-400)] mt-1 tabular-nums">{perM2} ₸/м²</p>}
        </div>

        {/* Адрес */}
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="size-3 sm:size-3.5 shrink-0 text-[var(--ink-400)]" />
          <span className="text-[11px] sm:text-[12.5px] text-[var(--ink-400)] truncate">{address}</span>
        </div>

        {/* Теги */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--line-soft)]">
          {listing.condition && (
            <span className="bg-[var(--paper-3)] text-[var(--ink-500)] text-[10px] font-medium px-2 py-0.5 rounded-full">
              {CONDITION_LABEL[listing.condition] ?? listing.condition}
            </span>
          )}
          {listing.hasParking && (
            <span className="bg-[var(--paper-3)] text-[var(--ink-500)] text-[10px] font-medium px-2 py-0.5 rounded-full">Парковка</span>
          )}
          {listing.hasElectricity && (
            <span className="bg-yellow-50 text-yellow-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Свет</span>
          )}
          {listing.hasGas && (
            <span className="bg-orange-50 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Газ</span>
          )}
          {listing.hasWater && (
            <span className="bg-cyan-50 text-cyan-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Вода</span>
          )}
        </div>
      </div>
    </Link>
  );
}
