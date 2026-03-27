'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './container';
import { Heart, User, Plus, Menu, X } from 'lucide-react';
import { pushDataLayer } from '@/lib/analytics';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const openMenu = () => {
    setIsMenuOpen(true);
    pushDataLayer('mobile_menu_open');
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <Container>
        <div className="flex h-14 sm:h-16 md:h-20 items-center gap-2">

          {/* Левая: shrink-0 — burger (мобайл) или лого (десктоп) */}
          <div className="shrink-0 flex items-center">
            <button
              onClick={openMenu}
              className="md:hidden text-zinc-900 p-2 -ml-2 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Открыть меню"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="hidden md:flex items-center gap-2.5 transition-opacity hover:opacity-80" aria-label="Главная 6sotok">
              <img src="/logo.svg" alt="6sotok" className="h-11 w-auto object-contain" />
              <span className="text-xl lg:text-2xl font-black tracking-tight text-zinc-900 leading-none">
                6sotok<span className="text-primary">.kz</span>
              </span>
            </Link>
          </div>

          {/* Центр: flex-1, лого по центру (мобайл) / навигация (десктоп) */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/" className="md:hidden flex items-center gap-1.5 transition-opacity hover:opacity-80" aria-label="Главная 6sotok">
              <img src="/logo.svg" alt="6sotok" className="h-8 w-auto object-contain" />
              <span className="text-[16px] font-black tracking-tight text-zinc-900 leading-none whitespace-nowrap">
                6sotok<span className="text-primary">.kz</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-10">
              <Link href="/catalog" className="text-[15px] font-bold text-zinc-700 transition-colors hover:text-primary whitespace-nowrap">
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
          </div>

          {/* Правая: shrink-0 — кнопка всегда полного размера */}
          <div className="shrink-0 flex items-center gap-2 md:gap-5">
            <div className="hidden md:flex items-center gap-4">
              <Link href="/favorites" className="flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors group" aria-label="Избранное">
                <Heart className="w-5 h-5 group-hover:fill-red-50" strokeWidth={2.5} />
              </Link>
              <div className="w-px h-6 bg-zinc-200" />
              <Link href="/profile" className="flex items-center gap-2 text-[14px] font-bold text-zinc-700 hover:text-primary transition-colors">
                <User className="w-5 h-5" strokeWidth={2.5} />
                Войти
              </Link>
            </div>
            <Link
              href="/add-listing"
              className="flex items-center gap-1 md:gap-1.5 rounded-xl bg-primary px-3 py-2.5 md:px-6 md:py-3 text-[12px] md:text-[14px] font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover active:scale-95 whitespace-nowrap md:uppercase md:tracking-wide"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" strokeWidth={3} />
              Подать объявление
            </Link>
          </div>

        </div>
      </Container>
    </header>

    {/* Overlay */}
    <div
      onClick={() => setIsMenuOpen(false)}
      className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    />

    {/* Mobile Drawer */}
    <div
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 md:hidden ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 h-14 sm:h-16 border-b border-zinc-100 shrink-0">
        <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
          <img src="/logo.svg" alt="6sotok" className="h-8 w-auto object-contain" />
          <span className="text-lg font-black tracking-tight text-zinc-900">
            6sotok<span className="text-primary">.kz</span>
          </span>
        </Link>
        <button
          onClick={() => setIsMenuOpen(false)}
          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          aria-label="Закрыть меню"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col px-3 py-4 gap-1 flex-1 overflow-y-auto">
        <Link
          href="/catalog"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${pathname === '/catalog' ? 'bg-primary-soft/40 text-primary' : 'text-zinc-700 hover:bg-zinc-50 hover:text-primary'}`}
        >
          Купить участок
        </Link>
        <Link
          href="/map"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${pathname === '/map' ? 'bg-primary-soft/40 text-primary' : 'text-zinc-700 hover:bg-zinc-50 hover:text-primary'}`}
        >
          Карта
        </Link>
        <Link
          href="/b2b"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${pathname === '/b2b' ? 'bg-primary-soft/40 text-primary' : 'text-zinc-700 hover:bg-zinc-50 hover:text-primary'}`}
        >
          Агентствам
          <span className="h-2 w-2 rounded-full bg-accent-purple" />
        </Link>

        <div className="my-2 border-t border-zinc-100" />

        <Link
          href="/favorites"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${pathname === '/favorites' ? 'bg-primary-soft/40 text-primary' : 'text-zinc-700 hover:bg-zinc-50 hover:text-primary'}`}
        >
          <Heart className="w-5 h-5" strokeWidth={2.5} />
          Избранное
        </Link>
        <Link
          href="/profile"
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${pathname === '/profile' ? 'bg-primary-soft/40 text-primary' : 'text-zinc-700 hover:bg-zinc-50 hover:text-primary'}`}
        >
          <User className="w-5 h-5" strokeWidth={2.5} />
          Войти
        </Link>
      </nav>

      {/* Drawer CTA */}
      <div className="px-4 pb-8 pt-3 shrink-0 border-t border-zinc-100">
        <Link
          href="/add-listing"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-6 py-4 text-[14px] font-black uppercase tracking-wide text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          Подать объявление
        </Link>
      </div>
    </div>
    </>
  );
}
