import { Container } from '@/components/layout/container';
import { HeroSection } from '@/components/home/hero-section';
import { SearchBar } from '@/components/home/search-bar';
import { ListingsGrid } from '@/components/listings/listings-grid';
import { getListings } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const allListings = await getListings({ limit: '500' })
  const listings = allListings.slice(0, 6)

  const countByType: Record<string, number> = {};
  const locSet = new Set<string>();
  let minArea = Infinity;
  let maxArea = 0;
  for (const l of allListings) {
    if (l.purpose) countByType[l.purpose] = (countByType[l.purpose] || 0) + 1;
    if (l.landType) countByType[l.landType] = (countByType[l.landType] || 0) + 1;
    if (l.location) locSet.add(l.location);
    if (l.area) {
      if (l.area < minArea) minArea = l.area;
      if (l.area > maxArea) maxArea = l.area;
    }
  }
  const locations = [...locSet];
  const minSotok = minArea === Infinity ? 6 : Math.round(minArea);
  const maxHa = maxArea === 0 ? 100 : Math.round(maxArea / 100);

  return (
    <>
      <HeroSection count={allListings.length} minSotok={minSotok} maxHa={maxHa} />
      <SearchBar countByType={countByType} locations={locations} totalCount={allListings.length} />

      {/* Свежие объявления */}
      <section className="py-14 bg-white border-b border-zinc-100">
        <Container>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                Свежие объявления
              </h2>
              <p className="mt-2 text-[15px] text-zinc-500 font-normal">
                Актуальные участки от собственников и агентств
              </p>
            </div>
            <Link href="/catalog" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-zinc-400 transition-colors hover:text-zinc-700 group">
              Все участки
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </div>

          <ListingsGrid listings={listings} columns={3} />

          <div className="mt-8 text-center sm:hidden">
            <Link href="/catalog" className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800">
              Все объявления
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
