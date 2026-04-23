import { Container } from '@/components/layout/container';
import { mockListings } from '@/lib/mock-data';
import { getListingById, getListings } from '@/lib/api';
import { notFound } from 'next/navigation';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { ListingDescription } from '@/components/listings/listing-description';
import { ContactCard } from '@/components/listings/contact-card';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { Breadcrumb } from '@/components/listings/Breadcrumb';
import { SLUG_LANDTYPE, listingUrl } from '@/lib/listing-url';
import Link from 'next/link';
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next';

interface Props {
  params: Promise<{ type: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListingById(id)
  if (!listing) return {}
  return {
    title: `${listing.title} — 6sotok.kz`,
    description: `${listing.area} соток, ${listing.location}. Цена ${new Intl.NumberFormat('ru-RU').format(listing.price)} ₸`,
  }
}

const LOCATION_LABELS: Record<string, string> = {
  city: 'В городе', suburb: 'В пригороде', highway: 'Вдоль трассы',
  water: 'Возле водоёма', foothills: 'В предгорьях', dacha: 'В дачном массиве',
}

export default async function ListingPage({ params }: Props) {
  const { type, id } = await params
  const apiListing = await getListingById(id)
  const listing = apiListing ?? mockListings.find(l => String(l.id) === id)
  if (!listing) notFound()

  const landTypeLabel = SLUG_LANDTYPE[type] ?? listing.landType ?? 'Участок'
  const apiSimilar = await getListings({ limit: '4' })
  const similarListings = (apiSimilar.length > 0 ? apiSimilar : mockListings)
    .filter(l => l.id !== listing.id).slice(0, 3)

  const formattedPrice = new Intl.NumberFormat('ru-RU').format(listing.price)
  const pricePerSotka = Math.round(listing.price / listing.area)
  const formattedPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka)
  const cleanPhone = listing.seller?.phone?.replace(/\D/g, '') ?? ''

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Каталог', href: '/catalog' },
    { label: landTypeLabel, href: `/catalog?type=${landTypeLabel}` },
    { label: listing.title },
  ]

  const allMedia = (listing.images && listing.images.length > 0) ? listing.images : listing.image ? [listing.image] : []

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <div className="py-6 lg:py-10 pb-28 lg:pb-16">
        <Container>

          {/* Хлебные крошки */}
          <div className="mb-5">
            <Breadcrumb items={breadcrumbs} />
          </div>

          {/* Основная сетка */}
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">

            {/* ── Левая колонка ─────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Галерея */}
              <ListingGallery title={listing.title} images={allMedia} />

              {/* Заголовок + бейджи */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-black tracking-widest text-white uppercase">
                    {listing.purpose || listing.landType}
                  </span>
                  {listing.isNegotiable && (
                    <span className="rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-black text-amber-900 uppercase tracking-wider">Торг</span>
                  )}
                  {listing.locationType?.map(t => (
                    <span key={t} className="text-[11px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
                      {LOCATION_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-tight">
                  {listing.title}
                </h1>
                <div className="mt-3 flex items-center gap-2 text-[14px] text-zinc-500 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {listing.location}
                </div>
              </div>

              {/* Цена — только мобайл */}
              <div className="lg:hidden bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-3xl font-black tracking-tight text-zinc-900">{formattedPrice} ₸</span>
                      {listing.isNegotiable && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Торг</span>
                      )}
                    </div>
                    <div className="mt-1 text-[13px] font-bold text-zinc-400">{formattedPerSotka} ₸ / сотка</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-1">Площадь</div>
                    <div className="text-2xl font-black text-zinc-900">{listing.area} <span className="text-base font-bold text-zinc-400">сот.</span></div>
                  </div>
                </div>
              </div>

              {/* Коммуникации */}
              {(listing.hasElectricity || listing.hasGas || listing.hasWater || listing.hasSewer || listing.hasRoadAccess) && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-4">Коммуникации</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Электричество', key: listing.hasElectricity, icon: '⚡', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
                      { label: 'Газ', key: listing.hasGas, icon: '🔵', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                      { label: 'Вода', key: listing.hasWater, icon: '💧', color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
                      { label: 'Канализация', key: listing.hasSewer, icon: '⚙️', color: 'text-zinc-600 bg-zinc-50 border-zinc-200' },
                      { label: 'Дорога', key: listing.hasRoadAccess, icon: '🛣️', color: 'text-stone-600 bg-stone-50 border-stone-200' },
                    ].map(({ label, key, icon, color }) => (
                      <div key={label} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${key ? color : 'text-zinc-300 bg-zinc-50 border-zinc-100'}`}>
                        <span className="text-base leading-none">{icon}</span>
                        <div>
                          <div className={`text-[11px] font-black uppercase tracking-wide ${key ? '' : 'text-zinc-300'}`}>{label}</div>
                          <div className={`text-[10px] font-bold mt-0.5 ${key ? '' : 'text-zinc-300'}`}>{key ? 'Есть' : 'Нет'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Параметры */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-4">Параметры участка</h2>
                <div className="divide-y divide-zinc-100">
                  {[
                    { label: 'Площадь', value: `${listing.area} соток` },
                    listing.landType && { label: 'Тип', value: listing.landType },
                    listing.purpose && { label: 'Назначение', value: listing.purpose },
                    listing.landCategory && { label: 'Категория', value: listing.landCategory },
                    listing.ownershipType && { label: 'Форма собственности', value: listing.ownershipType },
                    listing.reliefType && { label: 'Рельеф', value: listing.reliefType },
                    listing.plotShape && { label: 'Форма участка', value: listing.plotShape },
                    listing.frontWidth && { label: 'Ширина фасада', value: `${listing.frontWidth} м` },
                    listing.depth && { label: 'Глубина', value: `${listing.depth} м` },
                    { label: 'Делимость', value: listing.isDivisible ? 'Делимый' : 'Неделимый' },
                  ].filter(Boolean).map((item) => { const { label, value } = item as { label: string; value: string }; return (
                    <div key={label} className="flex items-center justify-between py-3">
                      <span className="text-[13px] font-semibold text-zinc-500">{label}</span>
                      <span className="text-[13px] font-black text-zinc-900 text-right ml-4">{value}</span>
                    </div>
                  ); })}
                </div>
              </div>

              {/* Юридика */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-4">Юридика</h2>
                <div className="divide-y divide-zinc-100">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[13px] font-semibold text-zinc-500">Государственный акт</span>
                    <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${listing.hasStateAct !== false ? 'text-green-700 bg-green-50' : 'text-zinc-500 bg-zinc-100'}`}>
                      {listing.hasStateAct !== false ? 'Есть' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[13px] font-semibold text-zinc-500">Залог</span>
                    <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${listing.isPledged ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                      {listing.isPledged ? 'В залоге' : 'Без залога'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[13px] font-semibold text-zinc-500">Красная линия</span>
                    <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${listing.isOnRedLine ? 'text-red-700 bg-red-50' : 'text-zinc-500 bg-zinc-100'}`}>
                      {listing.isOnRedLine ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  {listing.hasEncumbrances !== undefined && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[13px] font-semibold text-zinc-500">Обременения</span>
                      <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${listing.hasEncumbrances ? 'text-red-700 bg-red-50' : 'text-zinc-500 bg-zinc-100'}`}>
                        {listing.hasEncumbrances ? 'Есть' : 'Нет'}
                      </span>
                    </div>
                  )}
                  {listing.cadastralNumber && (
                    <div className="py-3">
                      <div className="text-[13px] font-semibold text-zinc-500 mb-2">Кадастровый номер</div>
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-mono text-[14px] font-black text-zinc-800 tracking-widest">
                        {listing.cadastralNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Описание */}
              {listing.description && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-4">Описание</h2>
                  <ListingDescription text={listing.description} />
                </div>
              )}

              {/* ID */}
              <div className="flex items-center gap-2 text-[12px] text-zinc-300 font-bold">
                <span>ID объявления:</span>
                <span className="font-mono">{listing.id}</span>
              </div>
            </div>

            {/* ── Правая колонка (sticky) ────────────────── */}
            <div className="lg:col-span-2 hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <ContactCard
                  price={listing.price}
                  pricePerSotka={pricePerSotka}
                  seller={listing.seller}
                  slug={listing.slug}
                  title={listing.title}
                  isNegotiable={listing.isNegotiable}
                />
                {/* Быстрые характеристики в сайдбаре */}
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Площадь</div>
                      <div className="text-xl font-black text-zinc-900">{listing.area}</div>
                      <div className="text-[10px] font-bold text-zinc-400">соток</div>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Цена/сотка</div>
                      <div className="text-sm font-black text-primary leading-tight">{formattedPerSotka}</div>
                      <div className="text-[10px] font-bold text-zinc-400">₸</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Похожие объявления */}
          {similarListings.length > 0 && (
            <div className="mt-16 pt-10 border-t border-zinc-200">
              <div className="flex items-end justify-between mb-7">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">Похожие участки</h2>
                <Link href="/catalog" className="text-[13px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors">
                  Все объявления →
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similarListings.map(l => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </div>
            </div>
          )}

        </Container>
      </div>

      {/* Мобильный фиксированный бар */}
      <MobileContactBar
        price={listing.price}
        pricePerSotka={pricePerSotka}
        seller={listing.seller}
        slug={listing.slug}
        title={listing.title}
        isNegotiable={listing.isNegotiable}
      />
    </div>
  )
}
