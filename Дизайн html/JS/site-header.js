/* =========================================================================
   6sotok.kz · <site-header> — единый хедер (десктоп + мобайл)
   -------------------------------------------------------------------------
   Веб-компонент с Shadow DOM. Стили изолированы — не конфликтуют с CSS
   страницы. Подключение:

     <script src="site-header.js" defer></script>
     <site-header active="buy"></site-header>

   active = buy | sell | business | analytics | agencies  (подсветка раздела)

   Десктоп: логотип · меню · язык/валюта (авто-курс $→₸) · Избранное · Войти ·
            зелёная «+ Разместить участок».
   Мобайл (≤1024px): логотип + кнопка «Меню». По тапу сам хедер РАЗВОРАЧИВАЕТСЯ
            вниз в панель — никакой отдельной плавающей шторки.
   ========================================================================= */
(() => {
  if (customElements.get('site-header')) return;

  if (!document.querySelector('link[data-sixsotok-fonts]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.setAttribute('data-sixsotok-fonts', '');
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap';
    document.head.appendChild(l);
  }

  const I18N = {
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
      auto: 'автоматты түрде жаңарады', source: 'ҚРҰБ', navTitle: 'Бөлімдер',
    },
    en: {
      label: 'Eng', full: 'English',
      nav: { buy: 'Buy', sell: 'Sell', business: 'Business', analytics: 'Analytics', agencies: 'For agencies' },
      saved: 'Saved', login: 'Sign in', cta: 'List your plot',
      menu: 'Menu', close: 'Close', langTitle: 'Language', curTitle: 'Currency',
      auto: 'updates automatically', source: 'NBK', navTitle: 'Sections',
    },
  };
  const CUR = {
    kzt: { sym: '₸', code: 'KZT' },
    usd: { sym: '$', code: 'USD' },
  };
  const NAV = [
    { key: 'buy', href: 'catalog.html' },
    { key: 'sell', href: 'submit-listing.html' },
    { key: 'business', href: 'catalog.html#business' },
    { key: 'analytics', href: '#' },
    { key: 'agencies', href: '#' },
  ];
  const LS_LANG = '6sotok:lang', LS_CUR = '6sotok:currency', LS_FX = '6sotok:fx';

  async function loadRate() {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(LS_FX) || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 6 * 3600 * 1000) return cached;
    // 1) Нацбанк РК (для продакшна — лучше через свой бэкенд из-за CORS)
    try {
      const d = new Date();
      const fdate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      const r = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${fdate}`, { mode: 'cors' });
      if (r.ok) {
        const doc = new DOMParser().parseFromString(await r.text(), 'text/xml');
        for (const it of doc.querySelectorAll('item')) {
          if ((it.querySelector('title')?.textContent || '').trim().toUpperCase() === 'USD') {
            const v = parseFloat((it.querySelector('description')?.textContent || '').replace(',', '.'));
            if (v) { const o = { usdKzt: v, t: Date.now(), src: 'nbk' }; localStorage.setItem(LS_FX, JSON.stringify(o)); return o; }
          }
        }
      }
    } catch (e) {}
    // 2) авто-резерв (CORS-friendly)
    try {
      const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
      const kzt = j && j.rates && j.rates.KZT;
      if (kzt) { const o = { usdKzt: Math.round(kzt * 100) / 100, t: Date.now(), src: 'auto' }; localStorage.setItem(LS_FX, JSON.stringify(o)); return o; }
    } catch (e) {}
    return cached || { usdKzt: 525, t: Date.now(), src: 'fallback' };
  }

  const LOGO = `
    <svg class="mk" viewBox="0 0 120 120" aria-hidden="true">
      <path d="M88 14 L44 14 L30 30 L22 52 L20 80 L28 100 L46 108 L72 108 L96 98 L102 80 L96 60 L76 54 L54 58 L42 68 L40 76 L40 52 L50 38 L68 28 L88 24 Z" fill="var(--mk-fill)"/>
      <path d="M56 72 L72 72 L80 80 L78 90 L66 94 L52 90 L48 82 Z" fill="var(--mk-hole)"/>
    </svg>`;

  const ic = {
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  };

  const STYLE = `
  :host{
    --green:#066F36; --green-2:#2CA64E; --ink:#021A0E;
    --ink-900:#0d1410; --ink-600:#4c5650; --ink-400:#7d8a82;
    --paper:#fff; --paper-2:#f5f6f3; --line:#e6e7e1;
    --mk-fill:var(--green); --mk-hole:#fff;
    display:block; position:sticky; top:0; z-index:1000;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif; -webkit-font-smoothing:antialiased;
  }
  *{box-sizing:border-box;} a{text-decoration:none;color:inherit;} button{font-family:inherit;cursor:pointer;border:0;background:none;}

  .bar{
    position:relative; z-index:1102;
    background:rgba(255,255,255,.84);
    -webkit-backdrop-filter:blur(18px) saturate(150%); backdrop-filter:blur(18px) saturate(150%);
    border-bottom:1px solid var(--line);
    padding-top:env(safe-area-inset-top,0px);
    transition:border-radius .3s, box-shadow .3s;
  }
  .inner{ max-width:1440px; margin:0 auto; padding:0 24px; height:68px; display:flex; align-items:center; gap:26px; }

  .logo{ display:flex; align-items:center; gap:9px; flex-shrink:0; }
  .mk{ width:30px; height:30px; display:block; }
  .wm{ font-weight:900; letter-spacing:-.045em; font-size:20px; color:var(--ink-900); white-space:nowrap; }
  .wm .tld{ color:var(--green); }

  nav.main{ display:flex; align-items:center; gap:2px; }
  nav.main a{ padding:8px 12px; border-radius:9px; font-size:14px; font-weight:500; color:var(--ink-600); letter-spacing:-.01em; transition:background .14s,color .14s; white-space:nowrap; }
  nav.main a:hover{ background:var(--paper-2); color:var(--ink-900); }
  nav.main a.on{ background:#eef3ee; color:var(--green); font-weight:600; }

  .spacer{ flex:1; }
  .right{ display:flex; align-items:center; gap:8px; }

  .ghost{ height:38px; padding:0 12px; border-radius:10px; display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:500; color:var(--ink-600); transition:background .14s,color .14s; }
  .ghost:hover{ background:var(--paper-2); color:var(--ink-900); }
  .ghost svg{ width:17px; height:17px; }

  .lc{ position:relative; }
  .lc-btn{ height:38px; padding:0 10px; border-radius:10px; display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:var(--ink-900); border:1px solid var(--line); background:var(--paper); transition:border-color .14s; }
  .lc-btn:hover{ border-color:#cfd2c9; }
  .lc-btn .globe{ width:16px; height:16px; color:var(--ink-400); }
  .lc-btn .sep{ color:var(--line); font-weight:400; }
  .lc-btn .cur{ color:var(--ink-900); }
  .lc-btn .chev{ width:14px; height:14px; color:var(--ink-400); transition:transform .2s; }
  .lc[data-open] .lc-btn{ border-color:var(--green); }
  .lc[data-open] .lc-btn .chev{ transform:rotate(180deg); }

  .pop{ position:absolute; top:calc(100% + 8px); right:0; width:256px; background:var(--paper); border:1px solid var(--line); border-radius:16px; box-shadow:0 12px 40px -12px rgba(13,20,16,.28),0 2px 6px rgba(13,20,16,.06); padding:12px; opacity:0; transform:translateY(-6px) scale(.98); transform-origin:top right; pointer-events:none; transition:opacity .16s,transform .16s; z-index:50; }
  .lc[data-open] .pop{ opacity:1; transform:none; pointer-events:auto; }
  .pop-t{ font:600 10px/1 'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin:6px 4px 8px; }

  /* сегмент-контрол: белая плашка на сером треке, монохром (зелёный не трогаем) */
  .seg{ display:flex; gap:4px; background:var(--paper-2); border:1px solid var(--line); border-radius:12px; padding:4px; }
  .seg button{ flex:1; height:34px; border-radius:9px; font-size:13px; font-weight:600; color:var(--ink-600); display:inline-flex; align-items:center; justify-content:center; letter-spacing:-.01em; transition:color .14s, background .16s, box-shadow .16s; }
  .seg button:hover{ color:var(--ink-900); }
  .seg button.on{ background:var(--paper); color:var(--ink-900); box-shadow:0 1px 2px rgba(13,20,16,.14), 0 0 0 1px rgba(13,20,16,.03); }

  .rate{ margin:12px 4px 2px; padding-top:11px; border-top:1px dashed var(--line); display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
  .rate .rl{ font:500 11px/1.3 'JetBrains Mono',monospace; color:var(--ink-400); text-transform:uppercase; letter-spacing:.08em; }
  .rate .rv{ font:600 13px 'JetBrains Mono',monospace; color:var(--ink-900); white-space:nowrap; }
  .rate .rv b{ color:var(--green); }
  .rsrc{ margin:6px 4px 2px; font:500 10px/1.3 'JetBrains Mono',monospace; color:var(--ink-400); }

  .cta{ height:40px; padding:0 16px; border-radius:11px; display:inline-flex; align-items:center; gap:7px; font-size:13.5px; font-weight:600; color:#fff; letter-spacing:-.01em; white-space:nowrap; background:var(--green); box-shadow:0 1px 0 rgba(255,255,255,.15) inset,0 8px 20px -10px rgba(6,111,54,.7); transition:background .14s,transform .1s; }
  .cta:hover{ background:var(--ink); } .cta:active{ transform:translateY(1px); } .cta svg{ width:16px; height:16px; }

  .badge{ min-width:18px; height:18px; padding:0 5px; border-radius:99px; display:inline-flex; align-items:center; justify-content:center; background:var(--green); color:#fff; font-size:10.5px; font-weight:700; font-variant-numeric:tabular-nums; }

  .menu-btn{ display:none; }
  .m-panel{ display:none; }
  .scrim{ position:fixed; inset:0; z-index:1101; background:rgba(2,26,14,.34); -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px); opacity:0; pointer-events:none; transition:opacity .32s; }

  /* узкие десктопы: поджимаем подписи */
  @media (min-width:1025px) and (max-width:1180px){
    nav.main a{ padding:8px 10px; font-size:13.5px; }
    .ghost.login span{ display:none; } .ghost.login{ padding:0 9px; }
    .inner{ gap:18px; }
  }

  /* ===================== MOBILE ≤1024 ===================== */
  @media (max-width:1024px){
    nav.main, .spacer, .right{ display:none; }
    .inner{ height:60px; padding:0 16px; justify-content:space-between; }

    .menu-btn{
      display:inline-flex; align-items:center; gap:10px;
      height:42px; padding:0 6px 0 16px; border-radius:99px;
      border:1px solid var(--line); background:var(--paper);
      font-size:14px; font-weight:600; color:var(--ink-900);
    }
    .menu-btn .lines{ position:relative; width:30px; height:30px; border-radius:50%; background:var(--green); flex-shrink:0; }
    .menu-btn .lines i{ position:absolute; left:8px; right:8px; height:2px; border-radius:2px; background:#fff; transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .2s; }
    .menu-btn .lines i:nth-child(1){ top:11px; }
    .menu-btn .lines i:nth-child(2){ top:18px; }
    :host([data-menu]) .menu-btn .lines i:nth-child(1){ transform:translateY(4px) rotate(45deg); }
    :host([data-menu]) .menu-btn .lines i:nth-child(2){ transform:translateY(-3px) rotate(-45deg); }

    /* хедер разворачивается в панель */
    :host([data-menu]) .bar{ border-radius:0 0 24px 24px; box-shadow:0 30px 70px -18px rgba(2,26,14,.5); }
    .m-panel{
      display:block; position:relative; max-height:0; overflow:hidden; opacity:0;
      background-color:#fff;
      background-image:
        linear-gradient(rgba(6,111,54,.045) 1px,transparent 1px),
        linear-gradient(90deg,rgba(6,111,54,.045) 1px,transparent 1px);
      background-size:32px 32px;
      transition:max-height .46s cubic-bezier(.16,1,.3,1),opacity .28s;
    }
    :host([data-menu]) .m-panel{ max-height:calc(100dvh - 60px - env(safe-area-inset-top,0px)); opacity:1; overflow-y:auto; }
    :host([data-nofx]) .m-panel{ transition:none !important; }
    :host([data-nofx]) .m-nav a{ animation:none !important; opacity:1 !important; transform:none !important; }
    .m-inner{ position:relative; z-index:1; max-width:520px; margin:0 auto; padding:6px 16px calc(18px + env(safe-area-inset-bottom,0px)); }

    .m-cap{ font:600 10px/1 'JetBrains Mono',monospace; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-400); padding:10px 8px 8px; }
    .m-nav{ display:flex; flex-direction:column; gap:6px; }
    .m-nav a{
      display:grid; grid-template-columns:30px 1fr auto; align-items:center; gap:14px;
      padding:14px 14px; border-radius:14px; border:1px solid transparent;
      font-size:21px; font-weight:800; letter-spacing:-.03em; color:var(--ink-900);
      opacity:0; transform:translateY(10px); transition:background .16s, border-color .16s;
    }
    .m-nav a:active{ background:var(--paper-2); }
    .m-nav a .ix{ font:600 12px/1 'JetBrains Mono',monospace; color:var(--ink-400); }
    .m-nav a .ar{ color:var(--ink-400); font-size:18px; opacity:0; transform:translateX(-6px); transition:opacity .18s,transform .18s; }
    .m-nav a.on{ color:var(--green); background:#eef3ee; border-color:rgba(6,111,54,.16); }
    .m-nav a.on .ix{ color:#fff; background:var(--green); border-radius:7px; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 3px 8px -2px rgba(6,111,54,.5); }
    .m-nav a.on .ar{ color:var(--green); opacity:1; transform:none; }
    :host([data-menu]) .m-nav a{ animation:rise .5s cubic-bezier(.16,1,.3,1) forwards; }
    @keyframes rise{ to{ opacity:1; transform:none; } }

    .m-lc{ margin-top:14px; padding:14px; background:var(--paper-2); border-radius:16px; }
    .m-lc .seg button{ height:44px; font-size:15px; }
    .m-sub{ font:600 10px/1 'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin:0 2px 8px; }
    .m-sub.mt{ margin-top:14px; }

    .m-actions{ margin-top:12px; display:flex; flex-direction:column; gap:8px; }
    .m-tiles{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .m-tile{
      display:flex; flex-direction:column; justify-content:space-between; gap:16px; min-height:96px;
      padding:14px 15px; background:var(--paper); border:1px solid var(--line); border-radius:16px;
      box-shadow:0 4px 14px -8px rgba(13,20,16,.18);
      font-size:15.5px; font-weight:700; color:var(--ink-900); transition:transform .12s, box-shadow .14s;
    }
    .m-tile:active{ transform:translateY(1px); box-shadow:0 1px 5px -3px rgba(13,20,16,.18); }
    .m-tile .ic{ width:40px; height:40px; border-radius:12px; background:#eef3ee; color:var(--green); display:grid; place-items:center; }
    .m-tile .ic svg{ width:21px; height:21px; }
    .m-tile .lbl{ display:flex; align-items:center; gap:8px; }
    .m-cta-full{ display:flex; align-items:center; justify-content:center; gap:9px; margin-top:8px; height:56px; border-radius:16px; background:var(--green); color:#fff; font-size:16.5px; font-weight:700; box-shadow:0 10px 24px -10px rgba(6,111,54,.7); }
    .m-cta-full svg{ width:20px; height:20px; }

    :host([data-menu]) .scrim{ opacity:1; pointer-events:auto; }
  }
  @media (prefers-reduced-motion:reduce){ .m-panel{ transition:none; } .m-nav a{ animation:none; opacity:1; transform:none; } }
  `;

  class SiteHeader extends HTMLElement {
    connectedCallback() {
      this.lang = localStorage.getItem(LS_LANG) || 'ru';
      this.cur = localStorage.getItem(LS_CUR) || 'kzt';
      if (!I18N[this.lang]) this.lang = 'ru';
      this.attachShadow({ mode: 'open' });
      this.render();
      this.wire();
      loadRate().then(fx => { this.fx = fx; this.paintRate(); });
    }
    t() { return I18N[this.lang]; }

    navHtml(mobile) {
      const active = this.getAttribute('active'), t = this.t();
      return NAV.map((n, i) => {
        const on = active === n.key ? ' on' : '';
        const label = t.nav[n.key];
        return mobile
          ? `<a class="${on.trim()}" href="${n.href}" style="animation-delay:${0.05 + i * 0.055}s"><span class="ix">${String(i + 1).padStart(2, '0')}</span><span class="lbl">${label}</span><span class="ar">→</span></a>`
          : `<a class="${on.trim()}" href="${n.href}">${label}</a>`;
      }).join('');
    }
    segLang() {
      return ['ru', 'kz', 'en'].map(l =>
        `<button class="lang-opt${this.lang === l ? ' on' : ''}" data-lang="${l}">${I18N[l].label}</button>`
      ).join('');
    }
    segCur() {
      return ['kzt', 'usd'].map(c =>
        `<button class="cur-opt${this.cur === c ? ' on' : ''}" data-cur="${c}">${CUR[c].sym} ${CUR[c].code}</button>`
      ).join('');
    }

    render() {
      const t = this.t(), saved = 3;
      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <div class="bar">
          <div class="inner">
            <a class="logo" href="index.html" aria-label="6sotok.kz"><span class="wm">6sotok<span class="tld">.kz</span></span></a>
            <nav class="main">${this.navHtml(false)}</nav>
            <span class="spacer"></span>
            <div class="right">
              <div class="lc">
                <button class="lc-btn" id="lcBtn" aria-haspopup="true">
                  <span class="globe">${ic.globe}</span><span>${t.label}</span><span class="sep">·</span><span class="cur">${CUR[this.cur].sym}</span><span class="chev">${ic.chev}</span>
                </button>
                <div class="pop" id="lcPop">
                  <div class="pop-t">${t.langTitle}</div>
                  <div class="seg lang">${this.segLang()}</div>
                  <div class="pop-t" style="margin-top:14px">${t.curTitle}</div>
                  <div class="seg cur">${this.segCur()}</div>
                  <div class="rate"><span class="rl">$ → ₸</span><span class="rv" id="rateVal">…</span></div>
                  <div class="rsrc" id="rateSrc"></div>
                </div>
              </div>
              <a class="ghost saved-txt" href="#">${ic.save}<span>${t.saved}</span><span class="badge">${saved}</span></a>
              <a class="ghost login" href="auth.html">${ic.user}<span>${t.login}</span></a>
              <a class="cta" href="submit-listing.html">${ic.plus}<span>${t.cta}</span></a>
            </div>

            <button class="menu-btn" id="menuBtn" aria-label="${t.menu}" aria-expanded="false">
              <span>${t.menu}</span><span class="lines"><i></i><i></i></span>
            </button>
          </div>

          <!-- хедер разворачивается в эту панель на мобайле -->
          <div class="m-panel" id="mpanel">
            <div class="m-inner">
              <div class="m-cap">${t.navTitle}</div>
              <div class="m-nav">${this.navHtml(true)}</div>
              <div class="m-lc">
                <div class="m-sub">${t.langTitle}</div>
                <div class="seg lang">${this.segLang()}</div>
                <div class="m-sub mt">${t.curTitle}</div>
                <div class="seg cur">${this.segCur()}</div>
                <div class="rate"><span class="rl">$ → ₸</span><span class="rv" id="rateValM">…</span></div>
                <div class="rsrc" id="rateSrcM"></div>
              </div>
              <div class="m-actions">
                <div class="m-tiles">
                  <a class="m-tile" href="#"><span class="ic">${ic.save}</span><span class="lbl">${t.saved}<span class="badge">${saved}</span></span></a>
                  <a class="m-tile" href="auth.html"><span class="ic">${ic.user}</span><span class="lbl">${t.login}</span></a>
                </div>
                <a class="m-cta-full" href="submit-listing.html">${ic.plus}<span>${t.cta}</span></a>
              </div>
            </div>
          </div>
        </div>
        <div class="scrim" id="scrim"></div>
      `;
    }

    paintRate() {
      if (!this.fx) return;
      const t = this.t();
      const val = `1 $ = <b>${this.fx.usdKzt.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b> ₸`;
      const src = `${this.fx.src === 'fallback' ? '≈' : t.source + ' ≈'} ${new Date(this.fx.t).toLocaleDateString('ru-RU')} · ${t.auto}`;
      ['rateVal', 'rateValM'].forEach(id => { const e = this.shadowRoot.getElementById(id); if (e) e.innerHTML = val; });
      ['rateSrc', 'rateSrcM'].forEach(id => { const e = this.shadowRoot.getElementById(id); if (e) e.textContent = src; });
    }

    wire() {
      const r = this.shadowRoot, lc = r.querySelector('.lc'), lcBtn = r.getElementById('lcBtn');
      lcBtn.addEventListener('click', e => { e.stopPropagation(); lc.toggleAttribute('data-open'); });
      document.addEventListener('click', () => lc.removeAttribute('data-open'));
      r.getElementById('lcPop').addEventListener('click', e => e.stopPropagation());
      r.querySelectorAll('.lang-opt').forEach(b => b.addEventListener('click', () => this.setLang(b.dataset.lang)));
      r.querySelectorAll('.cur-opt').forEach(b => b.addEventListener('click', () => this.setCur(b.dataset.cur)));

      const open = () => { this.setAttribute('data-menu', ''); document.documentElement.style.overflow = 'hidden'; };
      const close = () => { this.removeAttribute('data-menu'); document.documentElement.style.overflow = ''; };
      r.getElementById('menuBtn').addEventListener('click', () => this.hasAttribute('data-menu') ? close() : open());
      r.getElementById('scrim').addEventListener('click', close);
      r.querySelectorAll('.m-nav a').forEach(a => a.addEventListener('click', close));
      window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    setLang(l) { if (!I18N[l]) return; this.lang = l; localStorage.setItem(LS_LANG, l); this.refresh(); }
    setCur(c) { if (!CUR[c]) return; this.cur = c; localStorage.setItem(LS_CUR, c); this.refresh(); }
    refresh() {
      const menu = this.hasAttribute('data-menu');
      const pop = this.shadowRoot.querySelector('.lc')?.hasAttribute('data-open');
      this.render(); this.wire(); this.paintRate();
      if (menu) { this.setAttribute('data-nofx', ''); this.setAttribute('data-menu', ''); requestAnimationFrame(() => requestAnimationFrame(() => this.removeAttribute('data-nofx'))); }
      if (pop) this.shadowRoot.querySelector('.lc').setAttribute('data-open', '');
      this.dispatchEvent(new CustomEvent('sixsotok:locale-change', { bubbles: true, composed: true, detail: { lang: this.lang, currency: this.cur, fx: this.fx } }));
    }
  }
  customElements.define('site-header', SiteHeader);
})();
