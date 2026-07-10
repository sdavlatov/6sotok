import { Map, Zap, FileCheck, Layers } from 'lucide-react';

const FEATURES = [
  {
    icon: Map,
    title: 'Границы и форма участка',
    body: 'Продавец прикладывает схему: реальная конфигурация, фронтальная ширина, глубина — не только точка на карте.',
    badge: 'Уникально',
    wide: true,
  },
  {
    icon: Zap,
    title: 'Готов к стройке',
    body: 'Свет, вода, дорога и госакт одновременно — система ставит статус автоматически.',
    badge: 'Автоматически',
    wide: false,
  },
  {
    icon: FileCheck,
    title: 'Юридический статус',
    body: 'Кадастр, тип собственности, обременения, госакт — всё прозрачно со слов продавца.',
    badge: 'Прозрачно',
    wide: false,
  },
  {
    icon: Layers,
    title: 'Только земля',
    body: '6sotok — специализированная площадка. Никакой вторички. Только участки и готовый бизнес с землёй.',
    badge: 'Специализация',
    wide: true,
  },
];

export function ProductFeatures() {
  return (
    <section className="bg-zinc-50 border-t border-zinc-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">Наш продукт</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-zinc-900">
            Земельная аналитика,<br className="hidden sm:block" />которой нет у конкурентов
          </h2>
          <p className="mt-4 text-[15px] text-zinc-500 leading-relaxed max-w-lg mx-auto">
            Мы специализируемся только на земле. Поэтому здесь есть то, чего не найти на агрегаторах.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, title, body, badge, wide }) => (
            <div
              key={title}
              className={`bg-white rounded-2xl border border-zinc-100 p-5 sm:p-7 ${wide ? 'col-span-2' : ''}`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="bg-primary-soft p-3 rounded-2xl text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary-soft px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 text-[15px] sm:text-[17px] mb-2 leading-snug">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
