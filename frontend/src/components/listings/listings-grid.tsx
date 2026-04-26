import type { Listing } from '@/types/listing';
import { ListingCard } from './listing-card';

interface ListingsGridProps {
  listings: Listing[];
  columns?: 2 | 3 | 4;
}

export function ListingsGrid({ listings, columns = 3 }: ListingsGridProps) {
  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-2 sm:gap-3`}>
      {listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
