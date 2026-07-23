import type { Listing } from '@/types/listing';
import { LAND_CATEGORIES } from '@/lib/listing-constants';

// Все категории участков из макета — показываем всегда, даже с нулевым счётчиком
export function landTypeCounts(listings: Listing[]): [string, number][] {
  const m = new Map<string, number>();
  for (const l of listings) m.set(l.landType, (m.get(l.landType) ?? 0) + 1);
  return LAND_CATEGORIES.map(c => [c, m.get(c) ?? 0] as [string, number]);
}

// ─── Единая модель фильтров (десктоп + мобайл) ───────────────────────────────
export const PMAX = 120; // млн ₸
export const AMAX = 60;  // соток

export const SORTS = ['Сначала новые', 'Сначала дешёвые', 'Сначала дорогие', 'Дешевле за сотку'] as const;

export const PRICE_PRESETS = [
  { l: 'до 10', lo: 0, hi: 10 },
  { l: '10–20', lo: 10, hi: 20 },
  { l: '20–35', lo: 20, hi: 35 },
  { l: '35–60', lo: 35, hi: 60 },
  { l: '60+', lo: 60, hi: PMAX },
];

export const UTIL_OPTIONS = ['Свет', 'Вода', 'Газ', 'Канализация', 'Дорога'] as const;
export const DOC_OPTIONS = ['Акт на землю', 'Межевание', 'Кадастр', 'ИЖС (разрешение)'] as const;
export const FEAT_OPTIONS = ['У воды', 'Вид на горы', 'Только от хозяина', 'С постройкой'] as const;
export const LEGAL_OPTIONS = ['Не в залоге', 'Не на красной линии'] as const;

export interface FilterState {
  types: Set<string>;          // пусто = все
  pLo: number; pHi: number;    // млн ₸
  priceMode: 'plot' | 'sotka';
  aLo: number; aHi: number;    // соток
  areaUnit: 'sot' | 'ga';
  utils: Set<string>;
  docs: Set<string>;
  feats: Set<string>;
  legal: Set<string>;
  cities: Set<string>;
  sort: number;
}

export function defaultFilters(): FilterState {
  return {
    types: new Set(), pLo: 0, pHi: PMAX, priceMode: 'plot',
    aLo: 0, aHi: AMAX, areaUnit: 'sot',
    utils: new Set(), docs: new Set(), feats: new Set(), legal: new Set(),
    cities: new Set(), sort: 0,
  };
}

export function cloneFilters(f: FilterState): FilterState {
  return {
    ...f,
    types: new Set(f.types), utils: new Set(f.utils), docs: new Set(f.docs),
    feats: new Set(f.feats), legal: new Set(f.legal), cities: new Set(f.cities),
  };
}

export function activeFilterCount(f: FilterState): number {
  return (f.pLo > 0 || f.pHi < PMAX ? 1 : 0)
    + (f.aLo > 0 || f.aHi < AMAX ? 1 : 0)
    + f.utils.size + f.docs.size + f.feats.size + f.legal.size + f.cities.size
    + (f.types.size ? 1 : 0);
}

// ─── Предикаты полей объявления ─────────────────────────────────────────────
const UTIL_PRED: Record<string, (l: Listing) => boolean> = {
  'Свет': l => !!l.hasElectricity,
  'Вода': l => !!l.hasWater,
  'Газ': l => !!l.hasGas,
  'Канализация': l => !!l.hasSewer,
  'Дорога': l => !!l.hasRoadAccess,
};
const DOC_PRED: Record<string, (l: Listing) => boolean> = {
  'Акт на землю': l => !!l.hasStateAct,
  'Межевание': l => !!l.plotBoundary,
  'Кадастр': l => !!l.cadastralNumber,
  'ИЖС (разрешение)': l => l.purpose === 'ИЖС' || l.landType === 'ИЖС',
};
const FEAT_PRED: Record<string, (l: Listing) => boolean> = {
  'У воды': l => !!l.locationType?.includes('water'),
  'Вид на горы': l => !!l.locationType?.includes('foothills'),
  'Только от хозяина': l => !!l.seller && !l.seller.isAgency,
  'С постройкой': l => !!l.buildingArea,
};
const LEGAL_PRED: Record<string, (l: Listing) => boolean> = {
  'Не в залоге': l => !l.isPledged,
  'Не на красной линии': l => !l.isOnRedLine,
};

export function cityOf(l: Listing): string {
  return (l.location || '').split(',')[0].trim();
}

/**
 * Объявление считается просмотренным, если в истории есть его id ИЛИ slug.
 * `6sotok_viewed` пишется двумя механизмами (каталог — по id, ViewTracker/hero-map — по slug),
 * поэтому сверяем по обоим ключам и НЕ считаем одно объявление дважды.
 */
export function isListingViewed(l: Listing, viewed: Set<string>): boolean {
  return viewed.has(String(l.id)) || (!!l.slug && viewed.has(l.slug));
}

export function viewedCount(listings: Listing[], viewed: Set<string>): number {
  if (viewed.size === 0) return 0;
  let n = 0;
  for (const l of listings) if (isListingViewed(l, viewed)) n++;
  return n;
}

export function matches(l: Listing, f: FilterState): boolean {
  if (f.types.size && !f.types.has(l.landType)) return false;
  const priceM = f.priceMode === 'sotka' && l.area ? l.price / l.area / 1e6 : l.price / 1e6;
  if (priceM < f.pLo || (f.pHi < PMAX && priceM > f.pHi)) return false;
  const areaSot = f.areaUnit === 'ga' ? l.area / 100 : l.area;
  if (areaSot < f.aLo || (f.aHi < AMAX && areaSot > f.aHi)) return false;
  for (const u of f.utils) if (!UTIL_PRED[u]?.(l)) return false;
  for (const d of f.docs) if (!DOC_PRED[d]?.(l)) return false;
  for (const ft of f.feats) if (!FEAT_PRED[ft]?.(l)) return false;
  for (const lg of f.legal) if (!LEGAL_PRED[lg]?.(l)) return false;
  if (f.cities.size && !f.cities.has(cityOf(l))) return false;
  return true;
}

export function sortListings(items: Listing[], sort: number): Listing[] {
  const arr = [...items];
  switch (sort) {
    case 1: arr.sort((a, b) => a.price - b.price); break;
    case 2: arr.sort((a, b) => b.price - a.price); break;
    case 3: arr.sort((a, b) => (a.price / (a.area || 1)) - (b.price / (b.area || 1))); break;
    default: arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return arr;
}

// Счётчик для каждой опции считается по реальным объявлениям
export function countBy(listings: Listing[], pred: (l: Listing) => boolean): number {
  let n = 0;
  for (const l of listings) if (pred(l)) n++;
  return n;
}
export const optionPredicates = { UTIL_PRED, DOC_PRED, FEAT_PRED, LEGAL_PRED };

export function topCities(listings: Listing[], limit = 12): { l: string; c: number }[] {
  const m = new Map<string, number>();
  for (const l of listings) {
    const c = cityOf(l);
    if (c) m.set(c, (m.get(c) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([l, c]) => ({ l, c }));
}

export function priceHistogram(listings: Listing[], bins = 16): number[] {
  const h = new Array(bins).fill(0);
  for (const l of listings) {
    const i = Math.min(bins - 1, Math.floor((l.price / 1e6) / PMAX * bins));
    h[i]++;
  }
  const mx = Math.max(1, ...h);
  return h.map(v => Math.max(4, Math.round(v / mx * 100)));
}

// ─── Форматирование ──────────────────────────────────────────────────────────
export function fmtPrice(price: number): string {
  if (price >= 1e6) return `${trim1(price / 1e6)} млн ₸`;
  if (price >= 1e3) return `${Math.round(price / 1e3)} тыс ₸`;
  return `${price} ₸`;
}
export function fmtPriceShort(price: number): string {
  if (price >= 1e6) return `${trim1(price / 1e6)}м`;
  return `${Math.round(price / 1e3)}т`;
}
export function fmtPerSotka(l: Listing): string {
  if (!l.area) return '';
  const pps = l.price / l.area;
  if (pps >= 1e6) return `${(pps / 1e6).toFixed(2).replace(/0$/, '')} млн / сотка`;
  return `${Math.round(pps / 1e3)} тыс / сотка`;
}
function trim1(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '');
}
export const nf = (n: number) => n.toLocaleString('ru-RU');

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function fmtAgo(createdAt: string): string {
  const d = new Date(createdAt);
  const diffMs = Date.now() - +d;
  const h = Math.floor(diffMs / 3.6e6);
  if (h < 1) return 'только что';
  if (h < 6) return `${h} ч`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (+d >= +today) return 'сегодня';
  const yesterday = +today - 864e5;
  if (+d >= yesterday) return 'вчера';
  const days = Math.floor(diffMs / 864e5);
  if (days < 30) return `${days} дн`;
  return `${Math.floor(days / 30)} мес`;
}

// ─── Производные значения карточки ───────────────────────────────────────────
const ALMATY: [number, number] = [43.238949, 76.889709];

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371, dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const rad = (d: number) => d * Math.PI / 180;

export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface CardMeta {
  ago: string;
  fresh: boolean;          // «2 ч» зелёным
  photos: number;
  distKm: number | null;   // до Алматы, реальный расчёт по координатам
  altM: number | null;     // высота над морем — данных нет, всегда null
  cadVerified: boolean;    // по наличию кадастрового номера
  drop: number | null;     // MOCK: снижение цены за месяц, %
  oldPrice: string | null; // MOCK
  urgent: boolean;         // MOCK
  ready: boolean;          // свет + вода + акт → «Готов к стройке»
  imgIdx: number;          // плейсхолдер, если нет фото
  tags: { l: string; brand?: boolean }[];
}

export function cardMeta(l: Listing): CardMeta {
  const h = hashId(String(l.id));
  const ago = fmtAgo(l.createdAt);
  // Скидка и «Срочно» больше НЕ выдумываются из хеша id: это боевой каталог,
  // фабриковать −12%/«Срочно» всем подряд нельзя. Появятся, когда будет реальное
  // поле промо у объявления (продвижение из ЛК). Высота над морем тоже недоступна.
  const drop = null;
  const tags: { l: string; brand?: boolean }[] = [];
  // коммуникации — отдельными тегами (как в макете), без схлопывания
  if (l.hasElectricity) tags.push({ l: 'Свет' });
  if (l.hasWater) tags.push({ l: 'Вода' });
  if (l.hasGas) tags.push({ l: 'Газ' });
  if (l.hasSewer) tags.push({ l: 'Канализация' });
  if (l.locationType?.includes('water')) tags.push({ l: 'У воды' });
  if (l.hasStateAct) tags.push({ l: 'Акт', brand: true });
  else if (l.plotBoundary) tags.push({ l: 'Межевание', brand: true });
  return {
    ago,
    fresh: /ч$|только что/.test(ago),
    photos: l.images?.length || (l.image ? 1 : 0),
    distKm: l.lat && l.lng ? Math.round(haversineKm([l.lat, l.lng], ALMATY)) : null,
    altM: null,
    cadVerified: !!l.cadastralNumber,
    drop,
    oldPrice: null,
    urgent: false,
    ready: !!(l.hasElectricity && l.hasWater && l.hasStateAct),
    imgIdx: (h % 6) + 1,
    tags: tags.slice(0, 5),
  };
}

// медиана по видимой области карты
export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function waLink(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits.replace(/^8/, '7')}` : null;
}
export function telLink(phone?: string): string | null {
  return phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
}

// ─── localStorage: избранное / просмотренные ────────────────────────────────
export const LS_BOOKMARKS = '6sotok_bookmarks';
export const LS_VIEWED = '6sotok_viewed';
export const LS_COMPARE = '6sotok_compare';

export function readLsSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]')); }
  catch { return new Set(); }
}
export function writeLsSet(key: string, set: Set<string>): void {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* quota */ }
}
