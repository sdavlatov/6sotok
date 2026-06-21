'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plus, Bookmark } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const LS_BOOKMARKS = '6sotok_bookmarks';

const NAV = [
  { label: 'Купить',     href: '/catalog',   match: '/catalog' },
  { label: 'Продать',    href: '/add-listing', match: '/add-listing' },
  { label: 'Бизнес',     href: '/business',  match: '/business', dot: true },
  { label: 'Аналитика',  href: '/analytics', match: '/analytics' },
  { label: 'Журнал',     href: '/blog',      match: '/blog' },
  { label: 'Агентство',  href: '/b2b',       match: '/b2b' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const read = () => {
      try { setBookmarkCount(JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? '[]').length); } catch {}
    };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('bookmarks-updated', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('bookmarks-updated', read); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex h-[52px] items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
            <img src="/logo-solid.svg" alt="" aria-hidden="true" className="h-7 w-auto" />
            <span className="text-[18px] font-black tracking-[-0.045em] leading-none text-[var(--ink-900)]">6sotok<span className="text-primary">.kz</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV.map(item => {
              const active = pathname?.startsWith(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-1.5 rounded-md text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {item.label}
                  {item.dot && (
                    <span className="absolute top-1 right-1.5 flex size-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Language */}
            <button className="hidden md:flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-2 py-1 rounded-md hover:bg-zinc-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              RU · KZT
            </button>

            {/* Favorites */}
            <Link
              href="/favorites"
              className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-50 relative"
            >
              <Bookmark className={`w-4 h-4 ${pathname?.startsWith('/favorites') ? 'fill-primary text-primary' : ''}`} />
              <span>Избранное</span>
              {bookmarkCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold">
                  {bookmarkCount}
                </span>
              )}
            </Link>

            {/* Login */}
            <Link
              href="/profile"
              className="hidden md:block text-[13.5px] font-medium text-zinc-700 hover:text-zinc-900 transition-colors px-3 py-1.5 rounded-md hover:bg-zinc-50"
            >
              {user ? user.name.split(' ')[0] : 'Войти'}
            </Link>

            {/* CTA */}
            <Link
              href="/add-listing"
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
              <span className="hidden sm:block">Разместить участок</span>
              <span className="sm:hidden">Разместить</span>
            </Link>

            {/* Burger */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors -mr-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-250 md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-[52px] border-b border-zinc-100 shrink-0">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
            <img src="/logo-solid.svg" alt="" aria-hidden="true" className="h-7 w-auto" />
            <span className="text-[18px] font-black tracking-[-0.045em] leading-none text-[var(--ink-900)]">6sotok<span className="text-primary">.kz</span></span>
          </Link>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col px-3 py-3 gap-0.5 flex-1 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname?.startsWith(item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`relative flex items-center px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                  active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {item.label}
                {item.dot && (
                  <span className="absolute top-2.5 right-3 flex size-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-8 pt-3 shrink-0 border-t border-zinc-100 space-y-2">
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-center w-full rounded-xl border border-zinc-200 px-6 py-3 text-[14px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {user ? user.name.split(' ')[0] : 'Войти'}
          </Link>
          <Link
            href="/add-listing"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 px-6 py-3.5 text-[14px] font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Разместить участок
          </Link>
        </div>
      </div>
    </>
  );
}
