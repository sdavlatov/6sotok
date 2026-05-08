'use client';

import Link from 'next/link';

interface Props { cities: string[] }

export function CityMarquee({ cities }: Props) {
  const items = cities.length > 0 ? cities : [
    'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Қарағанды',
    'Тараз', 'Павлодар', 'Семей', 'Атырау', 'Костанай',
  ];

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-zinc-100 bg-white py-2.5">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-center gap-0 whitespace-nowrap"
        style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}
      >
        {doubled.map((city, i) => (
          <span key={i} className="flex items-center">
            <Link
              href={`/catalog?location=${encodeURIComponent(city)}`}
              className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 px-5 hover:text-zinc-700 transition-colors"
            >
              {city}
            </Link>
            <span className="text-zinc-200 text-[10px]">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
