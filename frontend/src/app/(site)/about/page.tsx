import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'О проекте — 6sotok.kz',
  description: '6sotok.kz — маркетплейс земли и готового бизнеса в Казахстане.',
};

const stats = [
  { n: '500+', label: 'Активных объявлений' },
  { n: '12', label: 'Регионов Казахстана' },
  { n: '2024', label: 'Год основания' },
  { n: '100%', label: 'Прямые контакты' },
];

const values = [
  {
    title: 'Честность',
    desc: 'Только реальные объявления от проверенных продавцов. Без накруток цен и скрытых комиссий.',
  },
  {
    title: 'Прозрачность',
    desc: 'Покупатель видит полную информацию об участке: кадастр, юридику, коммуникации.',
  },
  {
    title: 'Прямой контакт',
    desc: 'Вы связываетесь напрямую с продавцом — без посредников и лишних звонков.',
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #fff 60%)', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-4">О нас</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-5 leading-[1.1]">
              Мы делаем рынок земли<br />понятным
            </h1>
            <p className="text-[17px] text-zinc-500 leading-relaxed">
              6sotok.kz — специализированный маркетплейс для покупки и продажи земельных участков и готового бизнеса в Казахстане. Наша миссия — сделать сделки с землёй простыми, честными и безопасными.
            </p>
          </div>
        </div>
      </div>

      {/* Цифры */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.n} className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[40px] font-bold tracking-tight text-zinc-900 leading-none mb-2">{s.n}</p>
              <p className="text-[13px] text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* История */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">История</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-5">Почему мы это создали</h2>
            <div className="space-y-4 text-[15px] text-zinc-500 leading-relaxed">
              <p>
                Рынок земли в Казахстане долгое время оставался непрозрачным: объявления разбросаны по разным платформам, цены непонятны, а найти участок с нужными характеристиками — отдельная задача.
              </p>
              <p>
                Мы создали 6sotok.kz чтобы изменить это. Специализированная платформа с понятными фильтрами, реальными ценами за сотку и прямым выходом на продавца.
              </p>
              <p>
                В 2025 году мы расширились — добавили раздел готового бизнеса. Потому что часто те, кто ищет участок под коммерцию, одновременно рассматривают покупку действующего бизнеса.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Наши ценности</p>
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 className="text-[15px] font-semibold text-zinc-900 mb-1.5">{v.title}</h3>
                <p className="text-[13px] text-zinc-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6" style={{ background: '#f0fdf4', border: '1px solid rgba(6,111,54,0.15)' }}>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Есть вопросы?</h2>
            <p className="text-[14px] text-zinc-500">Напишите нам — ответим в течение дня.</p>
          </div>
          <Link href="/contacts" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors duration-150 text-[14px] whitespace-nowrap shrink-0">
            Связаться
          </Link>
        </div>
      </div>

    </div>
  );
}
