import { getListingBySlug, getBusinessListings } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ContactCard } from '@/components/listings/contact-card';
import { MobileContactBar } from '@/components/listings/mobile-contact-bar';
import { PhotoGrid } from '@/components/listings/photo-grid';
import { ViewTracker } from '@/components/listings/view-tracker';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 300;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};
  return {
    title: `${listing.title} — 6sotok.kz`,
    description: listing.description ?? `Готовый бизнес, ${listing.location}. Цена ${new Intl.NumberFormat('ru-RU').format(listing.price)} ₸`,
  };
}

const fmt = (n: number) => n.toLocaleString('ru-RU');
const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

export default async function BusinessListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const similar = await getBusinessListings();
  const similarListings = similar.filter(l => l.id !== listing.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-zinc-50">
      <ViewTracker id={String(listing.id)} slug={listing.slug} />

      <div className="max-w-[1440px] mx-auto px-6 pt-6 pb-2">
        <Breadcrumbs
          trail={[
            { label: 'Готовый бизнес', href: '/business' },
            { label: listing.title },
          ]}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Left column */}
          <div>
            {/* Gallery */}
            <PhotoGrid images={[...(listing.images ?? []), ...(listing.videos ?? [])]} title={listing.title} />

            {/* Title + key stats */}
            <div className="mt-8 bg-white rounded-2xl border border-zinc-200 p-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-md bg-amber-500 text-white text-[10.5px] font-bold uppercase tracking-wider">Бизнес</span>
                {listing.isOperational && (
                  <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">Действующий</span>
                )}
              </div>
              <h1 className="font-black tracking-[-0.04em] text-[32px] leading-tight text-zinc-900">{listing.title}</h1>
              {listing.location && (
                <p className="mt-2 text-[14px] text-zinc-500">{listing.location}</p>
              )}

              {/* Financial grid */}
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-zinc-100">
                <div>
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400">Цена</div>
                  <div className="mt-1 font-black tracking-[-0.04em] text-[28px] text-zinc-900 leading-none">
                    {listing.price ? `${fmtM(listing.price)} млн ₸` : '—'}
                  </div>
                </div>
                {listing.monthlyRevenue && (
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400">Выручка/мес</div>
                    <div className="mt-1 font-black tracking-[-0.04em] text-[28px] text-zinc-900 leading-none">
                      {fmtM(listing.monthlyRevenue)} млн ₸
                    </div>
                  </div>
                )}
                {listing.paybackMonths && (
                  <div>
                    <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-400">Окупаемость</div>
                    <div className="mt-1 font-black tracking-[-0.04em] text-[28px] text-primary leading-none">
                      {listing.paybackMonths} мес
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="mt-4 bg-white rounded-2xl border border-zinc-200 p-7">
                <h2 className="font-bold text-[16px] text-zinc-900 mb-3">Описание</h2>
                <p className="text-[15px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Object parameters */}
            <div className="mt-4 bg-white rounded-2xl border border-zinc-200 p-7">
              <h2 className="font-bold text-[16px] text-zinc-900 mb-4">Параметры объекта</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {listing.area && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Площадь участка</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900">{listing.area} га</div>
                  </div>
                )}
                {listing.buildingArea && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Площадь здания</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900">{listing.buildingArea} м²</div>
                  </div>
                )}
                {listing.yearBuilt && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Год постройки</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900">{listing.yearBuilt}</div>
                  </div>
                )}
                {listing.ceilingHeight && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Высота потолков</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900">{listing.ceilingHeight} м</div>
                  </div>
                )}
                {listing.electricPower && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Электромощность</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900">{listing.electricPower} кВт</div>
                  </div>
                )}
                {listing.cadastralNumber && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Кадастровый номер</div>
                    <div className="mt-0.5 text-[15px] font-semibold text-zinc-900 font-mono">{listing.cadastralNumber}</div>
                  </div>
                )}
              </div>

              {/* Boolean flags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {listing.hasParking && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Парковка</span>}
                {listing.hasSeparateEntrance && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Отдельный вход</span>}
                {listing.isTenanted && <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium">Есть арендаторы</span>}
                {listing.hasElectricity && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Свет</span>}
                {listing.hasGas && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Газ</span>}
                {listing.hasWater && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Вода</span>}
                {listing.hasRoadAccess && <span className="px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-700 text-[12px] font-medium">Дорога</span>}
              </div>
            </div>
          </div>

          {/* Right column — contact */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <ContactCard
              price={listing.price}
              pricePerSotka={listing.area ? Math.round(listing.price / listing.area) : 0}
              seller={listing.seller}
              slug={listing.slug}
              title={listing.title}
              createdAt={listing.createdAt}
              views={listing.views}
            />
          </div>
        </div>

        {/* Similar */}
        {similarListings.length > 0 && (
          <div className="mt-16">
            <h2 className="font-black tracking-[-0.04em] text-[28px] text-zinc-900 mb-6">Похожие объекты</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {similarListings.map(l => (
                <Link key={l.id} href={`/business/${l.slug}`}
                  className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                    {l.image && <Image src={l.image} alt={l.title} fill sizes="(max-width: 640px) 50vw, 300px" className="object-cover" />}
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider">Бизнес</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[16px] text-zinc-900 line-clamp-2">{l.title}</h3>
                    {l.price && <div className="mt-2 font-black text-[18px] text-zinc-900">{fmtM(l.price)} млн ₸</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileContactBar
        price={listing.price}
        pricePerSotka={listing.area ? Math.round(listing.price / listing.area) : 0}
        seller={listing.seller}
        slug={listing.slug}
        title={listing.title}
      />
    </div>
  );
}
