import { Header } from '@/components/layout/header';
import { Container } from '@/components/layout/container';
import { mockListings } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { ContactCard } from '@/components/listings/contact-card';
import { ListingCard } from '@/components/listings/listing-card';

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = await params;
  const listing = mockListings.find(l => l.slug === slug);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
        <Header />
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 selection:bg-primary-soft">
      <Header />
      
      <main className="py-8 pb-20">
        <Container>
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-3">
            
            {/* Левая колонка (Галерея, Инфо, Описание) */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Фото галерея */}
              <ListingGallery title={listing.title} images={listing.images || [listing.image]} />
              
              {/* Основная информация */}
              <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="rounded-lg bg-primary-soft px-3 py-1 font-bold text-primary border border-primary/10 tracking-wide text-xs uppercase">{listing.landType}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-6 leading-tight">{listing.title}</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-zinc-100">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Площадь</div>
                    <div className="font-extrabold text-zinc-900 text-lg">{listing.area} соток</div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Расположение</div>
                    <div className="font-extrabold text-zinc-900 text-lg flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary shrink-0"><path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>
                      {listing.location}
                    </div>
                  </div>
                </div>

                {/* Коммуникации */}
                <div className="mt-8">
                  <h3 className="text-lg font-black text-zinc-900 mb-4">Коммуникации на участке</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {listing.communications.map((comm) => (
                      <div key={comm} className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {comm}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 mb-6">Описание от продавца</h2>
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

              {/* Карта */}
              <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 mb-6">На карте</h2>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 flex flex-col items-center justify-center">
                  {/* Заглушка */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-zinc-300 mb-4"><path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 1.5 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 0 1 .75.75V15a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 9 6Zm6.75 3a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V9Z" clipRule="evenodd" /></svg>
                  <p className="text-zinc-500 font-bold">Интерактивная карта загрузится здесь</p>
                  <p className="text-zinc-400 text-sm font-medium mt-1">Интеграция 2ГИС / Yandex Maps</p>
                </div>
              </div>

            </div>
            
            {/* Правая колонка (Контакты / Sidebar) */}
            <div className="lg:col-span-1">
              <ContactCard 
                price={listing.price} 
                pricePerSotka={Math.round(listing.price / listing.area)}
                seller={listing.seller}
              />
            </div>

          </div>

          {/* Похожие объявления */}
          {similarListings.length > 0 && (
            <div className="mt-20 border-t border-zinc-200 pt-16">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 mb-8 max-w-4xl">Похожие участки</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similarListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

        </Container>
      </main>
    </div>
  );
}
