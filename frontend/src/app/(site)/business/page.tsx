import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Готовый бизнес — 6sotok.kz',
  description: 'Покупка и продажа готового бизнеса в Казахстане.',
};

export default function BusinessPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Hero */}
      <div className="max-w-2xl mb-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Новое направление</p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
          Готовый бизнес
        </h1>
        <p className="text-[17px] text-zinc-500 leading-relaxed">
          Покупка и продажа действующего бизнеса в Казахстане — кафе, магазины, производства, франшизы и многое другое.
        </p>
      </div>

      {/* Категории */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-16">
        {[
          { icon: '🍽️', label: 'Кафе и рестораны' },
          { icon: '🛒', label: 'Магазины' },
          { icon: '🏭', label: 'Производство' },
          { icon: '🏨', label: 'Гостиницы' },
          { icon: '💈', label: 'Салоны красоты' },
          { icon: '🔧', label: 'Автосервисы' },
          { icon: '🏋️', label: 'Фитнес и спорт' },
          { icon: '📦', label: 'Другое' },
        ].map(cat => (
          <div
            key={cat.label}
            className="bg-white rounded-2xl border border-zinc-100 p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-[14px] font-semibold text-zinc-800 leading-snug">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="bg-zinc-50 rounded-3xl p-10 text-center border border-zinc-100">
        <div className="w-14 h-14 bg-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Раздел в разработке</h2>
        <p className="text-[15px] text-zinc-500 max-w-md mx-auto mb-6">
          Мы готовим каталог готового бизнеса. Хотите первыми узнать о запуске или разместить своё объявление?
        </p>
        <Link
          href="/add-listing"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors duration-150"
        >
          Подать объявление
        </Link>
      </div>

    </div>
  );
}
