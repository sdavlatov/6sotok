export const LANDTYPE_SLUG: Record<string, string> = {
  'ИЖС':       'izhs',
  'Дача':      'dacha',
  'Коммерция': 'kommertsiya',
  'Сельхоз':   'selhoz',
  'МЖС':       'mzhs',
  'ЛПХ':       'lph',
}

export const SLUG_LANDTYPE: Record<string, string> = Object.fromEntries(
  Object.entries(LANDTYPE_SLUG).map(([k, v]) => [v, k])
)

export function listingUrl(listing: { id: string | number; landType?: string; purpose?: string }): string {
  const type = listing.landType || listing.purpose || ''
  const typeSlug = LANDTYPE_SLUG[type] ?? 'uchastok'
  return `/catalog/${typeSlug}/${listing.id}`
}
