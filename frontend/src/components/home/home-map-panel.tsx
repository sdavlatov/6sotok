import Link from 'next/link';

interface Dot { lat: number; lng: number; }
interface Cluster { lat: number; lng: number; count: number; }

interface Props {
  landCount: number;
  clusters: Cluster[];
  scatterDots: Dot[];
  featuredPrice?: number;
  featuredLat?: number;
  featuredLng?: number;
}

const KZ = { latMin: 40.5, latMax: 55.5, lngMin: 50.0, lngMax: 87.5 };

function toXY(lat: number, lng: number) {
  const x = ((lng - KZ.lngMin) / (KZ.lngMax - KZ.lngMin)) * 100;
  const y = ((KZ.latMax - lat) / (KZ.latMax - KZ.latMin)) * 100;
  return { x: Math.max(2, Math.min(95, x)), y: Math.max(2, Math.min(95, y)) };
}

const fmtM = (n: number) => (n / 1_000_000).toFixed(1).replace(/\.0$/, '');

export function HomeMapPanel({ landCount, clusters, scatterDots, featuredPrice, featuredLat, featuredLng }: Props) {
  const top3 = clusters.slice(0, 3);
  const rest = clusters.slice(3);

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden border border-zinc-200 map-bg shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.10)]">

      {/* Cluster pins */}
      {top3.map((c, i) => {
        const { x, y } = toXY(c.lat, c.lng);
        const large = c.count > 100;
        const delays = ['0s', '0.4s', '0.9s'];
        return (
          <button key={i} aria-label={`Кластер ${c.count}`}
            className="absolute z-10"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
            <span className="absolute inset-0 -m-2 rounded-full bg-primary pin-pulse"
              style={{ animationDelay: delays[i] }} />
            <span className={`relative flex items-center justify-center rounded-full text-white font-black border-[3px] border-white shadow-[0_4px_14px_rgba(6,111,54,0.4)] ${
              large
                ? 'w-14 h-14 text-[16px] bg-[#021A0E]'
                : 'w-12 h-12 text-[15px] bg-primary'
            }`}
              style={{ letterSpacing: '-0.035em' }}>
              {c.count >= 1000 ? `${(c.count/1000).toFixed(1)}k` : c.count}
            </span>
          </button>
        );
      })}

      {/* Small cluster dots */}
      {rest.slice(0, 6).map((c, i) => {
        const { x, y } = toXY(c.lat, c.lng);
        return (
          <span key={i} className="absolute z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-[11px] font-black border-2 border-white shadow"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', letterSpacing: '-0.02em' }}>
            {c.count}
          </span>
        );
      })}

      {/* Scatter dots */}
      {scatterDots.map((d, i) => {
        const { x, y } = toXY(d.lat, d.lng);
        return (
          <span key={i} className="absolute z-10 w-3.5 h-3.5 rounded-full bg-zinc-900 border-2 border-white shadow"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }} />
        );
      })}

      {/* Featured price pin */}
      {featuredPrice && featuredLat && featuredLng && (() => {
        const { x, y } = toXY(featuredLat, featuredLng);
        return (
          <button className="absolute z-30"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}>
            <span className="relative flex items-center gap-1.5 pl-1 pr-2.5 h-8 rounded-full bg-zinc-900 text-white text-[12.5px] font-bold tracking-tight shadow-lg border-2 border-white whitespace-nowrap">
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-black">★</span>
              {fmtM(featuredPrice)} млн
            </span>
          </button>
        );
      })()}

      {/* Top-left: counter badge */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur rounded-xl border border-zinc-200/60 px-3 py-2 shadow-sm">
        <div className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-500">в окне карты</div>
        <div className="text-[15px] font-black tracking-[-0.035em] text-zinc-900">{landCount.toLocaleString('ru-RU')} участков</div>
      </div>

      {/* Top-right: zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 font-bold text-lg shadow-sm hover:bg-zinc-50 flex items-center justify-center">+</Link>
        <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 font-bold text-lg shadow-sm hover:bg-zinc-50 flex items-center justify-center">−</Link>
        <Link href="/catalog?view=map" className="w-9 h-9 rounded-xl bg-white border border-zinc-200/60 text-zinc-700 shadow-sm hover:bg-zinc-50 flex items-center justify-center font-mono text-[11px] font-bold">⊕</Link>
      </div>

      {/* Bottom-left: layer toggle */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur rounded-xl border border-zinc-200/60 p-1 flex gap-0.5 shadow-sm text-[11.5px] font-medium">
        <span className="px-2.5 h-7 rounded-lg bg-zinc-900 text-white flex items-center">Схема</span>
        <Link href="/catalog?view=satellite" className="px-2.5 h-7 rounded-lg text-zinc-600 hover:bg-zinc-100 flex items-center">Спутник</Link>
        <Link href="/catalog?view=cadastre" className="px-2.5 h-7 rounded-lg text-zinc-600 hover:bg-zinc-100 flex items-center">Кадастр</Link>
      </div>

      {/* Compass */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 hidden xl:flex flex-col items-center gap-2 font-mono text-[9px] text-zinc-600 tracking-widest">
        <div className="text-zinc-700 font-bold">N</div>
        <div className="w-px h-16 bg-zinc-400/40" />
        <div>S</div>
      </div>

    </div>
  );
}
