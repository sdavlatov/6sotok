'use client';

interface CatalogSortProps {
  value: string;
  onChange: (value: string) => void;
}

export function CatalogSort({ value, onChange }: CatalogSortProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-sm font-bold text-zinc-500">Сортировка:</span>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-2xl border border-zinc-200 bg-white px-5 py-3 pr-11 text-sm font-bold text-zinc-900 shadow-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer hover:border-zinc-300 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2371717A%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_16px_center] bg-no-repeat"
      >
        <option value="Сначала новые">Сначала новые</option>
        <option value="Сначала дешевые">Сначала дешевые</option>
        <option value="Сначала дорогие">Сначала дорогие</option>
        <option value="Дешевле за сотку">Дешевле за сотку</option>
      </select>
    </div>
  );
}
