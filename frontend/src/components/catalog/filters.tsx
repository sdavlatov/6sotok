'use client';

interface CatalogFiltersProps {
  // Existing
  selectedTypes: string[];
  onChangeTypes: (types: string[]) => void;
  priceFrom: string;
  setPriceFrom: (v: string) => void;
  priceTo: string;
  setPriceTo: (v: string) => void;
  
  // New
  selectedPurposes: string[];
  onChangePurposes: (p: string[]) => void;
  isPledged: boolean;
  setIsPledged: (v: boolean) => void;
  isOnRedLine: boolean;
  setIsOnRedLine: (v: boolean) => void;
  hasElectricity: boolean;
  setHasElectricity: (v: boolean) => void;
  hasGas: boolean;
  setHasGas: (v: boolean) => void;
  hasWater: boolean;
  setHasWater: (v: boolean) => void;
  hasRoadAccess: boolean;
  setHasRoadAccess: (v: boolean) => void;
}

export function CatalogFilters({ 
  selectedTypes, onChangeTypes, 
  priceFrom, setPriceFrom, priceTo, setPriceTo,
  selectedPurposes, onChangePurposes,
  isPledged, setIsPledged,
  isOnRedLine, setIsOnRedLine,
  hasElectricity, setHasElectricity,
  hasGas, setHasGas,
  hasWater, setHasWater,
  hasRoadAccess, setHasRoadAccess
}: CatalogFiltersProps) {
  
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onChangeTypes(selectedTypes.filter(t => t !== type));
    } else {
      onChangeTypes([...selectedTypes, type]);
    }
  };

  const handlePurposeToggle = (purpose: string) => {
    if (selectedPurposes.includes(purpose)) {
      onChangePurposes(selectedPurposes.filter(p => p !== purpose));
    } else {
      onChangePurposes([...selectedPurposes, purpose]);
    }
  };

  const clearFilters = () => {
    onChangeTypes([]);
    setPriceFrom('');
    setPriceTo('');
    onChangePurposes([]);
    setIsPledged(false);
    setIsOnRedLine(false);
    setHasElectricity(false);
    setHasGas(false);
    setHasWater(false);
    setHasRoadAccess(false);
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-28">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-black text-zinc-900">Фильтры</h2>
        <button onClick={clearFilters} className="text-sm font-bold text-primary hover:text-primary-light transition-colors">Сбросить</button>
      </div>

      <div className="space-y-8">
        
        {/* Целевое назначение (Purpose) */}
        <div>
          <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-zinc-400">Целевое назначение</h3>
          <div className="flex flex-col gap-3.5">
            {['ИЖС', 'ЛПХ', 'Коммерция', 'Сельхоз'].map(purpose => (
              <label key={purpose} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectedPurposes.includes(purpose)}
                  onChange={() => handlePurposeToggle(purpose)}
                  className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary focus:ring-primary transition-colors cursor-pointer" 
                />
                <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900">{purpose}</span>
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

        {/* Юридические параметры */}
        <div>
          <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-zinc-400">Юридически</h3>
          <div className="flex flex-col gap-3.5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isPledged}
                onChange={(e) => setIsPledged(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary focus:ring-primary transition-colors cursor-pointer" 
              />
              <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900">Без залога</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isOnRedLine}
                onChange={(e) => setIsOnRedLine(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary focus:ring-primary transition-colors cursor-pointer" 
              />
              <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900">Вне красных линий</span>
            </label>
          </div>
        </div>

        {/* Коммуникации */}
        <div>
          <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-zinc-400">Коммуникации</h3>
          <div className="flex flex-col gap-3.5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={hasElectricity} onChange={(e) => setHasElectricity(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
              <span className="text-sm font-semibold text-zinc-700">Свет заведен</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={hasGas} onChange={(e) => setHasGas(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
              <span className="text-sm font-semibold text-zinc-700">Газ заведен</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={hasWater} onChange={(e) => setHasWater(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
              <span className="text-sm font-semibold text-zinc-700">Вода есть</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={hasRoadAccess} onChange={(e) => setHasRoadAccess(e.target.checked)} className="h-5 w-5 rounded border-zinc-300 text-primary accent-primary" />
              <span className="text-sm font-semibold text-zinc-700">Асфальтированный подъезд</span>
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
