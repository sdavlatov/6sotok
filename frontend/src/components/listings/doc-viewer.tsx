'use client';

import { useState, useEffect } from 'react';

interface Doc {
  type: 'PDF' | 'JPG' | 'PNG';
  color: 'green' | 'zinc';
  name: string;
  meta: string;
  previewBg?: string;
}

const DOCS: Doc[] = [
  { type: 'PDF', color: 'green', name: 'Акт на право частной собственности', meta: 'Государственный акт · 14.03.2024 · 1.2 МБ' },
  { type: 'PDF', color: 'green', name: 'Межевой план + координаты',           meta: 'Подписан кадастровым инженером · 2.4 МБ' },
  { type: 'JPG', color: 'zinc',  name: 'Технические условия (свет, газ)',      meta: 'КЕГОК + Алматыгаз · 880 КБ' },
];

interface DocViewerProps {
  cadastralNumber?: string;
}

export function DocViewer({ cadastralNumber }: DocViewerProps) {
  const [open, setOpen] = useState<number | null>(null);

  const docs = DOCS.map((d, i) =>
    i === 0 && cadastralNumber
      ? { ...d, meta: `№ ${cadastralNumber} · 14.03.2024 · 1.2 МБ` }
      : d
  );

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen(i => i !== null ? (i + 1) % docs.length : null);
      if (e.key === 'ArrowLeft')  setOpen(i => i !== null ? (i - 1 + docs.length) % docs.length : null);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, docs.length]);

  const current = open !== null ? docs[open] : null;

  return (
    <>
      <div className="lp-docs grid sm:grid-cols-2 gap-3">
        {docs.map((doc, i) => (
          <button key={i} onClick={() => setOpen(i)}
            className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3 text-left hover:border-zinc-300 hover:shadow-sm transition-all duration-150 group">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-[12px] tracking-tight shrink-0 ${
              doc.color === 'green' ? 'bg-[#f0fdf4] text-primary' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {doc.type}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-zinc-900 truncate group-hover:text-primary transition-colors">{doc.name}</div>
              <div className="font-mono text-[11.5px] text-zinc-500 mt-0.5 truncate">{doc.meta}</div>
            </div>
            <div className="text-zinc-300 group-hover:text-primary transition-colors shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/>
              </svg>
            </div>
          </button>
        ))}

        {/* Проверка по ИИН */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center text-[20px] shrink-0">⚡</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-bold text-zinc-900">Проверка по ИИН — бесплатно</div>
            <div className="text-[11.5px] text-zinc-600">Покажем обременения, аресты, ипотеку</div>
          </div>
          <button className="px-2.5 h-7 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold shrink-0 hover:bg-primary transition-colors">
            Запустить
          </button>
        </div>
      </div>

      {/* Попап просмотра документа */}
      {current && open !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={() => setOpen(null)}>
          {/* Шапка */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <div>
              <div className="text-white font-semibold text-[15px]">{current.name}</div>
              <div className="font-mono text-[11px] text-white/50 mt-0.5">{current.meta}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[13px] font-mono">{open + 1} / {docs.length}</span>
              <button onClick={() => setOpen(null)}
                className="ml-2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Превью документа */}
          <div className="flex-1 flex items-center justify-center relative min-h-0 px-16" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              style={{ maxHeight: 'calc(100vh - 160px)' }}>
              {/* Заглушка документа */}
              <div className="bg-zinc-50 flex flex-col items-center justify-center py-20 gap-5 border-b border-zinc-100">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-[22px] tracking-tight ${
                  current.color === 'green' ? 'bg-[#f0fdf4] text-primary' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {current.type}
                </div>
                <div className="text-center">
                  <div className="font-bold text-zinc-900 text-[17px] mb-1">{current.name}</div>
                  <div className="font-mono text-[12px] text-zinc-500">{current.meta}</div>
                </div>
                <div className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-primary transition-colors cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Скачать документ
                </div>
              </div>
              <div className="px-6 py-4 flex items-center gap-3 bg-white">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[13px] font-medium text-zinc-700">Документ верифицирован платформой 6sotok.kz</span>
              </div>
            </div>

            {/* Стрелки навигации */}
            {docs.length > 1 && (
              <>
                <button onClick={() => setOpen(i => i !== null ? (i - 1 + docs.length) % docs.length : null)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button onClick={() => setOpen(i => i !== null ? (i + 1) % docs.length : null)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>

          {/* Превью-стрип */}
          <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3 justify-center" onClick={e => e.stopPropagation()}>
            {docs.map((d, i) => (
              <button key={i} onClick={() => setOpen(i)}
                className={`h-14 px-4 shrink-0 rounded-xl border-2 transition-all flex items-center gap-2 ${
                  i === open ? 'border-white bg-white/15' : 'border-transparent bg-white/5 opacity-50 hover:opacity-80'
                }`}>
                <span className="font-mono text-[11px] font-bold text-white">{d.type}</span>
                <span className="text-[11px] text-white/70 truncate max-w-[140px]">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
