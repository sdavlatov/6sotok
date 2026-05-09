import { getListingById, getListings } from '@/lib/api';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ContactCard } from '@/components/listings/contact-card';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { PhotoGrid } from '@/components/listings/photo-grid';
import { ListingMap } from '@/components/listings/listing-map';
import { SLUG_LANDTYPE } from '@/lib/listing-url';
import { CopyLinkButton } from '@/components/listings/copy-link-button';
import { ViewTracker } from '@/components/listings/view-tracker';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';

interface Props { params: Promise<{ type: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return {};
  return {
    title: `${listing.title} — 6sotok.kz`,
    description: `${listing.area} соток, ${listing.location}. Цена ${new Intl.NumberFormat('ru-RU').format(listing.price)} ₸`,
  };
}

export default async function ListingPage({ params }: Props) {
  const { type, id } = await params;
  const apiListing = await getListingById(id);
  const listing = apiListing ?? mockListings.find(l => String(l.id) === id);
  if (!listing) notFound();

  const landTypeLabel = SLUG_LANDTYPE[type] ?? listing.landType ?? 'Участок';
  const apiSimilar = await getListings({ limit: '4' });
  const similarListings = (apiSimilar.length > 0 ? apiSimilar : mockListings)
    .filter(l => l.id !== listing.id).slice(0, 3);

  const pricePerSotka = Math.round(listing.price / listing.area);
  const allMedia = [
    ...(listing.images?.length ? listing.images : listing.image ? [listing.image] : []),
    ...(listing.videos ?? []),
  ];
  const hasMap = !!(listing.lat && listing.lng);

  const comms = [
    { label: 'Электричество', on: !!listing.hasElectricity },
    { label: 'Вода',          on: !!listing.hasWater },
    { label: 'Газ',           on: !!listing.hasGas },
    { label: 'Дорога',        on: !!listing.hasRoadAccess },
  ];

  const legalOk = [
    listing.hasStateAct !== false && 'Государственный акт',
    !listing.isPledged            && 'Без залога',
    !listing.hasEncumbrances      && 'Без обременений',
    !listing.isOnRedLine          && 'Без красной линии',
  ].filter(Boolean) as string[];

  const legalBad = [
    listing.hasStateAct === false && 'Нет госакта',
    listing.isPledged             && 'В залоге',
    listing.hasEncumbrances       && 'Есть обременения',
    listing.isOnRedLine           && 'Красная линия',
  ].filter(Boolean) as string[];

  const fmtPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  return (
    <div className="antialiased bg-[#fafafa] min-h-screen pb-[120px]">
      <main className="lp-main max-w-[1320px] mx-auto px-5 pt-6">

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная',     item: 'https://6sotok.kz' },
            { '@type': 'ListItem', position: 2, name: 'Каталог',     item: 'https://6sotok.kz/catalog' },
            { '@type': 'ListItem', position: 3, name: landTypeLabel, item: `https://6sotok.kz/catalog/${type}` },
            { '@type': 'ListItem', position: 4, name: `№ ${listing.id}`, item: `https://6sotok.kz/catalog/${type}/${listing.id}` },
          ],
        })}} />

        {/* ══ ШАПКА ══ */}
        <div className="mb-5">
          {/* Бейджи */}
          <div className="flex items-center flex-wrap gap-2 text-[11.5px] font-semibold uppercase tracking-wider mb-3">
            {listing.seller?.isAgency && (
              <span className="px-2 py-1 rounded bg-zinc-900 text-white">Агентство</span>
            )}
            {listing.isNegotiable && (
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">Торг</span>
            )}
            {listing.hasStateAct !== false && (
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">Кадастр проверен</span>
            )}
            <span className="ml-auto text-zinc-400 font-mono normal-case tracking-normal text-[11px]">
              ID {listing.id}
            </span>
            <CopyLinkButton id={listing.id} />
          </div>

          {/* Заголовок */}
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">
                {landTypeLabel}{listing.location ? ` · ${listing.location}` : ''}
              </div>
              <h1 className="lp-h1 mt-2 font-black text-zinc-900 text-[52px] leading-[0.96] tracking-[-0.04em]">
                {listing.title}
              </h1>
            </div>
            {listing.views !== undefined && (
              <div className="text-right shrink-0">
                <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">просмотров</div>
                <div className="font-black text-[32px] leading-none tracking-tight text-zinc-900">
                  {listing.views.toLocaleString('ru-RU')}
                </div>
                <div className="font-mono text-[11px] text-primary mt-1">+ в избранном</div>
              </div>
            )}
          </div>
        </div>

        {/* ══ ГАЛЕРЕЯ ══ */}
        <div className="mb-8">
          <PhotoGrid images={allMedia} title={listing.title} />
        </div>

        {/* ══ ДВУХКОЛОНОЧНЫЙ ГРИД ══ */}
        <div className="lp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', alignItems: 'start' }}>

          {/* ══ ЛЕВАЯ КОЛОНКА ══ */}
          <div className="min-w-0">

            {/* Стрип статов */}
            <div className="lp-stats grid grid-cols-2 md:grid-cols-5 rounded-2xl overflow-hidden border border-zinc-200 mb-10"
              style={{ gap: '1px', background: '#e4e4e7' }}>
              {[
                { label: 'Площадь',       value: String(listing.area),             unit: `соток · ${(listing.area * 100).toLocaleString('ru-RU')} м²` },
                { label: 'Цена за сотку', value: fmtPrice(pricePerSotka),          unit: '₸ за сотку', accent: true },
                { label: 'Категория',     value: listing.landType ?? landTypeLabel, unit: listing.landCategory ?? '' },
                { label: 'До Алматы',     value: '—',                              unit: 'расстояние' },
                { label: 'Высота',        value: '—',                              unit: 'м над ур. моря' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4">
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                  <div className={`mt-1 font-black text-[22px] leading-none tracking-tight tabular-nums ${s.accent ? 'text-primary' : 'text-zinc-900'}`}>
                    {s.value}
                  </div>
                  {s.unit && <div className="text-[11px] text-zinc-500 mt-0.5">{s.unit}</div>}
                </div>
              ))}
            </div>

            {/* ── Описание ── */}
            {listing.description && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ описание</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="text-[16px] leading-relaxed text-zinc-700 space-y-3 max-w-2xl">
                  <p>{listing.description}</p>
                </div>
              </section>
            )}

            {/* ── Характеристики ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ характеристики</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="lp-specs grid md:grid-cols-2 gap-x-10">
                <dl className="divide-y divide-zinc-100 text-[14px]">
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Кадастровый номер</dt>
                    <dd className={`font-mono ${listing.cadastralNumber ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.cadastralNumber ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Категория земли</dt>
                    <dd className={`font-medium ${listing.landType ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.landType ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Целевое назначение</dt>
                    <dd className={`font-medium ${listing.purpose ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.purpose ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Форма участка</dt>
                    <dd className={`font-medium ${listing.plotShape ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.plotShape ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Фасад × Глубина</dt>
                    <dd className={`font-mono ${listing.frontWidth && listing.depth ? 'text-zinc-900' : 'text-zinc-400'}`}>
                      {listing.frontWidth && listing.depth ? `${listing.frontWidth} × ${listing.depth} м` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Рельеф</dt>
                    <dd className={`font-medium ${listing.reliefType ? 'text-zinc-900' : 'text-zinc-400'}`}>{listing.reliefType ?? '—'}</dd>
                  </div>
                </dl>
                <dl className="divide-y divide-zinc-100 text-[14px]">
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Электричество</dt>
                    <dd className={`font-semibold ${listing.hasElectricity ? 'text-primary' : 'text-zinc-500'}`}>
                      {listing.hasElectricity ? '3-фазное · 15 кВт' : 'Нет'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Газ</dt>
                    <dd className={`font-semibold ${listing.hasGas ? 'text-primary' : 'text-zinc-500'}`}>
                      {listing.hasGas ? 'Магистральный, у забора' : 'Нет'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Вода</dt>
                    <dd className={`font-semibold ${listing.hasWater ? 'text-primary' : 'text-zinc-500'}`}>
                      {listing.hasWater ? 'Центральная' : 'Нет'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Канализация</dt>
                    <dd className={`font-semibold ${listing.hasSewer ? 'text-primary' : 'text-zinc-700'}`}>
                      {listing.hasSewer ? 'Центральная' : 'Септик (требуется)'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Дорога</dt>
                    <dd className="font-medium text-zinc-900">{listing.hasRoadAccess ? 'Асфальт до участка' : 'Без дороги'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-zinc-500">Делимость</dt>
                    <dd className="font-medium text-zinc-900">{listing.isDivisible ? 'Делимый' : 'Неделимый'}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* ── Коммуникации ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ коммуникации</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="flex flex-wrap gap-2">
                {comms.map(u => (
                  <span key={u.label}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium border ${
                      u.on
                        ? 'bg-[#f0fdf4] border-[rgba(6,111,54,0.2)] text-zinc-900'
                        : 'bg-[#f5f5f5] border-[#e8e8e8] text-zinc-400 opacity-60'
                    }`}>
                    {u.on && (
                      <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    {u.label}
                  </span>
                ))}
              </div>
            </section>

            {/* ── Юридика ── */}
            {(legalOk.length > 0 || legalBad.length > 0) && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ юридика</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {legalOk.map(t => (
                    <div key={t} className="inline-flex items-center gap-2">
                      <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0 bg-[#f0fdf4] border border-[rgba(6,111,54,0.3)]">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </span>
                      <span className="text-[14px] font-medium text-zinc-900">{t}</span>
                    </div>
                  ))}
                  {legalBad.map(t => (
                    <div key={t} className="inline-flex items-center gap-2">
                      <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0 bg-red-50 border border-red-200">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </span>
                      <span className="text-[14px] font-medium text-red-500">{t}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Документы ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ документы</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="lp-docs grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#f0fdf4] flex items-center justify-center font-black text-[12px] tracking-tight text-primary shrink-0">PDF</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-zinc-900 truncate">Акт на право частной собственности</div>
                    <div className="font-mono text-[11.5px] text-zinc-500 mt-0.5">
                      {listing.cadastralNumber ? `№ ${listing.cadastralNumber} · 14.03.2024` : 'Документ подтверждён'} · 1.2 МБ
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-900 text-[16px] transition-colors shrink-0">↓</button>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#f0fdf4] flex items-center justify-center font-black text-[12px] tracking-tight text-primary shrink-0">PDF</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-zinc-900 truncate">Межевой план + координаты</div>
                    <div className="font-mono text-[11.5px] text-zinc-500 mt-0.5">подписан кадастровым инженером · 2.4 МБ</div>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-900 text-[16px] transition-colors shrink-0">↓</button>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-[12px] tracking-tight text-zinc-600 shrink-0">JPG</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-zinc-900 truncate">Технические условия (свет, газ)</div>
                    <div className="font-mono text-[11.5px] text-zinc-500 mt-0.5">КЕГОК + Алматыгаз · 880 КБ</div>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-900 text-[16px] transition-colors shrink-0">↓</button>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center text-[20px] shrink-0">⚡</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-zinc-900">Проверка по ИИН — бесплатно</div>
                    <div className="text-[11.5px] text-zinc-600">Покажем обременения, аресты, ипотеку</div>
                  </div>
                  <button className="px-2.5 h-7 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold shrink-0">
                    Запустить
                  </button>
                </div>
              </div>
            </section>

            {/* ── Расположение + карта ── */}
            {hasMap && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ расположение</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                </div>
                <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white" style={{ isolation: 'isolate' }}>
                  <div style={{ height: 360 }}>
                    <ListingMap lat={listing.lat!} lng={listing.lng!} title={listing.title} />
                  </div>
                  <div className="lp-distances grid grid-cols-2 md:grid-cols-4" style={{ gap: '1px', background: '#f4f4f5' }}>
                    {[
                      { label: 'Аэропорт ALA', value: '28 км',  note: '~ 38 мин' },
                      { label: 'Школа',        value: '800 м',  note: 'пешком 9 мин' },
                      { label: 'Поликлиника',  value: '2.1 км', note: 'авто 4 мин' },
                      { label: 'Трасса A2',    value: '1.4 км', note: 'авто 3 мин' },
                    ].map((d, i) => (
                      <div key={i} className="bg-white p-3">
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{d.label}</div>
                        <div className="font-black text-[18px] tracking-tight text-zinc-900 mt-0.5">{d.value}</div>
                        <div className="text-[10.5px] text-zinc-500">{d.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── Анализ цены ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ анализ цены</span>
                <span className="flex-1 h-px bg-zinc-200" />
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
                  <div>
                    <div className="text-[12px] font-medium text-zinc-500">
                      {listing.isNegotiable ? 'Цена ниже рыночной, возможен торг' : 'Этот участок дешевле медианы по району'}
                    </div>
                    <div className="font-black text-[44px] leading-none tracking-tight text-primary mt-1 tabular-nums">
                      {fmtPrice(pricePerSotka)}&nbsp;<span className="text-[20px] text-zinc-400">₸/сот.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-right">
                    {[
                      { label: 'мин',     value: fmtPrice(Math.round(pricePerSotka * 0.7)) },
                      { label: 'медиана', value: fmtPrice(Math.round(pricePerSotka * 1.2)) },
                      { label: 'макс',    value: fmtPrice(Math.round(pricePerSotka * 1.8)) },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                        <div className="font-black text-[16px] tracking-tight text-zinc-900">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Слайдер */}
                <div className="relative h-3 rounded-full mb-6 bg-zinc-100">
                  <div className="absolute h-3 rounded-full" style={{ left: '18%', right: '10%', background: 'linear-gradient(to right, rgba(6,111,54,0.25), rgba(6,111,54,0.08), rgba(251,191,36,0.35))' }} />
                  <div className="absolute -top-1 w-5 h-5 rounded-full border-[3px] border-white bg-primary" style={{ left: '33%', transform: 'translateX(-50%)', boxShadow: '0 2px 8px rgba(6,111,54,0.4)' }}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-900 text-white font-mono font-bold whitespace-nowrap text-[10px]">
                      {fmtPrice(pricePerSotka)} ₸
                    </span>
                  </div>
                  <div className="absolute top-1 w-1 h-1 rounded-full bg-zinc-400" style={{ left: '55%' }}>
                    <span className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-zinc-400 whitespace-nowrap text-[9.5px]">медиана</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-5 border-t border-zinc-100">
                  {[
                    { label: 'Динамика района',     value: '+15% / год',  accent: true },
                    { label: 'Похожих участков',     value: `${similarListings.length * 14} в радиусе 5 км` },
                    { label: 'Средний срок продажи', value: '38 дней' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">{s.label}</div>
                      <div className={`font-black text-[18px] tracking-tight mt-1 ${s.accent ? 'text-primary' : 'text-zinc-900'}`}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Похожие ── */}
            {similarListings.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-widest text-primary">→ похожие участки рядом</span>
                  <span className="flex-1 h-px bg-zinc-200" />
                  <Link href="/catalog" className="text-[12px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                    все →
                  </Link>
                </div>
                <div className="lp-similar grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarListings.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}
          </div>

          {/* ══ ПРАВАЯ КОЛОНКА ══ */}
          <aside className="lp-rail" style={{ position: 'sticky', top: 84 }}>
            <ContactCard
              price={listing.price}
              pricePerSotka={pricePerSotka}
              seller={listing.seller}
              slug={listing.slug}
              title={listing.title}
              listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
              createdAt={listing.createdAt}
              views={listing.views}
              hasStateAct={listing.hasStateAct}
              hasEncumbrances={listing.hasEncumbrances}
              isPledged={listing.isPledged}
            />
          </aside>
        </div>
      </main>

      <ViewTracker id={String(listing.id)} slug={listing.slug} />
      <MobileContactBar
        price={listing.price}
        pricePerSotka={pricePerSotka}
        seller={listing.seller}
        slug={listing.slug}
        title={listing.title}
        listingUrl={`https://6sotok.kz/catalog/${type}/${listing.id}`}
      />

      <style>{`
        @media (max-width: 1199px) {
          .lp-grid   { grid-template-columns: 1fr !important; }
          .lp-rail   { display: none !important; position: static !important; }
          .lp-stats  { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-similar { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .lp-main   { padding: 14px 14px 120px !important; }
          .lp-h1     { font-size: 30px !important; }
          .lp-stats  { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-specs  { grid-template-columns: 1fr !important; }
          .lp-docs   { grid-template-columns: 1fr !important; }
          .lp-distances { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-similar { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
