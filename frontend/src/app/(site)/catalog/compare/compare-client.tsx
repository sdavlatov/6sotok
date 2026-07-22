'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Plus, ArrowUpDown } from 'lucide-react';
import type { Listing } from '@/types/listing';
import { listingUrl } from '@/lib/listing-url';

// ── helpers ──────────────────────────────────────────────────────────────────
const PLOT_BG = ['plot-img', 'plot-img-2', 'plot-img-3', 'plot-img-4'];

function fmt(n: number) { return new Intl.NumberFormat('ru-RU').format(n); }
function fmtPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} млн ₸`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₸`;
  return `${n} ₸`;
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} млн`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс`;
  return `${n}`;
}

// Haversine distance in km
function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Almaty center coords
const ALMATY = { lat: 43.238949, lng: 76.889709 };

// Mortgage monthly payment: 7% Otbasy, 25 years, 20% down
function mortgage(price: number) {
  const P = price * 0.8;
  const r = 0.07 / 12;
  const n = 300;
  return Math.round(P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
}

function BoolCell({ val, invert = false }: { val: boolean | null | undefined; invert?: boolean }) {
  if (val === undefined || val === null) return <span className="text-zinc-300 font-mono text-[13px]">—</span>;
  const good = invert ? !val : val;
  return good
    ? <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary"><Check className="size-4 shrink-0" />{val ? 'Да' : 'Нет'}</span>
    : <span className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-400"><X className="size-4 shrink-0" />{val ? 'Да' : 'Нет'}</span>;
}

// ── row definition ────────────────────────────────────────────────────────────
interface RowDef {
  label: string;
  getValue: (l: Listing) => unknown;
  render: (l: Listing, i: number, bestIdx: number, ls: Listing[]) => React.ReactNode;
  bestFn?: (ls: Listing[]) => number;
}

function lowestIdx(fn: (l: Listing) => number) {
  return (ls: Listing[]) => { const vs = ls.map(fn); return vs.indexOf(Math.min(...vs)); };
}
function highestIdx(fn: (l: Listing) => number) {
  return (ls: Listing[]) => { const vs = ls.map(fn); return vs.indexOf(Math.max(...vs)); };
}

// ── sections ─────────────────────────────────────────────────────────────────
const SECTIONS: Array<{ title: string; rows: RowDef[] }> = [
  {
    title: '▸ основное',
    rows: [
      {
        label: 'Площадь', getValue: l => l.area,
        bestFn: highestIdx(l => l.area),
        render: (l, i, best, ls) => {
          const max = Math.max(...ls.map(x => x.area));
          return <>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-[20px] text-zinc-900">{l.area}</span>
              <span className="text-[11px] text-zinc-400 font-mono">сот.</span>
              {i === best && ls.length > 1 && <span className="px-1.5 py-0.5 rounded bg-primary text-white font-mono text-[9px] font-bold uppercase">Больше</span>}
            </div>
            <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(l.area / max) * 100}%`, background: i === best ? 'linear-gradient(90deg,#066F36,#2CA64E)' : '#d4d4d8' }} />
            </div>
          </>;
        },
      },
      {
        label: 'Цена', getValue: l => l.price,
        bestFn: lowestIdx(l => l.price),
        render: (l, i, best, ls) => <>
          <span className="font-black tracking-tight text-[20px] text-zinc-900">{fmtPrice(l.price)}</span>
          {i === best && ls.length > 1 && <span className="font-mono text-[10.5px] text-primary mt-1">↓ дешевле всех</span>}
        </>,
      },
      {
        label: 'Цена за сотку', getValue: l => Math.round(l.price / l.area),
        bestFn: lowestIdx(l => l.price / l.area),
        render: (l, i, best, ls) => {
          const ps = ls.map(x => Math.round(x.price / x.area));
          return <>
            <div className="flex items-center gap-2">
              <span className={`font-black tracking-tight text-[20px] ${i === best ? 'text-primary' : 'text-zinc-900'}`}>{fmtShort(ps[i])}</span>
              <span className="text-[11px] text-zinc-400 font-mono">₸/сот</span>
              {i === best && ls.length > 1 && <span className="px-1.5 py-0.5 rounded bg-primary text-white font-mono text-[9px] font-bold uppercase">Best</span>}
            </div>
            {i !== best && ls.length > 1 && <span className="font-mono text-[10.5px] text-danger mt-1">+{Math.round((ps[i] / ps[best] - 1) * 100)}% к лучшей</span>}
          </>;
        },
      },
      {
        label: 'Тип', getValue: l => l.landType,
        render: (l) => <>
          <span className="text-[13.5px] font-semibold text-zinc-900">{l.landType}</span>
          {l.purpose && l.purpose !== l.landType && <span className="text-[11px] text-zinc-400 mt-0.5">{l.purpose}</span>}
        </>,
      },
      {
        label: 'Кадастр', getValue: l => l.cadastralNumber ?? '',
        render: (l) => l.cadastralNumber
          ? <><span className="font-mono text-[12px] text-zinc-900">{l.cadastralNumber}</span><span className="text-[10.5px] text-primary font-semibold mt-0.5">✓ проверен</span></>
          : <span className="text-zinc-300 font-mono text-[13px]">—</span>,
      },
      {
        label: 'Рельеф', getValue: l => l.reliefType ?? '',
        render: (l) => l.reliefType
          ? <span className="text-[13px] font-medium text-zinc-900">{l.reliefType}</span>
          : <span className="text-zinc-300 font-mono text-[13px]">—</span>,
      },
    ],
  },
  {
    title: '▸ коммуникации',
    rows: [
      { label: 'Электричество', getValue: l => l.hasElectricity, bestFn: highestIdx(l => l.hasElectricity ? 1 : 0), render: (l) => <BoolCell val={l.hasElectricity} /> },
      { label: 'Газ',           getValue: l => l.hasGas,         bestFn: highestIdx(l => l.hasGas ? 1 : 0),         render: (l) => <BoolCell val={l.hasGas} /> },
      { label: 'Вода',          getValue: l => l.hasWater,       bestFn: highestIdx(l => l.hasWater ? 1 : 0),       render: (l) => <BoolCell val={l.hasWater} /> },
      { label: 'Канализация',   getValue: l => l.hasSewer,       bestFn: highestIdx(l => l.hasSewer ? 1 : 0),       render: (l) => <BoolCell val={l.hasSewer} /> },
      { label: 'Дорога',        getValue: l => l.hasRoadAccess,  bestFn: highestIdx(l => l.hasRoadAccess ? 1 : 0),  render: (l) => <BoolCell val={l.hasRoadAccess} /> },
    ],
  },
  {
    title: '▸ документы и сделка',
    rows: [
      { label: 'Госакт',        getValue: l => l.hasStateAct,   bestFn: highestIdx(l => l.hasStateAct ? 1 : 0),  render: (l) => <BoolCell val={l.hasStateAct} /> },
      {
        label: 'Залог', getValue: l => l.isPledged,
        render: (l) => l.isPledged === undefined || l.isPledged === null
          ? <span className="text-zinc-300 font-mono text-[13px]">—</span>
          : l.isPledged
            ? <span className="text-[13px] font-semibold text-warning">Есть залог</span>
            : <span className="text-[13px] font-semibold text-primary">Без залога</span>,
      },
      { label: 'Делимый',       getValue: l => l.isDivisible,   bestFn: highestIdx(l => l.isDivisible ? 1 : 0),  render: (l) => <BoolCell val={l.isDivisible} /> },
      { label: 'Красная линия', getValue: l => l.isOnRedLine,   bestFn: lowestIdx(l => l.isOnRedLine ? 1 : 0),   render: (l) => <BoolCell val={l.isOnRedLine} invert /> },
      {
        label: 'Сделка', getValue: l => l.dealType,
        render: (l) => <>
          <span className="text-[13px] font-semibold text-zinc-900">{l.dealType === 'sale' ? 'Продажа' : l.dealType === 'rent' ? 'Аренда' : '—'}</span>
          {l.isNegotiable && <span className="mt-0.5 text-[10.5px] font-mono text-amber-600">торг уместен</span>}
        </>,
      },
    ],
  },
];

// ── component ─────────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc';

interface Weights { price: number; utils: number; docs: number; area: number; location: number; }

const DEFAULT_WEIGHTS: Weights = { price: 35, utils: 25, docs: 20, area: 10, location: 10 };

function isDiff(row: RowDef, ls: Listing[]) {
  const vs = ls.map(l => String(row.getValue(l)));
  return vs.some(v => v !== vs[0]);
}

function computeScore(l: Listing, i: number, ls: Listing[], w: Weights) {
  const minPPS = Math.min(...ls.map(x => x.price / x.area));
  const maxArea = Math.max(...ls.map(x => x.area));
  const pps = l.price / l.area;

  const priceScore    = Math.round((minPPS / pps) * 100);
  const utilsScore    = Math.round([l.hasElectricity, l.hasGas, l.hasWater, l.hasSewer, l.hasRoadAccess].filter(Boolean).length / 5 * 100);
  const docsScore     = Math.round((l.hasStateAct ? 40 : 0) + (!l.isPledged ? 30 : 0) + (!l.hasEncumbrances ? 30 : 0));
  const areaScore     = Math.round((l.area / maxArea) * 100);

  const dists = ls.map(x => x.lat && x.lng ? distKm(x.lat, x.lng, ALMATY.lat, ALMATY.lng) : null);
  const hasDist = dists.every(d => d !== null);
  const myDist = dists[i];
  let locationScore = 50;
  if (hasDist && myDist !== null) {
    const maxDist = Math.max(...(dists as number[]));
    locationScore = Math.round((1 - myDist / maxDist) * 100);
  }

  const total = w.price + w.utils + w.docs + w.area + w.location;
  const weighted = Math.round(
    (priceScore * w.price + utilsScore * w.utils + docsScore * w.docs + areaScore * w.area + locationScore * w.location) / total
  );

  return { total: weighted, price: priceScore, utils: utilsScore, docs: docsScore, area: areaScore, location: locationScore };
}

export function CompareClient({ initialListings }: { initialListings: Listing[] }) {
  const router = useRouter();
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  const listings = useMemo(() => {
    return [...initialListings].sort((a, b) => {
      const pa = a.price / a.area, pb = b.price / b.area;
      return sortDir === 'asc' ? pa - pb : pb - pa;
    });
  }, [initialListings, sortDir]);

  const cols = listings.length;
  const gridCols = `180px repeat(${cols}, minmax(260px, 1fr)) 190px`;
  const minW = 180 + cols * 260 + 190;

  const perSotkas = listings.map(l => Math.round(l.price / l.area));
  const maxArea = Math.max(...listings.map(l => l.area));
  const bestPPSIdx  = perSotkas.indexOf(Math.min(...perSotkas));
  const bestAreaIdx = listings.map(l => l.area).indexOf(maxArea);
  const utilsCounts = listings.map(l => [l.hasElectricity, l.hasGas, l.hasWater, l.hasSewer, l.hasRoadAccess].filter(Boolean).length);
  const bestUtilsIdx = utilsCounts.indexOf(Math.max(...utilsCounts));

  // Distances to Almaty
  const dists = listings.map(l => l.lat && l.lng ? Math.round(distKm(l.lat, l.lng, ALMATY.lat, ALMATY.lng)) : null);
  const hasAnyDist = dists.some(d => d !== null);
  const bestDistIdx = hasAnyDist ? dists.indexOf(Math.min(...(dists.filter(d => d !== null) as number[]))) : -1;

  // Scores
  const scores = listings.map((l, i) => computeScore(l, i, listings, weights));
  const sortedByScore = [...listings.map((l, i) => ({ l, i, score: scores[i] }))]
    .sort((a, b) => b.score.total - a.score.total);

  function removeListing(id: string) {
    const newIds = listings.filter(l => l.id !== id).map(l => l.id);
    if (newIds.length === 0) router.push('/catalog');
    else router.push(`/catalog/compare?ids=${newIds.join(',')}`);
  }

  const CmpAdd = () => (
    <div className="cmp-add">
      <Link href="/catalog" className="flex flex-col items-center gap-2 text-center w-full">
        <span className="w-11 h-11 rounded-full bg-white border border-dashed border-zinc-300 hover:border-primary hover:text-primary text-zinc-400 flex items-center justify-center transition-colors">
          <Plus className="size-5" />
        </span>
        <span className="text-[12px] font-semibold text-zinc-600">Добавить участок</span>
        <span className="font-mono text-[10px] text-zinc-400 leading-tight">до 4 уч.<br />в одном</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* ── HERO + TOOLBAR ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <h1 className="font-black tracking-tight text-[48px] sm:text-[64px] leading-[0.94] text-zinc-900 mb-3">
            Сравнение участков
            <span className="block text-zinc-400">бок о бок.</span>
          </h1>
          <p className="text-[15px] text-zinc-500 max-w-2xl leading-snug">
            Цифры, документы и коммуникации в одной строке.
            Лучший показатель в ряду подсвечен зелёным — без скрытых трактовок.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 px-3 h-9 rounded-lg border border-zinc-200 bg-white text-[12.5px] font-medium text-zinc-700 hover:border-zinc-400 transition-colors cursor-pointer select-none">
            <input type="checkbox" checked={onlyDiffs} onChange={e => setOnlyDiffs(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
            Только различия
          </label>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-zinc-200 bg-white text-[12.5px] font-medium text-zinc-700 hover:border-zinc-400 transition-colors"
          >
            <ArrowUpDown className="size-3.5" />
            Сорт.: по цене за сотку {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          <Link href="/catalog" className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-primary transition-colors">
            <Plus className="size-3.5" /> Участок
          </Link>
        </div>
      </div>

      {/* ── VERDICT STRIP ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">↓ дешевле за сотку</div>
          <div className="flex items-end gap-2">
            <div className="font-black tracking-tight text-[24px] text-zinc-900 leading-none line-clamp-1">{listings[bestPPSIdx]?.title}</div>
          </div>
          <div className="mt-2 text-[13px] text-zinc-600">
            {fmtShort(perSotkas[bestPPSIdx])} ₸ / сот.
            {cols > 1 && <span className="ml-2 text-primary font-semibold">— на {Math.round((1 - perSotkas[bestPPSIdx] / Math.max(...perSotkas)) * 100)}% ниже среднего</span>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">
            {hasAnyDist ? '↓ ближе к Алматы' : '↑ больше площадь'}
          </div>
          <div className="font-black tracking-tight text-[24px] text-zinc-900 leading-none line-clamp-1">
            {hasAnyDist ? listings[bestDistIdx]?.title : listings[bestAreaIdx]?.title}
          </div>
          <div className="mt-2 text-[13px] text-zinc-600">
            {hasAnyDist
              ? `${dists[bestDistIdx]} км · ~${Math.round((dists[bestDistIdx] as number) / 60 * 60)} мин до центра`
              : `${listings[bestAreaIdx]?.area} сот.`
            }
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">✓ полный набор коммуникаций</div>
          <div className="font-black tracking-tight text-[24px] text-zinc-900 leading-none line-clamp-1">{listings[bestUtilsIdx]?.title}</div>
          <div className="mt-2 text-[13px] text-zinc-600">{utilsCounts[bestUtilsIdx]} из 5 коммуникаций подведено</div>
        </div>
      </div>

      {/* ── MAIN TABLE ──────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.08)]">
        <div className="overflow-x-auto">
          <div className="cmp-grid" style={{ gridTemplateColumns: gridCols, minWidth: `${minW}px` }}>

            {/* Header row */}
            <div className="cmp-row">
              <div className="cmp-label sticky top-0 z-10" style={{ borderTop: 'none', background: '#fff' }}>
                <div>
                  <div className="text-zinc-900 font-black text-[13px] normal-case font-sans tracking-tight">Участок</div>
                  <div className="text-zinc-400 text-[10px] normal-case tracking-normal mt-0.5">кликнуть, чтобы открыть</div>
                </div>
              </div>

              {listings.map((l, i) => (
                <div key={l.id} className="cmp-cell border-r border-zinc-100 last:border-r-0 !p-0 sticky top-0 z-10 bg-white">
                  <div className="p-4">
                    {/* Photo */}
                    <div className={`relative rounded-xl overflow-hidden aspect-[5/3] mb-3 ${PLOT_BG[i % PLOT_BG.length]}`}>
                      {l.image && <Image src={l.image} alt={l.title} fill sizes="(max-width: 768px) 60vw, 280px" className="object-cover" />}
                      {l.isNegotiable && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider">Торг</span>}
                    </div>
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-medium text-zinc-400 uppercase tracking-wider">{l.landType} · {l.location}</div>
                        <Link href={listingUrl(l)} className="mt-0.5 font-black tracking-tight text-[16px] leading-tight text-zinc-900 hover:text-primary transition-colors line-clamp-2 block">{l.title}</Link>
                      </div>
                      <button onClick={() => removeListing(l.id)} className="text-zinc-300 hover:text-zinc-700 text-[14px] shrink-0 -mr-1 mt-1 leading-none transition-colors" title="Убрать">✕</button>
                    </div>
                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-black tracking-tight text-[24px] text-zinc-900">{fmtShort(l.price)} <span className="text-[14px] text-zinc-400 font-normal">млн ₸</span></span>
                    </div>
                    <div className="text-[10.5px] font-mono text-zinc-400 mt-0.5">{fmt(perSotkas[i])} ₸ / сотка</div>
                  </div>
                </div>
              ))}

              <div className="cmp-add sticky top-0 z-10" style={{ borderTop: 'none' }}><CmpAdd /></div>
            </div>

            {/* Data sections */}
            {SECTIONS.map(section => {
              const visibleRows = onlyDiffs ? section.rows.filter(r => isDiff(r, listings)) : section.rows;
              if (visibleRows.length === 0) return null;
              return (
                <div key={section.title} style={{ display: 'contents' }}>
                  <div className="cmp-section" style={{ gridColumn: '1 / -1' }}>{section.title}</div>
                  {visibleRows.map(row => {
                    const bestIdx = row.bestFn ? row.bestFn(listings) : -1;
                    return (
                      <div key={row.label} className="cmp-row">
                        <div className="cmp-label">{row.label}</div>
                        {listings.map((l, i) => (
                          <div key={l.id} className={`cmp-cell border-r border-zinc-100 last:border-r-0 ${i === bestIdx && cols > 1 ? 'cmp-cell-best' : ''}`}>
                            {row.render(l, i, bestIdx, listings)}
                          </div>
                        ))}
                        <div className="cmp-add" />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Location section */}
            {!onlyDiffs && (
              <div style={{ display: 'contents' }}>
                <div className="cmp-section" style={{ gridColumn: '1 / -1' }}>▸ локация и инфраструктура</div>

                {/* Mini-map */}
                <div className="cmp-row">
                  <div className="cmp-label">На карте</div>
                  {listings.map((l, i) => (
                    <div key={l.id} className="cmp-cell border-r border-zinc-100 last:border-r-0 !p-3">
                      <div className="relative rounded-lg overflow-hidden h-[110px] map-bg">
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 text-white font-black text-[11px] shadow border-2 border-white">{i + 1}</span>
                        {l.lat && l.lng && (
                          <span className="absolute bottom-2 left-2 font-mono text-[9px] text-zinc-600/70">{l.lat.toFixed(2)}°N {l.lng.toFixed(2)}°E</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="cmp-add" />
                </div>

                {/* Address */}
                <div className="cmp-row">
                  <div className="cmp-label">Адрес</div>
                  {listings.map(l => (
                    <div key={l.id} className="cmp-cell border-r border-zinc-100 last:border-r-0">
                      <span className="text-[12.5px] text-zinc-900">{l.address || l.location}</span>
                    </div>
                  ))}
                  <div className="cmp-add" />
                </div>

                {/* Distance to Almaty */}
                <div className="cmp-row">
                  <div className="cmp-label">До центра Алматы</div>
                  {listings.map((l, i) => (
                    <div key={l.id} className={`cmp-cell border-r border-zinc-100 last:border-r-0 ${i === bestDistIdx && cols > 1 ? 'cmp-cell-best' : ''}`}>
                      {dists[i] !== null ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`font-black tracking-tight text-[18px] ${i === bestDistIdx && cols > 1 ? 'text-primary' : 'text-zinc-900'}`}>{dists[i]} <span className="text-[12px] text-zinc-400 font-mono">км</span></span>
                            {i === bestDistIdx && cols > 1 && <span className="px-1.5 py-0.5 rounded bg-primary text-white font-mono text-[9px] font-bold uppercase">Best</span>}
                          </div>
                          <span className="font-mono text-[10.5px] text-zinc-500 mt-0.5">~ {Math.round((dists[i] as number) / 60 * 60)} мин</span>
                        </>
                      ) : (
                        <span className="text-zinc-300 font-mono text-[13px]">—</span>
                      )}
                    </div>
                  ))}
                  <div className="cmp-add" />
                </div>
              </div>
            )}

            {/* Seller section */}
            {!onlyDiffs && listings.some(l => l.seller) && (
              <div style={{ display: 'contents' }}>
                <div className="cmp-section" style={{ gridColumn: '1 / -1' }}>▸ продавец</div>
                <div className="cmp-row">
                  <div className="cmp-label">Продавец</div>
                  {listings.map(l => (
                    <div key={l.id} className="cmp-cell border-r border-zinc-100 last:border-r-0">
                      {l.seller ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">{l.seller.name.slice(0, 2).toUpperCase()}</div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-zinc-900 truncate">{l.seller.name}</div>
                            <div className={`text-[10.5px] font-mono ${l.seller.isAgency ? 'text-zinc-400' : 'text-primary'}`}>{l.seller.isAgency ? 'Агент' : 'Хозяин'}</div>
                          </div>
                        </div>
                      ) : <span className="text-zinc-300 font-mono text-[13px]">—</span>}
                    </div>
                  ))}
                  <div className="cmp-add" />
                </div>
              </div>
            )}

            {/* Ипотека section */}
            {!onlyDiffs && (
              <div style={{ display: 'contents' }}>
                <div className="cmp-section" style={{ gridColumn: '1 / -1' }}>▸ цена и ипотека</div>

                <div className="cmp-row">
                  <div className="cmp-label">Ипотека / мес</div>
                  {listings.map((l, i) => {
                    const pay = mortgage(l.price);
                    const bestPay = Math.min(...listings.map(x => mortgage(x.price)));
                    const isBest = pay === bestPay;
                    return (
                      <div key={l.id} className={`cmp-cell border-r border-zinc-100 last:border-r-0 ${isBest && cols > 1 ? 'cmp-cell-best' : ''}`}>
                        <div className={`font-black tracking-tight text-[18px] ${isBest && cols > 1 ? 'text-primary' : 'text-zinc-900'}`}>{fmt(pay)} ₸</div>
                        <div className="font-mono text-[10.5px] text-zinc-400 mt-0.5">Otbasy 7%, 25 лет, 20% ПВ</div>
                      </div>
                    );
                  })}
                  <div className="cmp-add" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'contents' }}>
              <div className="cmp-section" style={{ gridColumn: '1 / -1' }}>▸ действия</div>
              <div className="cmp-row">
                <div className="cmp-label" />
                {listings.map(l => (
                  <div key={l.id} className="cmp-cell border-r border-zinc-100 last:border-r-0 !py-5 gap-2">
                    <Link href={listingUrl(l)} className="w-full flex items-center justify-center h-11 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold hover:bg-primary transition-colors">
                      {l.seller?.isAgency === false ? 'Связаться с хозяином' : 'Открыть объявление'} →
                    </Link>
                    <Link href={listingUrl(l)} className="mt-2 h-10 rounded-xl border border-zinc-200 text-[12.5px] font-semibold text-zinc-900 hover:border-zinc-400 transition-colors flex items-center justify-center w-full">
                      Открыть участок →
                    </Link>
                  </div>
                ))}
                <div className="cmp-add" />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── SCORECARD ───────────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-6">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-primary mb-3">▸ оценка по приоритетам</div>
            <h2 className="font-black tracking-tight text-[40px] sm:text-[48px] leading-[0.95] text-zinc-900">
              Какой подходит вам?
              <span className="block text-zinc-400 text-[24px] sm:text-[28px] font-medium">взвесьте важное — увидите лидера</span>
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          {/* Sliders */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-zinc-500 mb-4">приоритеты</div>
            <div className="space-y-4">
              {([
                { key: 'price',    label: 'Цена за сотку' },
                { key: 'utils',    label: 'Коммуникации' },
                { key: 'docs',     label: 'Документы' },
                { key: 'area',     label: 'Площадь' },
                { key: 'location', label: 'Близость к Алмате' },
              ] as Array<{ key: keyof Weights; label: string }>).map(({ key, label }) => (
                <div key={key}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="text-[12.5px] font-semibold text-zinc-900">{label}</label>
                    <span className="font-mono text-[11px] text-zinc-500">{weights[key]}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={weights[key]}
                    onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Score cards */}
          <div className={`grid gap-4 ${cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            {sortedByScore.map(({ l, i, score }, rank) => {
              const isWinner = rank === 0;
              return (
                <div key={l.id} className={`rounded-3xl p-6 relative overflow-hidden ${isWinner ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-900'}`}>
                  {isWinner && (
                    <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(44,166,78,0.45) 0%, transparent 60%)' }} />
                  )}
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      {isWinner && <span className="px-2 py-1 rounded bg-primary-light text-zinc-900 font-mono text-[10px] font-black uppercase tracking-widest">↑ Лидер</span>}
                      <span className={`font-mono text-[10.5px] uppercase tracking-widest ${isWinner ? 'text-white/50' : 'text-zinc-400'}`}>#{rank + 1}</span>
                    </div>
                    <div className={`font-black tracking-tight text-[13px] line-clamp-1 ${isWinner ? 'text-white/60' : 'text-zinc-500'}`}>{l.title}</div>
                    <div className={`mt-3 font-black tracking-tight text-[68px] leading-none ${isWinner ? 'text-white' : 'text-zinc-900'}`}>
                      {score.total}<span className={`text-[26px] ${isWinner ? 'text-white/30' : 'text-zinc-300'}`}>/100</span>
                    </div>
                    <div className="mt-4 space-y-2 text-[11.5px]">
                      {[
                        { label: 'Цена за сотку', val: score.price },
                        { label: 'Коммуникации',  val: score.utils },
                        { label: 'Документы',     val: score.docs },
                        { label: 'Площадь',       val: score.area },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className={isWinner ? 'text-white/60' : 'text-zinc-500'}>{label}</span>
                          <span className={`font-mono font-bold ${val === 100 ? (isWinner ? 'text-primary-light' : 'text-primary') : (isWinner ? 'text-white' : 'text-zinc-900')}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={listingUrl(l)} className={`mt-5 w-full h-10 rounded-xl text-[12.5px] font-bold flex items-center justify-center transition-colors ${isWinner ? 'bg-white text-zinc-900 hover:bg-primary-light hover:text-white' : 'border border-zinc-200 text-zinc-900 hover:border-zinc-400'}`}>
                      Перейти к участку →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <p className="mt-10 text-[12px] font-mono text-zinc-400 leading-relaxed max-w-2xl">
        Данные из объявлений. Цена за сотку и ипотека рассчитаны автоматически.
        Расстояния — по прямой до пр. Назарбаева, 60. Проверяйте актуальность у продавца.
      </p>
    </>
  );
}
