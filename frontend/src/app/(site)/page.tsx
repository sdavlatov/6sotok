import { HomeClient, type HomeFeatured } from '@/components/home/home-client';
import { getListings, getBusinessListings } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [landListings, businessListings] = await Promise.all([
    getListings({ limit: '500' }),
    getBusinessListings(),
  ]);

  const locationsCount = new Set(
    [...landListings, ...businessListings].map(l => l.location).filter(Boolean),
  ).size;

  // рекламная витрина hero + live-тикер — свежие участки с ценой
  const featured: HomeFeatured[] = landListings
    .filter(l => l.price && l.area)
    .slice(0, 10)
    .map(l => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      price: l.price,
      area: l.area,
      landType: l.landType,
      location: l.location,
      image: l.image,
    }));

  return (
    <HomeClient
      featured={featured}
      landCount={landListings.length}
      businessCount={businessListings.length}
      locationsCount={locationsCount}
    />
  );
}
