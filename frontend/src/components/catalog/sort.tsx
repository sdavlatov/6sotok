'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'Сначала новые',    label: 'Сначала новые'    },
  { value: 'Сначала дешевые', label: 'Сначала дешевые'  },
  { value: 'Сначала дорогие', label: 'Сначала дорогие'  },
  { value: 'Дешевле за сотку', label: 'Дешевле за сотку' },
];

const CHEVRON = `url("data:image/svg+xml;charset=US-ASCII,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%2371717A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

interface CatalogSortProps {
  value: string;
  onChange: (value: string) => void;
  mobile?: boolean;
  inline?: boolean;
}

export function CatalogSort({ value, onChange, mobile, inline }: CatalogSortProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (inline) {
    return (
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-0.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap"
        >
          {value}
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
            {SORT_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-[12.5px] transition-colors whitespace-nowrap ${
                  o.value === value
                    ? 'bg-zinc-50 font-semibold text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mobile) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundImage: CHEVRON }}
        className="appearance-none rounded-lg border border-zinc-200 bg-white bg-no-repeat bg-[length:12px_12px] bg-[position:right_8px_center] pl-2.5 pr-6 py-1 text-[11.5px] font-semibold text-zinc-700 outline-none cursor-pointer hover:border-zinc-300 transition-colors focus:border-primary"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <span className="hidden sm:block text-sm font-bold text-zinc-500 shrink-0">Сортировка:</span>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ backgroundImage: CHEVRON }}
        className="appearance-none rounded-xl border border-zinc-200 bg-white bg-no-repeat bg-[length:14px_14px] bg-[position:right_14px_center] px-4 py-2.5 pr-10 text-[13px] font-bold text-zinc-900 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors text-left min-w-[160px]"
      >
        {value}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[180px]">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors whitespace-nowrap ${
                o.value === value
                  ? 'bg-zinc-50 font-semibold text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
