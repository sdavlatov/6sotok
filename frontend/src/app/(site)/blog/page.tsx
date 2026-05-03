import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Блог — 6sotok.kz',
  description: 'Советы по покупке земли и готового бизнеса в Казахстане.',
};

const posts = [
  {
    tag: 'Советы покупателям',
    title: 'На что смотреть при покупке участка ИЖС',
    desc: 'Список документов, которые нужно проверить перед сделкой. Как не купить участок с обременением.',
    date: '12 апреля 2025',
    mins: '5 мин',
  },
  {
    tag: 'Юридика',
    title: 'Государственный акт на землю: что это и зачем нужен',
    desc: 'Разбираем виды правоустанавливающих документов на землю в Казахстане и что они означают.',
    date: '3 апреля 2025',
    mins: '7 мин',
  },
  {
    tag: 'Рынок',
    title: 'Цены на землю в Алматинской области — весна 2025',
    desc: 'Анализ цен по направлениям: Капшагай, Талгар, Каскелен, Иле. Где дешевле и почему.',
    date: '28 марта 2025',
    mins: '4 мин',
  },
  {
    tag: 'Готовый бизнес',
    title: 'Как оценить стоимость готового бизнеса',
    desc: 'Основные методы оценки: по выручке, по EBITDA, по активам. Что проверить до подписания договора.',
    date: '20 марта 2025',
    mins: '8 мин',
  },
];

export default function BlogPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="max-w-xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Блог</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">Полезные статьи</h1>
          <p className="text-[16px] text-zinc-500 leading-relaxed">
            Советы по покупке земли и готового бизнеса, разбор документов, анализ рынка.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {posts.map(p => (
            <article
              key={p.title}
              className="bg-white rounded-2xl p-7 flex flex-col gap-3 cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
              style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <span className="text-[11px] font-semibold bg-primary-soft text-primary px-2.5 py-1 rounded-full self-start">
                {p.tag}
              </span>
              <h2 className="text-[17px] font-semibold text-zinc-900 leading-snug">{p.title}</h2>
              <p className="text-[14px] text-zinc-500 leading-relaxed flex-1">{p.desc}</p>
              <div className="flex items-center gap-3 text-[12px] text-zinc-400 pt-2 border-t border-zinc-50">
                <span>{p.date}</span>
                <span>·</span>
                <span>{p.mins} чтения</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[14px] text-zinc-400">Скоро добавим больше материалов</p>
        </div>

      </div>
    </div>
  );
}
