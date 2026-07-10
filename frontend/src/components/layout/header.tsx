'use client';

/* =========================================================================
   6sotok.kz · <site-header> — единый хедер (десктоп + мобайл)
   Порт web-компонента (site-header.js) в React. Shadow DOM → scoped <style>.
   Логотип · меню · язык/валюта (авто-курс $→₸) · Избранное · Войти · зелёная
   «+ Разместить участок». Мобайл ≤1024: хедер раскрывается вниз в панель.
   ========================================================================= */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useCurrency, type Lang, type Cur } from '@/context/currency-context';

const LS_BOOKMARKS = '6sotok_bookmarks';

const I18N: Record<Lang, {
  label: string; full: string;
  nav: { buy: string; sell: string; business: string; analytics: string; agencies: string };
  saved: string; login: string; cta: string;
  menu: string; close: string; langTitle: string; curTitle: string;
  auto: string; source: string; navTitle: string;
}> = {
  ru: {
    label: 'Рус', full: 'Русский',
    nav: { buy: 'Купить', sell: 'Продать', business: 'Бизнес', analytics: 'Аналитика', agencies: 'Агентствам' },
    saved: 'Избранное', login: 'Войти', cta: 'Разместить участок',
    menu: 'Меню', close: 'Закрыть', langTitle: 'Язык', curTitle: 'Валюта',
    auto: 'обновляется автоматически', source: 'НБ РК', navTitle: 'Разделы',
  },
  kz: {
    label: 'Қаз', full: 'Қазақша',
    nav: { buy: 'Сатып алу', sell: 'Сату', business: 'Бизнес', analytics: 'Аналитика', agencies: 'Агенттіктерге' },
    saved: 'Таңдаулылар', login: 'Кіру', cta: 'Хабарландыру беру',
    menu: 'Мәзір', close: 'Жабу', langTitle: 'Тіл', curTitle: 'Валюта',
    auto: 'автоматты түрде жаңарады', source: 'ҚР ҰБ', navTitle: 'Бөлімдер',
  },
  en: {
    label: 'Eng', full: 'English',
    nav: { buy: 'Buy', sell: 'Sell', business: 'Business', analytics: 'Analytics', agencies: 'For agencies' },
    saved: 'Saved', login: 'Sign in', cta: 'List your plot',
    menu: 'Menu', close: 'Close', langTitle: 'Language', curTitle: 'Currency',
    auto: 'updates automatically', source: 'NBK', navTitle: 'Sections',
  },
};

const CUR: Record<Cur, { sym: string; code: string }> = {
  kzt: { sym: '₸', code: 'KZT' },
  usd: { sym: '$', code: 'USD' },
};

const NAV: { key: keyof typeof I18N.ru.nav; href: string; match: string }[] = [
  { key: 'buy', href: '/catalog', match: '/catalog' },
  { key: 'sell', href: '/add-listing', match: '/add-listing' },
  { key: 'business', href: '/business', match: '/business' },
  { key: 'analytics', href: '/analytics', match: '/analytics' },
  { key: 'agencies', href: '/b2b', match: '/b2b' },
];

const ic = {
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
};

const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const HEADER_CSS = `
.sixsotok-header{
  --green:#066F36; --green-2:#2CA64E; --ink:#021A0E;
  --ink-900:#0d1410; --ink-600:#4c5650; --ink-400:#7d8a82;
  --paper:#fff; --paper-2:#f5f6f3; --line:#e6e7e1;
  display:block; position:sticky; top:0; z-index:1000;
  font-family:var(--font-inter),'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif; -webkit-font-smoothing:antialiased;
  font-variant-numeric:normal;
}
.sixsotok-header *{box-sizing:border-box;}
.sixsotok-header a{text-decoration:none;color:inherit;}
.sixsotok-header button{font-family:inherit;cursor:pointer;border:0;background:none;}

.sixsotok-header .bar{
  position:relative; z-index:1102;
  background:rgba(255,255,255,.84);
  -webkit-backdrop-filter:blur(18px) saturate(150%); backdrop-filter:blur(18px) saturate(150%);
  border-bottom:1px solid var(--line);
  padding-top:env(safe-area-inset-top,0px);
  transition:border-radius .3s, box-shadow .3s;
}
.sixsotok-header .inner{ max-width:1440px; margin:0 auto; padding:0 24px; height:68px; display:flex; align-items:center; gap:26px; }

.sixsotok-header .logo{ display:flex; align-items:center; gap:9px; flex-shrink:0; }
.sixsotok-header .wm{ font-weight:900; letter-spacing:-.045em; font-size:20px; color:var(--ink-900); white-space:nowrap; }
.sixsotok-header .wm .tld{ color:var(--green); }

.sixsotok-header nav.main{ display:flex; align-items:center; gap:2px; }
.sixsotok-header nav.main a{ padding:8px 12px; border-radius:9px; font-size:14px; font-weight:500; color:var(--ink-600); letter-spacing:-.01em; transition:background .14s,color .14s; white-space:nowrap; }
.sixsotok-header nav.main a:hover{ background:var(--paper-2); color:var(--ink-900); }
.sixsotok-header nav.main a.on{ background:#eef3ee; color:var(--green); font-weight:600; }

.sixsotok-header .spacer{ flex:1; }
.sixsotok-header .right{ display:flex; align-items:center; gap:8px; }

.sixsotok-header .ghost{ height:38px; padding:0 12px; border-radius:10px; display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:500; color:var(--ink-600); transition:background .14s,color .14s; }
.sixsotok-header .ghost:hover{ background:var(--paper-2); color:var(--ink-900); }
.sixsotok-header .ghost svg{ width:17px; height:17px; }

.sixsotok-header .lc{ position:relative; }
.sixsotok-header .lc-btn{ height:38px; padding:0 10px; border-radius:10px; display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:var(--ink-900); border:1px solid var(--line); background:var(--paper); transition:border-color .14s; }
.sixsotok-header .lc-btn:hover{ border-color:#cfd2c9; }
.sixsotok-header .lc-btn .globe{ width:16px; height:16px; color:var(--ink-400); }
.sixsotok-header .lc-btn .globe svg{ width:16px; height:16px; display:block; }
.sixsotok-header .lc-btn .sep{ color:var(--line); font-weight:400; }
.sixsotok-header .lc-btn .cur{ color:var(--ink-900); }
.sixsotok-header .lc-btn .chev{ width:14px; height:14px; color:var(--ink-400); transition:transform .2s; }
.sixsotok-header .lc-btn .chev svg{ width:14px; height:14px; display:block; }
.sixsotok-header .lc[data-open] .lc-btn{ border-color:var(--green); }
.sixsotok-header .lc[data-open] .lc-btn .chev{ transform:rotate(180deg); }

.sixsotok-header .pop{ position:absolute; top:calc(100% + 8px); right:0; width:256px; background:var(--paper); border:1px solid var(--line); border-radius:16px; box-shadow:0 12px 40px -12px rgba(13,20,16,.28),0 2px 6px rgba(13,20,16,.06); padding:12px; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s,transform .16s; z-index:50; }
.sixsotok-header .lc[data-open] .pop{ opacity:1; transform:none; pointer-events:auto; }
.sixsotok-header .pop-t{ font:600 10px/1 var(--font-mono),'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin:6px 4px 8px; }

.sixsotok-header .seg{ display:flex; gap:4px; background:var(--paper-2); border:1px solid var(--line); border-radius:12px; padding:4px; }
.sixsotok-header .seg button{ flex:1; height:34px; border-radius:9px; font-size:13px; font-weight:600; color:var(--ink-600); display:inline-flex; align-items:center; justify-content:center; letter-spacing:-.01em; transition:color .14s, background .16s, box-shadow .16s; }
.sixsotok-header .seg button:hover{ color:var(--ink-900); }
.sixsotok-header .seg button.on{ background:var(--paper); color:var(--ink-900); box-shadow:0 1px 2px rgba(13,20,16,.14), 0 0 0 1px rgba(13,20,16,.03); }

.sixsotok-header .rate{ margin:12px 4px 2px; padding-top:11px; border-top:1px dashed var(--line); display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.sixsotok-header .rate .rl{ font:500 11px/1.3 var(--font-mono),'JetBrains Mono',monospace; color:var(--ink-400); text-transform:uppercase; letter-spacing:.08em; }
.sixsotok-header .rate .rv{ font:600 13px var(--font-mono),'JetBrains Mono',monospace; color:var(--ink-900); white-space:nowrap; }
.sixsotok-header .rate .rv b{ color:var(--green); }
.sixsotok-header .rsrc{ margin:6px 4px 2px; font:500 10px/1.3 var(--font-mono),'JetBrains Mono',monospace; color:var(--ink-400); }

.sixsotok-header .cta{ height:40px; padding:0 16px; border-radius:11px; display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600; color:#fff; letter-spacing:-.01em; white-space:nowrap; background:var(--green); box-shadow:0 1px 0 rgba(255,255,255,.15) inset,0 8px 20px -10px rgba(6,111,54,.7); transition:background .14s,transform .1s; }
.sixsotok-header .cta:hover{ background:var(--ink); }
.sixsotok-header .cta:active{ transform:translateY(1px); }
.sixsotok-header .cta svg{ width:16px; height:16px; }

.sixsotok-header .badge{ min-width:18px; height:18px; padding:0 5px; border-radius:99px; display:inline-flex; align-items:center; justify-content:center; background:var(--green); color:#fff; font-size:10.5px; font-weight:700; font-variant-numeric:tabular-nums; }

.sixsotok-header .menu-btn{ display:none; }
.sixsotok-header .m-panel{ display:none; }
.sixsotok-header .scrim{ position:fixed; inset:0; z-index:1101; background:rgba(2,26,14,.34); -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); opacity:0; pointer-events:none; transition:opacity .32s; }

@media (min-width:1025px) and (max-width:1180px){
  .sixsotok-header nav.main a{ padding:8px 10px; font-size:13.5px; }
  .sixsotok-header .ghost.login span{ display:none; }
  .sixsotok-header .ghost.login{ padding:0 9px; }
  .sixsotok-header .inner{ gap:18px; }
}

@media (max-width:1024px){
  .sixsotok-header nav.main,
  .sixsotok-header .spacer,
  .sixsotok-header .right{ display:none; }
  .sixsotok-header .inner{ height:60px; padding:0 16px; justify-content:space-between; }

  .sixsotok-header .menu-btn{
    display:inline-flex; align-items:center; gap:10px;
    height:42px; padding:0 6px 0 16px; border-radius:99px;
    border:1px solid var(--line); background:var(--paper);
    font-size:14px; font-weight:600; color:var(--ink-900);
  }
  .sixsotok-header .menu-btn .lines{ position:relative; width:30px; height:30px; border-radius:50%; background:var(--green); flex-shrink:0; }
  .sixsotok-header .menu-btn .lines i{ position:absolute; left:8px; right:8px; height:2px; border-radius:2px; background:#fff; transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .2s; }
  .sixsotok-header .menu-btn .lines i:nth-child(1){ top:11px; }
  .sixsotok-header .menu-btn .lines i:nth-child(2){ top:18px; }
  .sixsotok-header[data-menu] .menu-btn .lines i:nth-child(1){ transform:translateY(4px) rotate(45deg); }
  .sixsotok-header[data-menu] .menu-btn .lines i:nth-child(2){ transform:translateY(-3px) rotate(-45deg); }

  .sixsotok-header[data-menu] .bar{ border-radius:0 0 24px 24px; box-shadow:0 30px 70px -18px rgba(2,26,14,.5); }
  .sixsotok-header .m-panel{
    display:block; position:relative; max-height:0; overflow:hidden; opacity:0;
    background-color:#fff;
    background-image:
      linear-gradient(rgba(6,111,54,.045) 1px,transparent 1px),
      linear-gradient(90deg,rgba(6,111,54,.045) 1px,transparent 1px);
    background-size:32px 32px;
    transition:max-height .46s cubic-bezier(.16,1,.3,1),opacity .28s;
  }
  .sixsotok-header[data-menu] .m-panel{ max-height:calc(100dvh - 60px - env(safe-area-inset-top,0px)); opacity:1; overflow-y:auto; }
  .sixsotok-header .m-inner{ position:relative; z-index:1; max-width:520px; margin:0 auto; padding:6px 16px calc(18px + env(safe-area-inset-bottom,0px)); }

  .sixsotok-header .m-cap{ font:600 10px/1 var(--font-mono),'JetBrains Mono',monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-400); padding:10px 8px 8px; }
  .sixsotok-header .m-nav{ display:flex; flex-direction:column; gap:6px; }
  .sixsotok-header .m-nav a{
    display:grid; grid-template-columns:30px 1fr auto; align-items:center; gap:14px;
    padding:14px 14px; border-radius:14px; border:1px solid transparent;
    font-size:21px; font-weight:800; letter-spacing:-.03em; color:var(--ink-900);
    opacity:0; transform:translateY(10px); transition:background .16s, border-color .16s;
  }
  .sixsotok-header .m-nav a:active{ background:var(--paper-2); }
  .sixsotok-header .m-nav a .ix{ font:600 12px/1 var(--font-mono),'JetBrains Mono',monospace; color:var(--ink-400); }
  .sixsotok-header .m-nav a .ar{ color:var(--ink-400); font-size:18px; opacity:0; transform:translateX(-6px); transition:opacity .18s,transform .18s; }
  .sixsotok-header .m-nav a.on{ color:var(--green); background:#eef3ee; border-color:rgba(6,111,54,.16); }
  .sixsotok-header .m-nav a.on .ix{ color:#fff; background:var(--green); border-radius:7px; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 3px 8px -2px rgba(6,111,54,.5); }
  .sixsotok-header .m-nav a.on .ar{ color:var(--green); opacity:1; transform:none; }
  .sixsotok-header[data-menu] .m-nav a{ animation:sixHdrRise .5s cubic-bezier(.16,1,.3,1) forwards; }
  @keyframes sixHdrRise{ to{ opacity:1; transform:none; } }

  .sixsotok-header .m-lc{ margin-top:14px; padding:14px; background:var(--paper-2); border-radius:16px; }
  .sixsotok-header .m-lc .seg button{ height:44px; font-size:15px; }
  .sixsotok-header .m-sub{ font:600 10px/1 var(--font-mono),'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin:0 2px 8px; }
  .sixsotok-header .m-sub.mt{ margin-top:14px; }

  .sixsotok-header .m-actions{ margin-top:12px; display:flex; flex-direction:column; gap:8px; }
  .sixsotok-header .m-tiles{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .sixsotok-header .m-tile{
    display:flex; flex-direction:column; justify-content:space-between; gap:16px; min-height:96px;
    padding:14px 15px; background:var(--paper); border:1px solid var(--line); border-radius:16px;
    box-shadow:0 4px 14px -8px rgba(13,20,16,.18);
    font-size:15.5px; font-weight:700; color:var(--ink-900); transition:transform .12s, box-shadow .14s;
  }
  .sixsotok-header .m-tile:active{ transform:translateY(1px); box-shadow:0 1px 5px -3px rgba(13,20,16,.18); }
  .sixsotok-header .m-tile .ic{ width:40px; height:40px; border-radius:12px; background:#eef3ee; color:var(--green); display:grid; place-items:center; }
  .sixsotok-header .m-tile .ic svg{ width:21px; height:21px; }
  .sixsotok-header .m-tile .lbl{ display:flex; align-items:center; gap:8px; }
  .sixsotok-header .m-cta-full{ display:flex; align-items:center; justify-content:center; gap:9px; margin-top:8px; height:56px; border-radius:16px; background:var(--green); color:#fff; font-size:16.5px; font-weight:700; box-shadow:0 10px 24px -10px rgba(6,111,54,.7); }
  .sixsotok-header .m-cta-full svg{ width:20px; height:20px; }

  .sixsotok-header[data-menu] .scrim{ opacity:1; pointer-events:auto; }
}
@media (prefers-reduced-motion:reduce){
  .sixsotok-header .m-panel{ transition:none; }
  .sixsotok-header .m-nav a{ animation:none; opacity:1; transform:none; }
}
`;

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { lang, cur, fx, setLang, setCur } = useCurrency();
  const [lcOpen, setLcOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(0);
  const lcRef = useRef<HTMLDivElement>(null);

  // счётчик избранного
  useEffect(() => {
    const read = () => { try { setSaved(JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? '[]').length); } catch {} };
    read();
    window.addEventListener('storage', read);
    window.addEventListener('bookmarks-updated', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('bookmarks-updated', read); };
  }, []);

  // блокировка прокрутки при открытом меню
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [menuOpen]);

  // закрытие поповера по клику вне (проверяем, что клик реально снаружи)
  useEffect(() => {
    if (!lcOpen) return;
    const h = (e: MouseEvent) => {
      if (lcRef.current && !lcRef.current.contains(e.target as Node)) setLcOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [lcOpen]);

  // Esc закрывает
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); setLcOpen(false); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const t = I18N[lang];
  const activeKey = NAV.find(n => pathname?.startsWith(n.match))?.key ?? '';
  const loginHref = user ? '/profile' : '/login';
  const loginLabel = user ? user.name.split(' ')[0] : t.login;

  const rateVal = fx
    ? <>1 $ = <b>{fx.usdKzt.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b> ₸</>
    : <>…</>;
  const rateSrc = fx
    ? `${fx.src === 'fallback' ? '≈' : t.source + ' ·'} ${new Date(fx.t).toLocaleDateString('ru-RU')} · ${t.auto}`
    : '';

  const segLang = () => (['ru', 'kz', 'en'] as Lang[]).map(l => (
    <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{I18N[l].label}</button>
  ));
  const segCur = () => (['kzt', 'usd'] as Cur[]).map(c => (
    <button key={c} className={c === cur ? 'on' : ''} onClick={() => setCur(c)}>{CUR[c].sym} {CUR[c].code}</button>
  ));

  return (
    <div className="sixsotok-header" {...(menuOpen ? { 'data-menu': '' } : {})}>
      <style dangerouslySetInnerHTML={{ __html: HEADER_CSS }} />
      <div className="bar">
        <div className="inner">
          <Link className="logo" href="/" aria-label="6sotok.kz"><span className="wm">6sotok<span className="tld">.kz</span></span></Link>

          <nav className="main">
            {NAV.map(n => (
              <Link key={n.key} className={activeKey === n.key ? 'on' : ''} href={n.href}>{t.nav[n.key]}</Link>
            ))}
          </nav>

          <span className="spacer" />

          <div className="right">
            <div className="lc" ref={lcRef} {...(lcOpen ? { 'data-open': '' } : {})}>
              <button
                className="lc-btn"
                aria-haspopup="true"
                onClick={() => setLcOpen(o => !o)}
              >
                <Svg html={ic.globe} className="globe" />
                <span>{t.label}</span>
                <span className="sep">·</span>
                <span className="cur">{CUR[cur].sym}</span>
                <Svg html={ic.chev} className="chev" />
              </button>
              <div className="pop">
                <div className="pop-t">{t.langTitle}</div>
                <div className="seg lang">{segLang()}</div>
                <div className="pop-t" style={{ marginTop: '14px' }}>{t.curTitle}</div>
                <div className="seg cur">{segCur()}</div>
                <div className="rate"><span className="rl">$ → ₸</span><span className="rv">{rateVal}</span></div>
                <div className="rsrc">{rateSrc}</div>
              </div>
            </div>

            <Link className="ghost saved-txt" href="/favorites">
              <Svg html={ic.save} /><span>{t.saved}</span>{saved > 0 && <span className="badge">{saved}</span>}
            </Link>
            <Link className="ghost login" href={loginHref}>
              <Svg html={ic.user} /><span>{loginLabel}</span>
            </Link>
            <Link className="cta" href="/add-listing">
              <Svg html={ic.plus} /><span>{t.cta}</span>
            </Link>
          </div>

          <button
            className="menu-btn"
            aria-label={t.menu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span>{t.menu}</span><span className="lines"><i /><i /></span>
          </button>
        </div>

        {/* хедер раскрывается в эту панель на мобайле */}
        <div className="m-panel">
          <div className="m-inner">
            <div className="m-cap">{t.navTitle}</div>
            <div className="m-nav">
              {NAV.map((n, i) => (
                <Link
                  key={n.key}
                  className={activeKey === n.key ? 'on' : ''}
                  href={n.href}
                  style={{ animationDelay: `${0.05 + i * 0.055}s` }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="ix">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lbl">{t.nav[n.key]}</span>
                  <span className="ar">→</span>
                </Link>
              ))}
            </div>
            <div className="m-lc">
              <div className="m-sub">{t.langTitle}</div>
              <div className="seg lang">{segLang()}</div>
              <div className="m-sub mt">{t.curTitle}</div>
              <div className="seg cur">{segCur()}</div>
              <div className="rate"><span className="rl">$ → ₸</span><span className="rv">{rateVal}</span></div>
              <div className="rsrc">{rateSrc}</div>
            </div>
            <div className="m-actions">
              <div className="m-tiles">
                <Link className="m-tile" href="/favorites" onClick={() => setMenuOpen(false)}>
                  <span className="ic"><Svg html={ic.save} /></span>
                  <span className="lbl">{t.saved}{saved > 0 && <span className="badge">{saved}</span>}</span>
                </Link>
                <Link className="m-tile" href={loginHref} onClick={() => setMenuOpen(false)}>
                  <span className="ic"><Svg html={ic.user} /></span>
                  <span className="lbl">{loginLabel}</span>
                </Link>
              </div>
              <Link className="m-cta-full" href="/add-listing" onClick={() => setMenuOpen(false)}>
                <Svg html={ic.plus} /><span>{t.cta}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="scrim" onClick={() => setMenuOpen(false)} />
    </div>
  );
}
