import { Header } from '@/components/layout/header';
import { Container } from '@/components/layout/container';
import { HeroSection } from '@/components/home/hero-section';
import { SearchBar } from '@/components/home/search-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { mockListings } from '@/lib/mock-data';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      <Header />
      
      <main>
        <HeroSection />
        <SearchBar />

        {/* Feature/Popular Categories Map - More premium cards */}
        <section className="py-12 pb-20">
          <Container>
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                Какая земля вам нужна?
              </h2>
              <p className="mt-4 text-lg text-zinc-500 font-medium">Популярные направления для инвестиций и жизни</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  title: 'Для постройки дома', 
                  tags: ['ИЖС', 'Электричество', 'Вода'], 
                  color: 'bg-blue-50/50 hover:bg-blue-50', 
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-600 drop-shadow-sm mb-6"><path d="M11.47 3.84a.75.75 0 011.06 0l8.99 8.99a.75.75 0 11-1.06 1.06l-1.05-.9v7.86a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5a1.5 1.5 0 00-1.5-1.5h-1.5a1.5 1.5 0 00-1.5 1.5v4.5a.75.75 0 01-.75.75h-3.9a.75.75 0 01-.75-.75v-7.86l-1.05.9a.75.75 0 01-1.06-1.06l8.99-8.99Z" /></svg> 
                },
                { 
                  title: 'Бизнес и коммерция', 
                  tags: ['СТО', 'Склады', 'Трасса'], 
                  color: 'bg-orange-50/50 hover:bg-orange-50', 
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-orange-500 drop-shadow-sm mb-6"><path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838 8.81A2.25 2.25 0 007.808 14h8.384a2.25 2.25 0 002.22-1.65l1.838-8.81V3a.75.75 0 011.5 0v.54l-1.838 8.81A3.75 3.75 0 0116.192 15.5H7.808a3.75 3.75 0 01-3.702-2.75L2.268 3.94H1.5A.75.75 0 011.5 2.44h1.5A.75.75 0 013 3.19v-.19A.75.75 0 013.75 2.25ZM6 21a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0ZM18 21a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0Z" clipRule="evenodd" /></svg> 
                },
                { 
                  title: 'Для отдыха и дачи', 
                  tags: ['Сад', 'Природа', 'Тишина'], 
                  color: 'bg-primary-soft/50 hover:bg-primary-soft', 
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary-light drop-shadow-sm mb-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM11.25 15.35v-6.687l-1.72 1.72a.75.75 0 11-1.06-1.06l3-3a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72v6.687a.75.75 0 01-1.5 0Z" clipRule="evenodd" /></svg> 
                },
                { 
                  title: 'Сельское хозяйство', 
                  tags: ['Посевы', 'Скважина', 'Ферма'], 
                  color: 'bg-yellow-50/50 hover:bg-yellow-50', 
                  icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-yellow-600 drop-shadow-sm mb-6"><path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75ZM3 15.75a.75.75 0 011.5 0v2.25a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-2.25a.75.75 0 011.5 0v2.25a3 3 0 01-3 3h-12a3 3 0 01-3-3v-2.25Z" clipRule="evenodd" /></svg> 
                },
              ].map((category, idx) => (
                <Link key={idx} href="/catalog" className={`group relative overflow-hidden rounded-3xl border border-zinc-200 p-8 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-black/5 ${category.color} bg-white`}>
                  {category.icon}
                  <h3 className="text-xl font-bold text-zinc-900">{category.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.tags.map(tag => (
                      <span key={tag} className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm border border-zinc-200/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-20 bg-white border-t border-zinc-100">
          <Container>
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
                  Новые объявления
                </h2>
                <p className="mt-3 text-lg text-zinc-500 font-medium">Свежие участки напрямую от собственников</p>
              </div>
              <Link href="/catalog" className="hidden group rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-800 transition-all hover:border-zinc-300 hover:bg-zinc-50 sm:flex items-center gap-2">
                Смотреть все 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {mockListings.slice(0, 4).map((listing, i) => (
                <ListingCard key={listing.id + i} listing={listing} />
              ))}
            </div>
            
            <div className="mt-12 text-center sm:hidden">
              <Link href="/catalog" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-zinc-800">
                Смотреть все участки
              </Link>
            </div>
          </Container>
        </section>

      </main>
    </div>
  );
}