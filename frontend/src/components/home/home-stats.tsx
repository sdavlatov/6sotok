interface Props {
  landCount: number;
  locationsCount: number;
  businessCount: number;
}

export function HomeStats({ landCount, locationsCount, businessCount }: Props) {
  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const STATS = [
    { value: fmt(landCount), label: 'Земельных участков', sub: 'в активных объявлениях' },
    { value: fmt(locationsCount), label: 'Регионов и городов', sub: 'по всему Казахстану' },
    { value: 'Бесплатно', label: 'Базовое размещение', sub: 'без скрытых комиссий' },
    { value: fmt(businessCount || 0), label: 'Готовых бизнесов', sub: 'с P&L и оборудованием' },
  ];

  return (
    <section className="border-t border-zinc-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1.5">Статистика</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            Маркетплейс, которому доверяют
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(({ value, label, sub }) => (
            <div key={label} className="bg-primary-soft rounded-2xl p-5 sm:p-6">
              <p className="text-2xl sm:text-3xl font-black text-primary tabular-nums mb-1.5">{value}</p>
              <p className="font-semibold text-zinc-800 text-[13px] sm:text-[14px] leading-snug">{label}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
