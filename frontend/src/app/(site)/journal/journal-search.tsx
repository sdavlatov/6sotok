'use client';

/* Живой поиск по статьям хаба (автокомплит из макета journal.html) */

import { useEffect, useRef, useState } from 'react';
import { JLink } from './journal-ui';
import { SEARCH_INDEX, type SearchItem } from './journal-data';

export function JournalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const v = query.trim().toLowerCase();
  const matches: SearchItem[] = v
    ? SEARCH_INDEX.filter(it => it.title.toLowerCase().includes(v)).slice(0, 6)
    : [];

  const highlight = (title: string) => {
    const idx = title.toLowerCase().indexOf(v);
    if (idx < 0) return title;
    return (
      <>
        {title.slice(0, idx)}
        <mark>{title.slice(idx, idx + v.length)}</mark>
        {title.slice(idx + v.length)}
      </>
    );
  };

  return (
    <div className="search-wrap mt-8 max-w-md" ref={wrapRef}>
      <div className="relative">
        <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-400" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          type="text"
          placeholder="Поиск статьи..."
          autoComplete="off"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          className="w-full h-14 pl-13 pr-5 rounded-2xl border border-paper-3 bg-paper-2/60 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
        />
      </div>
      {open && v && (
        <div className="search-drop">
          {matches.length === 0 ? (
            <div className="px-4 py-4 text-[13.5px] text-ink-400">Ничего не найдено</div>
          ) : matches.map((m, i) => (
            <JLink key={i} href={m.href}>
              <span className="mono text-[10px] uppercase text-ink-400 shrink-0">{m.cat}</span>
              <span>{highlight(m.title)}</span>
            </JLink>
          ))}
        </div>
      )}
    </div>
  );
}
