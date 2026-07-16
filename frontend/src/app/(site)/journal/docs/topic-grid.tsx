'use client';

/* Тема «Документы» — шапка темы с сортировкой + сетка статей (уровень 2) */

import { useMemo, useState } from 'react';
import { JLink } from '../journal-ui';
import { TOPIC_ARTICLES } from '../journal-data';

type Sort = 'popular' | 'date';

export function TopicSections() {
  const [sort, setSort] = useState<Sort>('popular');

  const list = useMemo(() => {
    const l = [...TOPIC_ARTICLES];
    if (sort === 'popular') l.sort((a, b) => b.views - a.views);
    else l.sort((a, b) => +new Date(b.sortDate) - +new Date(a.sortDate));
    return l;
  }, [sort]);

  return (
    <>
      {/* ============================== TOPIC HEADER ============================== */}
      <header className="bg-white border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 pt-12 sm:pt-14 pb-10 sm:pb-12">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-xl">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h6l4 4v14H8z" /><path d="M14 3v4h4" /><path d="M10 12h4M10 16h4" /></svg>
              </div>
              <h1 className="font-black tracking-tightest text-[32px] sm:text-[42px] leading-[1.02] text-ink-900">Документы</h1>
              <p className="mt-3 text-[15.5px] sm:text-[16.5px] text-ink-600 leading-relaxed">Госакт, кадастр, доверенности и справки — всё, что нужно проверить и оформить при покупке, продаже и переводе земли.</p>
            </div>
            <div className="mono text-[12px] text-ink-400 uppercase tracking-[0.08em] pt-1">{TOPIC_ARTICLES.length} статей</div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <div className="seg-sort">
              <button className={sort === 'popular' ? 'on' : ''} onClick={() => setSort('popular')}>По популярности</button>
              <button className={sort === 'date' ? 'on' : ''} onClick={() => setSort('date')}>По дате</button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================== ARTICLES GRID ============================== */}
      <section className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map(a => (
              <JLink key={a.title} href={a.slug ? `/journal/docs/${a.slug}` : '#'} className="j-tile j-card overflow-hidden flex flex-col hover:border-brand-300 transition">
                <div className={`${a.tone} aspect-[16/9] relative`}>
                  <span className="absolute bottom-3 left-3 mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">{a.cat}</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="font-bold text-[17px] text-ink-900 tracking-tight leading-snug">{a.title}</div>
                  <p className="mt-2 text-[13.5px] text-ink-500 leading-snug flex-1">{a.desc}</p>
                  <div className="mt-4 pt-4 border-t border-paper-3 flex flex-wrap gap-x-3 gap-y-1 mono text-[11px] text-ink-400 uppercase tracking-[0.05em]">
                    <span>{a.time}</span><span>·</span><span>{a.date}</span><span>·</span><span className="num">{a.views.toLocaleString('ru-RU')} просм.</span>
                  </div>
                </div>
              </JLink>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
