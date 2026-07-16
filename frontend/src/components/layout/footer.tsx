'use client';

/* =========================================================================
   6sotok.kz · <site-footer> — единый футер (десктоп + мобайл)
   Порт web-компонента (site-footer.js) в React. Shadow DOM → scoped <style>.
   Парный к хедеру: те же токены, i18n RU/KZ/EN, синхронизация локали через
   событие 'sixsotok:locale-change' и ключ 6sotok:lang.
   ========================================================================= */

import { useState } from 'react';
import Link from 'next/link';
import { useCurrency, type Lang } from '@/context/currency-context';

type Col = { title: string; links: [string, string][] };

const I18N: Record<Lang, {
  tagline: string; appTop1: string; appTop2: string;
  cols: Col[];
  newCap: string; newSub: string; newPh: string; newBtn: string;
  legal: [string, string][]; rights: string;
}> = {
  ru: {
    tagline: '№1 маркетплейс земельных участков в Казахстане.',
    appTop1: 'Загрузите в', appTop2: 'Доступно в',
    cols: [
      { title: 'Покупателям', links: [
        ['Все участки', '/catalog'],
        ['Бизнес и коммерция', '/business'],
        ['Сравнение', '/catalog/compare'],
        ['Подборки', '/#collections'],
      ] },
      { title: 'Продавцам', links: [
        ['Разместить', '/add-listing'],
        ['Как это работает', '/#sell'],
        ['Агентствам', '/b2b'],
      ] },
      { title: 'Платформа', links: [
        ['Аналитика рынка', '/analytics'],
        ['Центр знаний', '/journal'],
        ['О проекте', '/contacts'],
      ] },
    ],
    newCap: 'Полезное про землю',
    newSub: 'Цены, новые участки и разборы — когда есть что сказать. Без спама.',
    newPh: 'e-mail', newBtn: 'Подписаться',
    legal: [['Пользовательское соглашение', '/terms'], ['Конфиденциальность', '/privacy'], ['Публичная оферта', '/terms']],
    rights: 'Все права защищены',
  },
  kz: {
    tagline: 'Қазақстандағы №1 жер учаскелері маркетплейсі.',
    appTop1: 'Жүктеп алыңыз', appTop2: 'Қолжетімді',
    cols: [
      { title: 'Сатып алушыларға', links: [
        ['Барлық учаскелер', '/catalog'],
        ['Бизнес және коммерция', '/business'],
        ['Салыстыру', '/catalog/compare'],
        ['Таңдамалар', '/#collections'],
      ] },
      { title: 'Сатушыларға', links: [
        ['Хабарландыру беру', '/add-listing'],
        ['Бұл қалай жұмыс істейді', '/#sell'],
        ['Агенттіктерге', '/b2b'],
      ] },
      { title: 'Платформа', links: [
        ['Нарық аналитикасы', '/analytics'],
        ['Білім орталығы', '/journal'],
        ['Жоба туралы', '/contacts'],
      ] },
    ],
    newCap: 'Жер туралы пайдалы',
    newSub: 'Бағалар, жаңа учаскелер және талдау — айтарлық бар кезде. Спамсыз.',
    newPh: 'e-mail', newBtn: 'Жазылу',
    legal: [['Пайдалану келісімі', '/terms'], ['Құпиялылық', '/privacy'], ['Жария оферта', '/terms']],
    rights: 'Барлық құқықтар қорғалған',
  },
  en: {
    tagline: 'The #1 land-plot marketplace in Kazakhstan.',
    appTop1: 'Download on the', appTop2: 'Get it on',
    cols: [
      { title: 'For buyers', links: [
        ['All plots', '/catalog'],
        ['Business & commercial', '/business'],
        ['Compare', '/catalog/compare'],
        ['Collections', '/#collections'],
      ] },
      { title: 'For sellers', links: [
        ['List a plot', '/add-listing'],
        ['How it works', '/#sell'],
        ['For agencies', '/b2b'],
      ] },
      { title: 'Platform', links: [
        ['Market analytics', '/analytics'],
        ['Knowledge hub', '/journal'],
        ['About', '/contacts'],
      ] },
    ],
    newCap: 'Useful stuff about land',
    newSub: 'Prices, new plots and breakdowns — whenever there’s something worth saying. No spam.',
    newPh: 'e-mail', newBtn: 'Subscribe',
    legal: [['Terms of use', '/terms'], ['Privacy', '/privacy'], ['Public offer', '/terms']],
    rights: 'All rights reserved',
  },
};

const ic = {
  tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9L17 5.3c.4-.3-.1-.5-.6-.2L6.8 11l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.2 1.4z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
  yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.7-.5-5.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.6a2.8 2.8 0 0 0-2 2C1 8.3 1 12 1 12s0 3.7.5 5.4a2.8 2.8 0 0 0 2 2C5.2 20 12 20 12 20s6.8 0 8.5-.6a2.8 2.8 0 0 0 2-2C23 15.7 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg>',
  arr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.7-.8-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1.1 8.3.7 1 1.5 2.1 2.5 2.1 1-.05 1.4-.7 2.6-.7 1.2 0 1.5.7 2.6.65 1.1-.02 1.7-1 2.4-2 .7-1.1 1-2.2 1-2.25-.02-.01-2-.8-2-3.2zM14.3 6.4c.5-.7.9-1.6.8-2.6-.8.03-1.8.6-2.4 1.3-.5.6-.9 1.5-.8 2.5.9.06 1.8-.5 2.4-1.2z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.2 3.3c-.3.2-.4.5-.4.9v15.6c0 .4.1.7.4.9l8.4-8.7-8.4-8.7zM14.1 13.3l2.6 2.7-9.3 5.3 6.7-8zM17.9 9.4l2.5 1.4c.7.4.7 1.4 0 1.8l-2.5 1.4-2.9-2.7 2.9-2.9zM14.1 10.7l-6.7-8 9.3 5.3-2.6 2.7z"/></svg>',
};

const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const FOOTER_CSS = `
.sixsotok-footer{
  --green:#066F36; --green-2:#2CA64E; --green-3:#7FD495; --ink:#021A0E;
  --ink-900:#0d1410; --ink-600:#4c5650; --ink-400:#7d8a82; --ink-300:#a3a59a;
  --paper:#fff; --paper-2:#f5f6f3; --line:#e6e7e1;
  display:block; overflow-x:clip; font-family:var(--font-inter),'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif; -webkit-font-smoothing:antialiased;
  font-variant-numeric:normal;
}
.sixsotok-footer *{box-sizing:border-box;}
.sixsotok-footer a{text-decoration:none;color:inherit;}
.sixsotok-footer button,.sixsotok-footer input{font-family:inherit;}

.sixsotok-footer .foot{ position:relative; background:var(--paper-2); border-top:1px solid var(--line); overflow:hidden; }
.sixsotok-footer .foot::before{ content:""; position:absolute; inset:0; pointer-events:none;
  background-image:linear-gradient(rgba(6,111,54,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(6,111,54,.045) 1px,transparent 1px);
  background-size:44px 44px;
  -webkit-mask-image:radial-gradient(ellipse 70% 90% at 88% 4%, #000, transparent 70%);
  mask-image:radial-gradient(ellipse 70% 90% at 88% 4%, #000, transparent 70%); }
.sixsotok-footer .inner{ position:relative; z-index:1; max-width:1440px; margin:0 auto; padding:0 24px; }

.sixsotok-footer .top{ display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:28px 40px; padding:56px 0 44px; }

.sixsotok-footer .brand-col .logo{ display:inline-flex; align-items:center; gap:9px; }
.sixsotok-footer .brand-col .wm{ font-weight:900; letter-spacing:-.045em; font-size:22px; color:var(--ink-900); }
.sixsotok-footer .brand-col .wm .tld{ color:var(--green); }
.sixsotok-footer .brand-col .tag{ margin-top:16px; max-width:36ch; font-size:14px; line-height:1.6; color:var(--ink-600); }

.sixsotok-footer .apps{ margin-top:24px; }
.sixsotok-footer .apps .row{ display:flex; gap:10px; flex-wrap:wrap; }
.sixsotok-footer .store{ display:inline-flex; align-items:center; gap:10px; height:48px; padding:0 16px; border-radius:12px;
  background:var(--ink-900); color:#fff; transition:transform .1s, background .14s; }
.sixsotok-footer .store:hover{ background:#000; }
.sixsotok-footer .store:active{ transform:translateY(1px); }
.sixsotok-footer .store svg{ width:22px; height:22px; flex-shrink:0; }
.sixsotok-footer .store .st{ display:flex; flex-direction:column; line-height:1.1; }
.sixsotok-footer .store .st small{ font-size:9.5px; font-weight:500; letter-spacing:.02em; color:rgba(255,255,255,.72); }
.sixsotok-footer .store .st b{ font-size:15px; font-weight:700; letter-spacing:-.01em; }

.sixsotok-footer .col .ct{ font:600 10px/1 var(--font-mono),'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin-bottom:16px; }
.sixsotok-footer .col ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
.sixsotok-footer .col a{ display:inline-flex; align-items:center; gap:7px; font-size:13.5px; color:var(--ink-600); transition:color .14s, transform .14s; }
.sixsotok-footer .col a:hover{ color:var(--green); transform:translateX(2px); }

.sixsotok-footer .news{ display:grid; grid-template-columns:auto 1fr; align-items:center; gap:28px;
  padding:22px 26px; margin-bottom:44px; border:1px solid var(--line); border-radius:20px;
  background:linear-gradient(120deg,#fff,#f0f6f1); }
.sixsotok-footer .news .nl{ min-width:0; }
.sixsotok-footer .news .nc{ font-weight:800; letter-spacing:-.02em; font-size:18px; color:var(--ink-900); }
.sixsotok-footer .news .ns{ margin-top:4px; font-size:13px; color:var(--ink-600); }
.sixsotok-footer .news form{ display:flex; gap:8px; justify-self:end; width:100%; max-width:420px; }
.sixsotok-footer .news input{ flex:1; height:46px; padding:0 16px; border-radius:12px; border:1px solid var(--line); background:#fff;
  font-size:14px; color:var(--ink-900); outline:none; transition:border-color .14s, box-shadow .14s; }
.sixsotok-footer .news input::placeholder{ color:var(--ink-300); }
.sixsotok-footer .news input:focus{ border-color:var(--green); box-shadow:0 0 0 3px rgba(6,111,54,.1); }
.sixsotok-footer .news button{ height:46px; padding:0 20px; border:0; border-radius:12px; cursor:pointer; white-space:nowrap;
  background:var(--green); color:#fff; font-size:14px; font-weight:600; letter-spacing:-.01em;
  display:inline-flex; align-items:center; gap:8px; transition:background .14s; }
.sixsotok-footer .news button:hover{ background:var(--ink); }
.sixsotok-footer .news button svg{ width:16px; height:16px; }

.sixsotok-footer .bar{ display:flex; align-items:center; gap:20px 26px; flex-wrap:wrap; padding:22px 0 30px; border-top:1px solid var(--line); }
.sixsotok-footer .cc{ font:500 11px/1.6 var(--font-mono),'JetBrains Mono',monospace; letter-spacing:.03em; color:var(--ink-400); max-width:none; }
.sixsotok-footer .cc b{ color:var(--ink-600); font-weight:600; }
.sixsotok-footer .legal{ display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.sixsotok-footer .legal a{ font-size:12.5px; color:var(--ink-600); transition:color .14s; }
.sixsotok-footer .legal a:hover{ color:var(--green); }
.sixsotok-footer .spacer{ flex:1; }
.sixsotok-footer .soc{ display:flex; align-items:center; gap:8px; }
.sixsotok-footer .soc a{ width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:var(--ink-600);
  border:1px solid var(--line); background:#fff; transition:color .14s, border-color .14s, transform .1s; }
.sixsotok-footer .soc a:hover{ color:var(--green); border-color:var(--green-3); }
.sixsotok-footer .soc a:active{ transform:translateY(1px); }
.sixsotok-footer .soc svg{ width:17px; height:17px; }

@media (max-width:1024px){
  .sixsotok-footer .top{ grid-template-columns:1fr 1fr; gap:32px; }
  .sixsotok-footer .brand-col{ grid-column:1 / -1; }
  .sixsotok-footer .news{ grid-template-columns:1fr; gap:16px; }
  .sixsotok-footer .news form{ justify-self:stretch; max-width:none; }
}
@media (max-width:560px){
  .sixsotok-footer .inner{ padding:0 18px; }
  .sixsotok-footer .top{ grid-template-columns:1fr; gap:30px; padding:44px 0 36px; }
  .sixsotok-footer .news{ padding:20px; }
  .sixsotok-footer .news form{ flex-direction:column; }
  .sixsotok-footer .news input, .sixsotok-footer .news button{ height:52px; width:100%; flex:0 0 auto; justify-content:center; }
  .sixsotok-footer .news input{ border:1.5px solid var(--ink-300); background:#fff; font-size:15px; }
  .sixsotok-footer .bar{ gap:16px; }
  .sixsotok-footer .spacer{ display:none; }
  .sixsotok-footer .legal{ gap:14px; }
  .sixsotok-footer .apps .row{ flex-wrap:wrap; }
  .sixsotok-footer .store{ flex:0 0 auto; }
}
@media (max-width:400px){
  .sixsotok-footer .inner{ padding:0 16px; }
  .sixsotok-footer .brand-col .tag{ max-width:none; }
  .sixsotok-footer .bar{ flex-direction:column; align-items:flex-start; gap:14px; padding:20px 0 28px; }
  .sixsotok-footer .bar > *{ min-width:0; max-width:100%; }
  .sixsotok-footer .cc{ font-size:10.5px; overflow-wrap:anywhere; }
  .sixsotok-footer .news .nc{ font-size:16.5px; }
}
@media (prefers-reduced-motion:reduce){
  .sixsotok-footer .col a, .sixsotok-footer .soc a, .sixsotok-footer .news button{ transition:none; }
}
`;

export function Footer() {
  const { lang } = useCurrency();
  const [sent, setSent] = useState(false);

  const t = I18N[lang];
  const year = new Date().getFullYear();
  const yr = year > 2021 ? `2021–${year}` : '2021';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  return (
    <div className="sixsotok-footer">
      <style dangerouslySetInnerHTML={{ __html: FOOTER_CSS }} />
      <footer className="foot">
        <div className="inner">
          <div className="top">
            <div className="brand-col">
              <Link className="logo" href="/" aria-label="6sotok.kz"><span className="wm">6sotok<span className="tld">.kz</span></span></Link>
              <p className="tag">{t.tagline}</p>
              <div className="apps">
                <div className="row">
                  <a className="store" href="#" aria-label="App Store"><Svg html={ic.apple} /><span className="st"><small>{t.appTop1}</small><b>App Store</b></span></a>
                  <a className="store" href="#" aria-label="Google Play"><Svg html={ic.play} /><span className="st"><small>{t.appTop2}</small><b>Google Play</b></span></a>
                </div>
              </div>
            </div>

            {t.cols.map(c => (
              <div className="col" key={c.title}>
                <div className="ct">{c.title}</div>
                <ul>{c.links.map(([label, href]) => (
                  <li key={label}>{href.startsWith('/') ? <Link href={href}>{label}</Link> : <a href={href}>{label}</a>}</li>
                ))}</ul>
              </div>
            ))}
          </div>

          <div className="news">
            <div className="nl">
              <div className="nc">{t.newCap}</div>
              <div className="ns">{t.newSub}</div>
            </div>
            <form onSubmit={onSubmit}>
              <input type="email" required placeholder={t.newPh} aria-label={t.newPh} />
              <button type="submit">{sent ? '✓' : <>{t.newBtn}<Svg html={ic.arr} /></>}</button>
            </form>
          </div>

          <div className="bar">
            <div className="cc">© {yr} · {t.rights}</div>
            <div className="legal">{t.legal.map(([l, h]) => (
              h.startsWith('/') ? <Link key={l} href={h}>{l}</Link> : <a key={l} href={h}>{l}</a>
            ))}</div>
            <span className="spacer" />
            <div className="soc">
              <a href="https://instagram.com/6sotok.kz" target="_blank" rel="noopener" aria-label="Instagram"><Svg html={ic.ig} /></a>
              <a href="#" aria-label="Telegram"><Svg html={ic.tg} /></a>
              <a href="#" aria-label="YouTube"><Svg html={ic.yt} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
