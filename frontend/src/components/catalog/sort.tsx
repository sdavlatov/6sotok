'use client';

const SORT_OPTIONS = [
  { value: 'Сначала новые',   label: 'Сначала новые',   short: 'Новые'   },
  { value: 'Сначала дешевые', label: 'Сначала дешевые', short: 'Дешевле' },
  { value: 'Сначала дорогие', label: 'Сначала дорогие', short: 'Дороже'  },
];

const CHEVRON = `url("data:image/svg+xml;charset=US-ASCII,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%2371717A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

interface CatalogSortProps {
  value: string;
  onChange: (value: string) => void;
  mobile?: boolean;
}

export function CatalogSort({ value, onChange, mobile }: CatalogSortProps) {
  if (mobile) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundImage: CHEVRON }}
        className="appearance-none rounded-xl border border-zinc-200 bg-white bg-no-repeat bg-[length:14px_14px] bg-[position:right_10px_center] pl-3 pr-7 py-2.5 text-[13px] font-bold text-zinc-900 shadow-sm outline-none cursor-pointer hover:border-zinc-300 transition-colors focus:border-primary"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.short}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-sm font-bold text-zinc-500 shrink-0">Сортировка:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundImage: CHEVRON }}
        className="appearance-none rounded-xl border border-zinc-200 bg-white bg-no-repeat bg-[length:14px_14px] bg-[position:right_14px_center] px-4 py-2.5 pr-10 text-[13px] font-bold text-zinc-900 shadow-sm outline-none cursor-pointer hover:border-zinc-300 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/10"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
