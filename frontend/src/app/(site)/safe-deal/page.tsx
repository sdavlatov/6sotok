import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Безопасная сделка — 6sotok.kz',
  description: 'Проверим документы на участок и сопроводим сделку до регистрации в ЦОН.',
};

const steps = [
  {
    n: '01',
    title: 'Заявка',
    desc: 'Вы выбираете участок и оставляете заявку на безопасную сделку. Мы связываемся в течение 2 часов.',
  },
  {
    n: '02',
    title: 'Проверка документов',
    desc: 'Юристы проверяют госакт, кадастр, наличие обременений и залогов в базах ЕНИС и ГБД НП.',
  },
  {
    n: '03',
    title: 'Подготовка договора',
    desc: 'Составляем договор купли-продажи с защитными условиями для покупателя.',
  },
  {
    n: '04',
    title: 'Сопровождение в ЦОН',
    desc: 'Присутствуем при подписании и сдаче документов на регистрацию перехода права собственности.',
  },
];

const guarantees = [
  'Проверка госакта на подлинность',
  'Отсутствие залогов и арестов',
  'Отсутствие обременений и сервитутов',
  'Проверка на красную линию',
  'Подтверждение права собственности',
  'Юридически чистый договор',
];

export default function SafeDealPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12.5px] text-zinc-400 mb-10">
          <Link href="/" className="hover:text-zinc-600 transition-colors">Главная</Link>
          <span>/</span>
          <span className="text-zinc-700 font-medium">Безопасная сделка</span>
        </nav>

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-soft text-primary text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full mb-5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            Юридическая защита
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Безопасная сделка
          </h1>
          <p className="text-[16px] text-zinc-500 leading-relaxed max-w-xl">
            Проверяем документы на участок и сопровождаем сделку от первого звонка до получения свидетельства о праве собственности.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 mb-6">Как это работает</p>
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5">
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black"
                  style={{ background: '#f0fdf4', color: '#066F36' }}
                >
                  {s.n}
                </div>
                <div className="pt-2">
                  <p className="font-semibold text-zinc-900 text-[15px] mb-1">{s.title}</p>
                  <p className="text-[14px] text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div className="rounded-2xl p-6 mb-10" style={{ background: '#f0fdf4', border: '1px solid rgba(6,111,54,0.12)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-5" style={{ color: '#066F36' }}>Что мы проверяем</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guarantees.map((g) => (
              <div key={g} className="flex items-start gap-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                <span className="text-[13.5px] text-zinc-700 font-medium">{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalog"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-[14px] text-white transition-colors"
            style={{ background: '#066F36' }}
          >
            Найти участок
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center h-12 rounded-xl font-semibold text-[14px] text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            На главную
          </Link>
        </div>

      </div>
    </div>
  );
}
