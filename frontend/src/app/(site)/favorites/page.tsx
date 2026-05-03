import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Избранное — 6sotok.kz',
};

export default function FavoritesPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-10">Избранное</h1>

        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-20 px-4 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <p className="text-[17px] font-semibold text-zinc-700 mb-2">Здесь пока пусто</p>
          <p className="text-[14px] text-zinc-400 max-w-sm leading-relaxed mb-7">
            Нажмите на сердечко на карточке объявления, чтобы сохранить его в избранное.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors duration-150 text-[14px]"
          >
            Смотреть участки
          </Link>
        </div>

      </div>
    </div>
  );
}
