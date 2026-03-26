
import { Container } from '@/components/layout/container';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { ContactCard } from '@/components/listings/contact-card';
import { ListingCard } from '@/components/listings/listing-card';
import Link from 'next/link';

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = await params;
  const listing = mockListings.find(l => l.slug === slug);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <main className="py-20">
          <Container>
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-zinc-200 py-32 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-zinc-300 mb-6 drop-shadow-sm"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" /></svg>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Объявление не найдено</h1>
              <p className="text-zinc-500 font-medium">Возможно, участок был продан или автор удалил объявление.</p>
            </div>
          </Container>
        </main>
      </div>
    );
  }

  const similarListings = mockListings.filter(l => l.id !== listing.id).slice(0, 3);
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(listing.price);
  const pricePerSotka = new Intl.NumberFormat('ru-RU').format(Math.round(listing.price / listing.area));
  const cleanPhone = listing.seller?.phone?.replace(/\D/g, '') ?? '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-primary-soft relative">
      
      <main className="py-8 lg:pb-20">
        <Container>
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-3">
            
            {/* Левая колонка */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Hero: Фото + Сплит Карта */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3">
                  <ListingGallery title={listing.title} images={listing.images || [listing.image]} />
                </div>
                <div className="hidden md:flex md:col-span-2 rounded-3xl bg-zinc-100 border border-zinc-200 items-center justify-center relative overflow-hidden group cursor-pointer lg:h-[350px]">
                    <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/2853/1460.png')] bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0"></div>
                    <div className="relative z-10 flex flex-col items-center p-4 text-center">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-lg mb-3 shadow-zinc-900/30 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <span className="text-[11px] font-black text-zinc-900 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">На карте</span>
                    </div>
                </div>
              </div>
              
              {/* Введение и Цена (Summary Section) */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-zinc-900 px-3 py-1.5 font-black text-white tracking-wider text-[11px] uppercase shadow-sm">
                      {listing.purpose || listing.landType}
                    </span>
                    <span className="rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 font-bold text-zinc-500 tracking-wider text-[11px] uppercase">
                      ID: {listing.id || '29410'}
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-6 leading-tight">
                  {listing.title}
                </h1>
                
                <div className="flex flex-wrap items-end justify-between gap-6 py-6 border-y border-zinc-100 mb-6 lg:hidden">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Полная стоимость</div>
                        <div className="text-3xl font-black text-zinc-900 tracking-tight">{formattedPrice} ₸</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-black text-primary">{pricePerSotka} ₸</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">за сотку</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-700 text-sm font-bold bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-100">
                   <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary shrink-0"><path fillRule="evenodd" d="M11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
                   </div>
                  {listing.location}
                </div>
              </div>

              {/* Bento Grid: Юридики, Геометрия, Коммуникации */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mb-6">Параметры участка</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                    
                    {/* Юридическая колонка */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-sm flex flex-col transition-all hover:border-zinc-300">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
                            <span className="w-5 h-[2px] rounded-full bg-zinc-200"></span>
                            Юридически
                            <span className="flex-1 shrink-0 h-[1px] bg-zinc-200"></span>
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Залог</span>
                                {listing.isPledged === true ? <span className="text-[10px] font-black tracking-wider uppercase text-red-700 bg-red-50 px-2.5 py-1 rounded-md">В залоге</span> : <span className="text-[10px] font-black tracking-wider uppercase text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200/50">Без залога</span>}
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Красная линия</span>
                                {listing.isOnRedLine === true ? <span className="text-[10px] font-black tracking-wider uppercase text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200/50">Да</span> : <span className="text-[10px] font-black tracking-wider uppercase text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-md">Нет</span>}
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Госакт</span>
                                <span className="text-xs font-black text-zinc-900">{listing.hasStateAct !== false ? 'ЕСТЬ' : 'НЕТ'}</span>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Кадастровый номер</span>
                                <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200/50 group hover:border-zinc-300 transition-colors">
                                    <span className="text-[13px] font-black tracking-widest text-zinc-800 flex-1 ml-1 font-mono">{listing.cadastralNumber || 'Не указан'}</span>
                                    {listing.cadastralNumber && (
                                        <button className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" title="Копировать">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Геометрия колонка */}
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-zinc-200 shadow-sm flex flex-col transition-all hover:border-zinc-300">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-2">
                            <span className="w-5 h-[2px] rounded-full bg-zinc-200"></span>
                            Геометрия
                            <span className="flex-1 shrink-0 h-[1px] bg-zinc-200"></span>
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Площадь</span>
                                <span className="text-xs font-black text-zinc-900">{listing.area} <span className="text-[10px] text-zinc-400 uppercase tracking-widest">сот.</span></span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Фасад</span>
                                <span className="text-xs font-black text-zinc-900">{listing.frontWidth ? `${listing.frontWidth} м.` : '—'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Форма</span>
                                <span className="text-xs font-black text-zinc-900 truncate pl-4">{listing.plotShape || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                                <span className="text-xs font-bold text-zinc-500">Рельеф</span>
                                <span className="text-xs font-black text-zinc-900">{listing.reliefType || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs font-bold text-zinc-500">Делимость</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900">{listing.isDivisible ? 'Делимый' : 'Неделимый'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Коммуникации колонка */}
                    <div className="bg-primary-soft/30 rounded-3xl p-5 sm:p-6 border border-primary/20 shadow-sm flex flex-col transition-all hover:border-primary/40">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/70 mb-5 flex items-center gap-2">
                            <span className="w-5 h-[2px] rounded-full bg-primary/30"></span>
                            Инженерия
                            <span className="flex-1 shrink-0 h-[1px] bg-primary/20"></span>
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                                <span className="text-xs font-bold text-primary/80">Свет</span>
                                {listing.hasElectricity ? <span className="text-[10px] tracking-wider font-black uppercase text-yellow-700 bg-yellow-400/20 px-2 py-0.5 rounded">ЗАВЕДЕН</span> : <span className="text-xs font-black text-zinc-400">—</span>}
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                                <span className="text-xs font-bold text-primary/80">Газ</span>
                                {listing.hasGas ? <span className="text-[10px] tracking-wider font-black uppercase text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded">ЗАВЕДЕН</span> : <span className="text-xs font-black text-zinc-400">—</span>}
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                                <span className="text-xs font-bold text-primary/80">Вода</span>
                                {listing.hasWater ? <span className="text-[10px] tracking-wider font-black uppercase text-cyan-700 bg-cyan-500/10 px-2 py-0.5 rounded">ЕСТЬ</span> : <span className="text-xs font-black text-zinc-400">—</span>}
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-primary/10">
                                <span className="text-xs font-bold text-primary/80">Канализация</span>
                                {listing.hasSewer ? <span className="text-[10px] tracking-wider font-black uppercase text-zinc-700 bg-zinc-200/50 px-2 py-0.5 rounded">ЦЕННТРАЛЬНАЯ</span> : <span className="text-xs font-black text-zinc-400">—</span>}
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs font-bold text-primary/80">Подъезд</span>
                                {listing.hasRoadAccess ? <span className="text-[10px] font-black tracking-wider uppercase text-stone-700 bg-stone-200/50 px-2.5 py-1 rounded-md leading-tight">ТВЕРДОЕ ПОКРЫТИЕ</span> : <span className="text-xs font-black text-zinc-400">—</span>}
                            </div>
                        </div>
                    </div>

                </div>
              </div>

              {/* Описание */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-xl font-black tracking-tight text-zinc-900 mb-6">Комментарий владельца</h2>
                <div className="prose prose-zinc prose-p:font-medium prose-p:text-zinc-600 prose-p:leading-relaxed max-w-none">
                  {listing.description ? (
                    listing.description.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))
                  ) : (
                    <p>Продавец пока не добавил описание.</p>
                  )}
                </div>
              </div>

            </div>
            
            {/* Правая колонка (Контакты / Sidebar Desktop) */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-28">
                <ContactCard
                  price={listing.price}
                  pricePerSotka={Math.round(listing.price / listing.area)}
                  seller={listing.seller}
                  slug={listing.slug}
                />
              </div>
            </div>

          </div>

          {/* Похожие объявления */}
          {similarListings.length > 0 && (
            <div className="mt-20 border-t border-zinc-200 pt-10 sm:pt-16">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-8 max-w-4xl">Похожие участки</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similarListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

        </Container>
      </main>

      {/* Spacer to prevent overlap with sticky bar */}
      <div className="h-28 lg:hidden"></div>

      {/* Sticky Bottom Bar for Mobile Analytics UX */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-zinc-50/95 backdrop-blur-md border-t border-zinc-200/80 p-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:hidden flex items-center justify-between gap-4">
          <div className="flex-1">
              <div className="text-2xl font-black tracking-tight text-zinc-900 leading-none mb-1.5">{formattedPrice} ₸</div>
              <div className="text-[10px] font-bold uppercase text-primary tracking-widest">{pricePerSotka} ₸ / сот.</div>
          </div>
          {cleanPhone ? (
            <a
              href={`tel:${cleanPhone}`}
              className="bg-primary hover:bg-primary-light active:scale-95 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-[11px]"
            >
              Позвонить
            </a>
          ) : (
            <span className="bg-zinc-200 text-zinc-400 font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-[11px]">
              Нет номера
            </span>
          )}
      </div>
      
    </div>
  );
}
