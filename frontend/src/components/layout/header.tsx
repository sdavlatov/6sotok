import Link from 'next/link';
import { Container } from './container';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="Главная 6sotok">
            <img src="/logo.svg" alt="6sotok" className="h-14 md:h-[60px] w-auto object-contain" />
            <span className="hidden sm:block text-2xl font-black tracking-tight text-zinc-900 mt-2">
              6sotok<span className="text-primary">.kz</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/catalog" className="text-sm font-semibold text-zinc-600 transition-colors hover:text-primary">
              Каталог участков
            </Link>
            <Link href="#" className="text-sm font-semibold text-zinc-600 transition-colors hover:text-primary">
              Карта
            </Link>
            <Link href="#" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:text-primary">
              Агентствам
              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">Pro</span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <Link href="/profile" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
              Войти
            </Link>
            <Link
              href="/add-listing"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-light hover:shadow-lg active:scale-95"
            >
              + Объявление
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
