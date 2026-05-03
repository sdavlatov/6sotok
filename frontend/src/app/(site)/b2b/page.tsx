import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Для агентств и риелторов — 6sotok.kz',
  description: 'Размещайте объявления об участках и готовом бизнесе на 6sotok.kz. Инструменты для агентств недвижимости и бизнес-брокеров.',
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    title: 'Неограниченные объявления',
    desc: 'Размещайте любое количество участков и объектов бизнеса без доплат за каждое.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Профиль агентства',
    desc: 'Страница вашего агентства с логотипом, описанием и всеми активными объявлениями.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
    title: 'Аналитика и просмотры',
    desc: 'Статистика по каждому объявлению: сколько просмотров, звонков и переходов в WhatsApp.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Высокая видимость',
    desc: 'Объявления агентств выделены в каталоге и продвигаются выше в результатах поиска.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>
      </svg>
    ),
    title: 'Участки и бизнес',
    desc: 'Продавайте земельные участки и готовый бизнес в одном аккаунте — два направления, один кабинет.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: 'Верификация агентства',
    desc: 'Значок проверенного агентства повышает доверие покупателей и конверсию в звонок.',
  },
];

const steps = [
  { n: '01', title: 'Зарегистрируйтесь', desc: 'Создайте аккаунт агентства — это бесплатно и занимает 2 минуты.' },
  { n: '02', title: 'Заполните профиль', desc: 'Добавьте логотип, описание, контакты. Покупатели увидят вашу страницу.' },
  { n: '03', title: 'Размещайте объявления', desc: 'Участки, готовый бизнес — всё в одном кабинете без лишних шагов.' },
  { n: '04', title: 'Получайте клиентов', desc: 'Звонки и WhatsApp-запросы напрямую от заинтересованных покупателей.' },
];

export default function B2BPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #fff 60%)', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary-soft border border-primary/15 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[12px] font-semibold text-primary">Для агентств и риелторов</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-5 leading-[1.1]">
              Продавайте больше<br />на 6sotok.kz
            </h1>
            <p className="text-[17px] text-zinc-500 leading-relaxed mb-8 max-w-xl">
              Платформа для агентств недвижимости и бизнес-брокеров. Размещайте участки и готовый бизнес — получайте реальных покупателей из Казахстана.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/add-listing"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-primary-hover transition-colors duration-150 text-[15px]"
              >
                Начать бесплатно
              </Link>
              <a
                href="https://wa.me/77000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-semibold px-7 py-3.5 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-colors duration-150 text-[15px]"
              >
                Написать нам
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Кому подходит */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-6">Кому подходит</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Агентства недвижимости',
              desc: 'Продаёте участки под ИЖС, дачи, коммерческую землю от нескольких собственников.',
              tags: ['Участки', 'ИЖС', 'Дачи'],
            },
            {
              title: 'Бизнес-брокеры',
              desc: 'Помогаете купить или продать готовый бизнес — кафе, магазины, производства.',
              tags: ['Готовый бизнес', 'Франшизы'],
            },
            {
              title: 'Риелторы',
              desc: 'Работаете как частный специалист, ведёте несколько объектов одновременно.',
              tags: ['Частный риелтор'],
            },
          ].map(card => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">{card.title}</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed mb-4">{card.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map(t => (
                  <span key={t} className="text-[11px] font-medium bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Возможности */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Возможности</p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-10">Всё что нужно для работы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6"
              style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="w-10 h-10 bg-primary-soft rounded-xl flex items-center justify-center text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900 mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Как начать */}
      <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Как начать</p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-10">Четыре шага до первого клиента</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(s => (
              <div key={s.n}>
                <span className="text-[36px] font-black text-zinc-100 leading-none block mb-3">{s.n}</span>
                <h3 className="text-[15px] font-semibold text-zinc-900 mb-1.5">{s.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="rounded-3xl px-8 py-12 md:px-14 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
          style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid rgba(6,111,54,0.15)' }}
        >
          <div className="max-w-lg">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
              Готовы начать?
            </h2>
            <p className="text-[15px] text-zinc-600 leading-relaxed mb-5">
              Регистрация бесплатна. Первое объявление — прямо сейчас.
            </p>
            <ul className="space-y-2">
              {['Без скрытых платежей', 'Поддержка при настройке', 'Участки и бизнес в одном кабинете'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-[14px] text-zinc-700">
                  <CheckIcon /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/add-listing"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-hover transition-colors duration-150 text-[15px] whitespace-nowrap"
            >
              Зарегистрировать агентство
            </Link>
            <a
              href="mailto:info@6sotok.kz"
              className="inline-flex items-center justify-center text-[14px] font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Есть вопросы? Напишите нам →
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
