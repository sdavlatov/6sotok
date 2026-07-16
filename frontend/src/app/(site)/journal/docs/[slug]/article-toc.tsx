'use client';

/* Уровень 3: прогресс чтения + оглавление (TOC) со scrollspy — из journal-article.html */

import { useEffect, useRef, useState } from 'react';
import { ARTICLE_SECTIONS } from '../../journal-data';

/* полоса прогресса чтения */
export function ReadProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
      if (ref.current) ref.current.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={ref} className="journal-read-progress" />;
}

function useScrollSpy() {
  const [active, setActive] = useState('');
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    ARTICLE_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return active;
}

function TocLinks({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return (
    <>
      {ARTICLE_SECTIONS.map(s => (
        <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'active' : ''} onClick={onNavigate}>{s.label}</a>
      ))}
    </>
  );
}

/* десктопное оглавление (сайдбар) */
export function TocDesktop() {
  const active = useScrollSpy();
  return (
    <nav className="toc flex flex-col gap-0.5">
      <TocLinks active={active} />
    </nav>
  );
}

/* мобильное оглавление (аккордеон) */
export function TocMobile() {
  const active = useScrollSpy();
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="mtoc lg:hidden mb-8 j-card p-4">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="mono text-[11px] uppercase tracking-[0.12em] text-ink-500">Содержание</span>
        <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <nav className="toc mt-3 flex flex-col gap-0.5">
        <TocLinks active={active} onNavigate={() => ref.current?.removeAttribute('open')} />
      </nav>
    </details>
  );
}
