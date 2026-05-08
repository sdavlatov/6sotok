'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HomeSearch({ locations }: { locations: string[] }) {
  const [city, setCity] = useState('');
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const suggestions = useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return locations.slice(0, 8);
    return locations.filter(l => l.toLowerCase().includes(q)).slice(0, 8);
  }, [city, locations]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = () => {
    const params = city.trim() ? `?location=${encodeURIComponent(city.trim())}` : '';
    router.push(`/catalog${params}`);
  };

  return (
    <div ref={ref} className="relative flex w-full max-w-xl">
      <div className="flex flex-1 items-center gap-2 bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <MapPin className="size-4 text-zinc-400 shrink-0" strokeWidth={2} />
        <input
          type="text"
          placeholder="Город, район, трасса..."
          value={city}
          onChange={e => { setCity(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onKeyDown={e => e.key === 'Enter' && go()}
          className="flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
        {city && (
          <button onClick={() => setCity('')} className="text-zinc-300 hover:text-zinc-500 transition-colors">
            <X className="size-4" />
          </button>
        )}
      </div>
      <button
        onClick={go}
        className="ml-2 flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-3 rounded-xl transition-colors duration-150 shrink-0"
      >
        <Search className="size-4" strokeWidth={2.5} />
        <span className="hidden sm:inline">Найти</span>
      </button>

      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-12 mt-2 bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden z-50">
          {suggestions.map(loc => (
            <button
              key={loc}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setCity(loc); setShow(false); go(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 text-left transition-colors"
            >
              <MapPin className="size-3.5 text-zinc-400 shrink-0" strokeWidth={2} />
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
