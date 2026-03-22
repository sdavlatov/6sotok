'use client';

interface CatalogFiltersProps {
  selectedTypes: string[];
  onChangeTypes: (types: string[]) => void;
  priceFrom: string;
  setPriceFrom: (v: string) => void;
  priceTo: string;
  setPriceTo: (v: string) => void;
}

export function CatalogFilters({ selectedTypes, onChangeTypes, priceFrom, setPriceFrom, priceTo, setPriceTo }: CatalogFiltersProps) {
  
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onChangeTypes(selectedTypes.filter(t => t !== type));
    } else {
      onChangeTypes([...selectedTypes, type]);
    }
  };

  const clearFilters = () => {
    onChangeTypes([]);
    setPriceFrom('');
    setPriceTo('');
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-black text-zinc-900">Фильтры</h2>
        <button onClick={clearFilters} className="text-sm font-bold text-primary hover:text-primary-light transition-colors">Сбросить</button>
      </div>

      <div className="space-y-8">
        {/* Тип участка */}
        <div>
          <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-zinc-400">Тип участка</h3>
          <div className="flex flex-col gap-3.5">
            {['ИЖС', 'Дача', 'Коммерция', 'Сельхоз'].map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                  className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary focus:ring-primary transition-colors cursor-pointer" 
                />
                <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Цена */}
        <div>
          <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-zinc-400">Цена, ₸</h3>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="От" 
              value={priceFrom}
              onChange={e => setPriceFrom(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary placeholder:font-medium" 
            />
            <span className="text-zinc-300 font-medium">-</span>
            <input 
              type="text" 
              placeholder="До" 
              value={priceTo}
              onChange={e => setPriceTo(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary placeholder:font-medium" 
            />
          </div>
        </div>

      </div>

    </div>
  );
}
