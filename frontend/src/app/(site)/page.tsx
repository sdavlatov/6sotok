import { HomeClient, type HomeFeatured } from '@/components/home/home-client';
import { getListings, getListingCounts, getListingLocations } from '@/lib/api';

// ISR: страница отдаётся из кеша CDN, пересобирается раз в 5 минут либо сразу
// по revalidateTag('listings') из хука коллекции. Было force-dynamic — каждый
// запрос заново поднимал Payload и ходил в Neon.
export const revalidate = 300;

export default async function HomePage() {
  // Раньше здесь грузились 500 участков + 200 бизнесов целиком (с depth: 1, то есть
  // с джойном медиа) — ради трёх счётчиков и 10 карточек витрины.
  const [featuredSource, counts, locations] = await Promise.all([
    // с запасом: ниже отсеиваются объявления без цены/площади, нужно 10 карточек
    getListings({ limit: '40' }),
    getListingCounts(),
    getListingLocations(),
  ]);

  const locationsCount = locations.length;

  // рекламная витрина hero + live-тикер — свежие участки с ценой
  const featured: HomeFeatured[] = featuredSource
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
      landCount={counts.land}
      businessCount={counts.business}
      locationsCount={locationsCount}
    />
  );
}
