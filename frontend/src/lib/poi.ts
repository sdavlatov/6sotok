import { unstable_cache } from 'next/cache';
import type { MapPOI } from '@/components/listings/listing-map';

/**
 * POI вокруг участка (Overpass API) для карточки объявления.
 *
 * Вынесено из рендера страницы намеренно: публичный Overpass отвечает 7–9 с и
 * регулярно отдаёт 429/504. Пока он вызывался внутри серверного компонента,
 * TTFB карточки был 10–14 с. Теперь данные догружает клиент через /api/poi, а
 * здесь стоит суточный unstable_cache — обычный `next: { revalidate }` на
 * fetch не работает, потому что запрос POST, а Next кеширует только GET.
 */

export interface PdpTravel { label: string; value: string }
export interface LocationData { mapPOIs: MapPOI[]; travel: PdpTravel[] }

const POI_TYPES: Record<string, { label: string; dot: string }> = {
  school:       { label: 'Школа',       dot: '#18181b' },
  hospital:     { label: 'Больница',    dot: '#18181b' },
  clinic:       { label: 'Клиника',     dot: '#18181b' },
  pharmacy:     { label: 'Аптека',      dot: '#18181b' },
  supermarket:  { label: 'Супермаркет', dot: '#18181b' },
  kindergarten: { label: 'Детсад',      dot: '#18181b' },
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(1)} км`; }
function fmtMin(m: number) { return m < 500 ? `${Math.max(1, Math.round(m / 80))} мин` : `${Math.max(1, Math.round(m / 600))} мин`; }


export const fetchLocationDataCached = unstable_cache(
  async (lat: number, lng: number): Promise<LocationData> => {
  try {
    const q = `[out:json][timeout:10];(
node[amenity~"^(school|hospital|clinic|pharmacy|kindergarten)$"](around:3000,${lat},${lng});
node[shop=supermarket](around:3000,${lat},${lng});
node[aeroway=aerodrome](around:120000,${lat},${lng});
way[highway~"^(trunk|primary|motorway)$"](around:5000,${lat},${lng});
);out center;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(q)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': '6sotok-kz/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    // 429/504 у публичного Overpass — обычное дело. Пробрасываем наверх, чтобы
    // unstable_cache НЕ запомнил пустышку на сутки (иначе одна временная ошибка
    // гасит POI объявления на 24 часа). Пустой ответ 200 — это честное «рядом
    // ничего нет», его кешируем.
    if (!res.ok) throw new Error(`overpass ${res.status}`);
    const data = await res.json();
    // Overpass умеет отвечать 200 с полем remark («runtime error: Query timed
    // out…») — это сбой под видом успеха. Без этой проверки он кешировался бы
    // на сутки как честное «рядом ничего нет».
    if (typeof data.remark === 'string') throw new Error(`overpass remark: ${data.remark.slice(0, 80)}`);
    if (!data.elements?.length) return { mapPOIs: [], travel: [] };

    const seen = new Set<string>();
    const mapPOIs: MapPOI[] = [];
    let airport: { dist: number; name: string } | null = null;
    let school: { dist: number } | null = null;
    let clinic: { dist: number; label: string } | null = null;
    let road: { dist: number } | null = null;

    for (const el of data.elements as any[]) {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) continue;
      const dist = haversine(lat, lng, elLat, elLon);
      const aeroway = el.tags?.aeroway;
      const highway = el.tags?.highway;
      const amenity = el.tags?.amenity || el.tags?.shop;

      if (aeroway === 'aerodrome') {
        const name = el.tags?.iata ? `Аэропорт ${el.tags.iata}` : (el.tags?.name || 'Аэропорт');
        if (!airport || dist < airport.dist) airport = { dist, name };
        continue;
      }
      if (highway) { if (!road || dist < road.dist) road = { dist }; continue; }

      const type = POI_TYPES[amenity];
      if (!type) continue;
      const key = `${amenity}-${Math.round(dist / 100)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      mapPOIs.push({ lat: elLat, lng: elLon, label: `${type.label} · ${fmtDist(dist)}`, dot: type.dot });
      if (amenity === 'school' && (!school || dist < school.dist)) school = { dist };
      if ((amenity === 'hospital' || amenity === 'clinic') && (!clinic || dist < clinic.dist)) {
        clinic = { dist, label: amenity === 'hospital' ? 'Больница' : 'Поликлиника' };
      }
    }
    mapPOIs.sort((a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng));

    const travel: PdpTravel[] = [];
    if (airport) travel.push({ label: airport.name, value: fmtMin(airport.dist) });
    if (school) travel.push({ label: 'Школа', value: fmtDist(school.dist) });
    if (clinic) travel.push({ label: clinic.label, value: fmtDist(clinic.dist) });
    if (road) travel.push({ label: 'Трасса', value: fmtDist(road.dist) });

    return { mapPOIs: mapPOIs.slice(0, 8), travel };
  } catch (e) {
    throw e instanceof Error ? e : new Error('overpass failed');
  }
  },
  // при отравлении кеша пустышками ключ бампаем — Data Cache Vercel переживает деплой
  ['pdp-overpass-v2'],
  { revalidate: 86400 },
);

/**
 * Публичная обёртка: сбой Overpass не должен ломать карточку. Ошибка сюда
 * долетает НЕ закешированной, поэтому следующий посетитель попробует снова.
 * Тем, кому важно отличить «не смогли» от «рядом правда пусто» (напр. чтобы не
 * прибивать неудачу в CDN), нужен fetchLocationDataCached напрямую.
 */
export async function fetchLocationData(lat: number, lng: number): Promise<LocationData> {
  try {
    return await fetchLocationDataCached(lat, lng)
  } catch {
    return { mapPOIs: [], travel: [] }
  }
}
