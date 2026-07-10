'use client';

/* =========================================================================
   Глобальный контекст языка + валюты + курса $→₸.
   Единый источник истины: хедер/футер и все цены на сайте читают отсюда.
   Курс тянется из НБ РК (с авто-резервом), кешируется 6ч в localStorage.
   ========================================================================= */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type Lang = 'ru' | 'kz' | 'en';
export type Cur = 'kzt' | 'usd';
export type Fx = { usdKzt: number; t: number; src: string };

const LS_LANG = '6sotok:lang';
const LS_CUR = '6sotok:currency';
const LS_FX = '6sotok:fx';

async function loadRate(): Promise<Fx> {
  let cached: Fx | null = null;
  try { cached = JSON.parse(localStorage.getItem(LS_FX) || 'null'); } catch {}
  if (cached && Date.now() - cached.t < 6 * 3600 * 1000) return cached;
  // 1) Нацбанк РК
  try {
    const d = new Date();
    const fdate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const r = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${fdate}`, { mode: 'cors' });
    if (r.ok) {
      const doc = new DOMParser().parseFromString(await r.text(), 'text/xml');
      for (const it of Array.from(doc.querySelectorAll('item'))) {
        if ((it.querySelector('title')?.textContent || '').trim().toUpperCase() === 'USD') {
          const v = parseFloat((it.querySelector('description')?.textContent || '').replace(',', '.'));
          if (v) { const o: Fx = { usdKzt: v, t: Date.now(), src: 'nbk' }; localStorage.setItem(LS_FX, JSON.stringify(o)); return o; }
        }
      }
    }
  } catch {}
  // 2) авто-резерв (CORS-friendly)
  try {
    const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
    const kzt = j && j.rates && j.rates.KZT;
    if (kzt) { const o: Fx = { usdKzt: Math.round(kzt * 100) / 100, t: Date.now(), src: 'auto' }; localStorage.setItem(LS_FX, JSON.stringify(o)); return o; }
  } catch {}
  return cached || { usdKzt: 525, t: Date.now(), src: 'fallback' };
}

type Ctx = {
  lang: Lang;
  cur: Cur;
  fx: Fx | null;
  setLang: (l: Lang) => void;
  setCur: (c: Cur) => void;
  /** Форматирует цену в тенге → строку в выбранной валюте. compact → «12,5 млн ₸». */
  format: (kzt: number | null | undefined, opts?: { compact?: boolean; perSotka?: boolean }) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');
  const [cur, setCurState] = useState<Cur>('kzt');
  const [fx, setFx] = useState<Fx | null>(null);

  useEffect(() => {
    const l = localStorage.getItem(LS_LANG) as Lang | null;
    if (l && (['ru', 'kz', 'en'] as string[]).includes(l)) setLangState(l);
    const c = localStorage.getItem(LS_CUR) as Cur | null;
    if (c && (['kzt', 'usd'] as string[]).includes(c)) setCurState(c);
    loadRate().then(setFx);
    // синхронизация между вкладками
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_LANG && e.newValue) setLangState(e.newValue as Lang);
      if (e.key === LS_CUR && e.newValue) setCurState(e.newValue as Cur);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLang = useCallback((l: Lang) => { setLangState(l); localStorage.setItem(LS_LANG, l); }, []);
  const setCur = useCallback((c: Cur) => { setCurState(c); localStorage.setItem(LS_CUR, c); }, []);

  const format = useCallback<Ctx['format']>((kzt, opts) => {
    if (kzt == null || Number.isNaN(kzt)) return '—';
    const compact = opts?.compact;
    if (cur === 'usd' && fx?.usdKzt) {
      const usd = kzt / fx.usdKzt;
      const val = Math.round(usd).toLocaleString('en-US');
      return `$ ${val}${opts?.perSotka ? ' / сотка' : ''}`;
    }
    if (compact && kzt >= 1_000_000) {
      const m = (kzt / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
      return `${m} млн ₸${opts?.perSotka ? ' / сотка' : ''}`;
    }
    return `${kzt.toLocaleString('ru-RU')} ₸${opts?.perSotka ? ' / сотка' : ''}`;
  }, [cur, fx]);

  const value = useMemo(() => ({ lang, cur, fx, setLang, setCur, format }), [lang, cur, fx, setLang, setCur, format]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const c = useContext(CurrencyContext);
  if (!c) throw new Error('useCurrency must be used within CurrencyProvider');
  return c;
}
