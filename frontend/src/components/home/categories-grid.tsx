import Link from 'next/link';
import { Home, Building2, Leaf, TreePine, Wheat, Store, Tractor, Factory } from 'lucide-react';

const CATS = [
  { value: 'ИЖС',       label: 'ИЖС',       icon: Home,      desc: 'Под жилой дом' },
  { value: 'МЖС',       label: 'МЖС',       icon: Building2, desc: 'Многоквартирное' },
  { value: 'ЛПХ',       label: 'ЛПХ',       icon: Leaf,      desc: 'Личное хозяйство' },
  { value: 'Дача',      label: 'Дача',      icon: TreePine,  desc: 'Садовый участок' },
  { value: 'Сельхоз',  label: 'Сельхоз',  icon: Wheat,     desc: 'Фермерство' },
  { value: 'Коммерция', label: 'Коммерция', icon: Store,     desc: 'Под бизнес' },
  { value: 'КХ',        label: 'КХ',        icon: Tractor,   desc: 'Крестьянское хозяйство' },
  { value: 'Промбаза',  label: 'Промбаза',  icon: Factory,   desc: 'Производство' },
];

interface Props {
  countByType: Record<string, number>;
}

export function CategoriesGrid({ countByType }: Props) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-1.5">Категории</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Выберите тип участка</h2>
        </div>
        <Link href="/catalog" className="text-sm font-medium text-primary hover:underline shrink-0">
          Все объявления →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CATS.map(({ value, label, icon: Icon, desc }) => {
          const count = countByType[value] ?? 0;
          return (
            <Link
              key={value}
              href={`/catalog?type=${encodeURIComponent(value)}`}
              className="group bg-white rounded-2xl border border-zinc-100 p-4 sm:p-5 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-primary-soft p-2.5 rounded-xl text-primary">
                  <Icon className="size-4 sm:size-5" />
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full tabular-nums">
                    {count}
                  </span>
                )}
              </div>
              <p className="font-bold text-zinc-900 text-[14px] sm:text-[15px]">{label}</p>
              <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">{desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
