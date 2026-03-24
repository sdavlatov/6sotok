import Link from 'next/link';
import { Container } from './container';
import { Heart, User, Plus, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <Container>
        <div className="flex h-16 md:h-20 items-center justify-between">
          
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-3">
            <button className="md:hidden text-zinc-900 p-1 -ml-1 hover:bg-zinc-100 rounded-lg transition-colors">
               <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="Главная 6sotok">
              <img src="/logo.svg" alt="6sotok" className="h-10 md:h-12 w-auto object-contain" />
              <span className="hidden xl:block text-2xl font-black tracking-tight text-zinc-900 mt-1">
                6sotok<span className="text-primary">.kz</span>
              </span>
            </Link>
          </div>

          {/* Center: Marketplace Routes */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-10">
            <Link href="/catalog" className="text-[15px] font-bold text-zinc-700 transition-colors hover:text-primary">
              Купить участок
            </Link>
            <Link href="/map" className="text-[15px] font-bold text-zinc-700 transition-colors hover:text-primary">
              Карта
            </Link>
            <Link href="/b2b" className="relative text-[15px] font-bold text-zinc-700 transition-colors hover:text-primary">
              Агентствам
              <span className="absolute -top-2 -right-3 flex h-2 w-2 rounded-full bg-accent-purple" />
            </Link>
          </nav>

          {/* Right: Actions & CTA */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-4">
               <Link href="/favorites" className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors group" aria-label="Избранное">
                 <Heart className="w-5 h-5 group-hover:fill-red-50" strokeWidth={2.5} />
               </Link>
               <div className="w-px h-6 bg-zinc-200" />
               <Link href="/profile" className="flex items-center gap-2 text-[14px] font-bold text-zinc-700 hover:text-primary transition-colors">
                 <User className="w-5 h-5" strokeWidth={2.5} />
                 Войти
               </Link>
            </div>
            
            {/* Main CTA */}
            <Link
              href="/add-listing"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 sm:px-6 sm:py-3 text-[13px] sm:text-[14px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
              <span className="hidden sm:inline">Подать объявление</span>
            </Link>
          </div>
          
        </div>
      </Container>
    </header>
  );
}
