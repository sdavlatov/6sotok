/* =========================================================================
   6sotok.kz · <site-footer> — единый футер (десктоп + мобайл)
   -------------------------------------------------------------------------
   Веб-компонент с Shadow DOM, парный к <site-header>. Стили изолированы.
   Подключение:

     <script src="site-footer.js" defer></script>
     <site-footer></site-footer>

   • Те же дизайн-токены и типографика, что у хедера.
   • i18n RU / KZ / EN — читает 6sotok:lang и слушает событие
     'sixsotok:locale-change' от хедера, поэтому переключается синхронно.
   • Контакт-блок с WhatsApp, колонки навигации, нижняя строка с
     правовыми ссылками и соцсетями.
   ========================================================================= */
(() => {
  if (customElements.get('site-footer')) return;

  if (!document.querySelector('link[data-sixsotok-fonts]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.setAttribute('data-sixsotok-fonts', '');
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap';
    document.head.appendChild(l);
  }

  const LS_LANG = '6sotok:lang';

  const I18N = {
    ru: {
      tagline: '№1 маркетплейс земельных участков в Казахстане.',
      appCap: 'Приложение 6sotok',
      appTop1: 'Загрузите в',
      appTop2: 'Доступно в',
      cols: [
        { title: 'Покупателям', links: [
          ['Все участки', 'catalog.html'],
          ['Бизнес и коммерция', 'catalog.html?type=business'],
          ['Сравнение', 'compare.html'],
          ['Подборки', 'index.html#collections'],
        ] },
        { title: 'Продавцам', links: [
          ['Разместить', 'submit-listing.html'],
          ['Как это работает', 'index.html#sell'],
          ['Агентствам', 'index.html#agencies'],
        ] },
        { title: 'Платформа', links: [
          ['Аналитика рынка', 'index.html#pulse'],
          ['Журнал', '#'],
          ['О проекте', '#'],
        ] },
      ],
      newCap: 'Полезное про землю',
      newSub: 'Цены, новые участки и разборы — когда есть что сказать. Без спама.',
      newPh: 'e-mail',
      newBtn: 'Подписаться',
      legalName: 'ТОО «6sotok.kz»',
      legalBin: 'БИН 000000 000 000',
      legalAddr: 'г. Алматы, ул. Примерная, 1, оф. 101',
      legal: [['Пользовательское соглашение', '#'], ['Конфиденциальность', '#'], ['Публичная оферта', '#']],
      rights: 'Все права защищены',
      city: 'Алматы, Казахстан',
    },
    kz: {
      tagline: 'Қазақстандағы №1 жер учаскелері маркетплейсі.',
      appCap: '6sotok қосымшасы',
      appTop1: 'Жүктеп алыңыз',
      appTop2: 'Қолжетімді',
      cols: [
        { title: 'Сатып алушыларға', links: [
          ['Барлық учаскелер', 'catalog.html'],
          ['Бизнес және коммерция', 'catalog.html?type=business'],
          ['Салыстыру', 'compare.html'],
          ['Таңдамалар', 'index.html#collections'],
        ] },
        { title: 'Сатушыларға', links: [
          ['Хабарландыру беру', 'submit-listing.html'],
          ['Бұл қалай жұмыс істейді', 'index.html#sell'],
          ['Агенттіктерге', 'index.html#agencies'],
        ] },
        { title: 'Платформа', links: [
          ['Нарық аналитикасы', 'index.html#pulse'],
          ['Журнал', '#'],
          ['Жоба туралы', '#'],
        ] },
      ],
      newCap: 'Жер туралы пайдалысы',
      newSub: 'Бағалар, жаңа учаскелер және талдау — айтарлық бар кезде. Спамсыз.',
      newPh: 'e-mail',
      newBtn: 'Жазылу',
      legalName: '«6sotok.kz» ЖШС',
      legalBin: 'БСН 000000 000 000',
      legalAddr: 'Алматы қ., Үлгі көш., 1, 101-кеңсе',
      legal: [['Пайдаланушы келісімі', '#'], ['Құпиялылық', '#'], ['Жария оферта', '#']],
      rights: 'Барлық құқықтар қорғалған',
      city: 'Алматы, Қазақстан',
    },
    en: {
      tagline: 'The #1 land-plot marketplace in Kazakhstan.',
      appCap: '6sotok app',
      appTop1: 'Download on the',
      appTop2: 'Get it on',
      cols: [
        { title: 'For buyers', links: [
          ['All plots', 'catalog.html'],
          ['Business & commercial', 'catalog.html?type=business'],
          ['Compare', 'compare.html'],
          ['Collections', 'index.html#collections'],
        ] },
        { title: 'For sellers', links: [
          ['List a plot', 'submit-listing.html'],
          ['How it works', 'index.html#sell'],
          ['For agencies', 'index.html#agencies'],
        ] },
        { title: 'Platform', links: [
          ['Market analytics', 'index.html#pulse'],
          ['Journal', '#'],
          ['About', '#'],
        ] },
      ],
      newCap: 'Useful stuff about land',
      newSub: 'Prices, new plots and breakdowns — whenever there’s something worth saying. No spam.',
      newPh: 'e-mail',
      newBtn: 'Subscribe',
      legalName: '6sotok.kz LLP',
      legalBin: 'BIN 000000 000 000',
      legalAddr: 'Almaty, Primernaya st. 1, of. 101',
      legal: [['Terms of use', '#'], ['Privacy', '#'], ['Public offer', '#']],
      rights: 'All rights reserved',
      city: 'Almaty, Kazakhstan',
    },
  };

  const ic = {
    tg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9L17 5.3c.4-.3-.1-.5-.6-.2L6.8 11l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.2 1.4z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    yt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.7-.5-5.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.6a2.8 2.8 0 0 0-2 2C1 8.3 1 12 1 12s0 3.7.5 5.4a2.8 2.8 0 0 0 2 2C5.2 20 12 20 12 20s6.8 0 8.5-.6a2.8 2.8 0 0 0 2-2C23 15.7 23 12 23 12zM9.8 15.3V8.7l5.7 3.3z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    arr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.7-.8-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1.1 8.3.7 1 1.5 2.1 2.5 2.1 1-.05 1.4-.7 2.6-.7 1.2 0 1.5.7 2.6.65 1.1-.02 1.7-1 2.4-2 .7-1.1 1-2.2 1-2.25-.02-.01-2-.8-2-3.2zM14.3 6.4c.5-.7.9-1.6.8-2.6-.8.03-1.8.6-2.4 1.3-.5.6-.9 1.5-.8 2.5.9.06 1.8-.5 2.4-1.2z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.2 3.3c-.3.2-.4.5-.4.9v15.6c0 .4.1.7.4.9l8.4-8.7-8.4-8.7zM14.1 13.3l2.6 2.7-9.3 5.3 6.7-8zM17.9 9.4l2.5 1.4c.7.4.7 1.4 0 1.8l-2.5 1.4-2.9-2.7 2.9-2.9zM14.1 10.7l-6.7-8 9.3 5.3-2.6 2.7z"/></svg>',
  };

  const STYLE = `
  :host{
    --green:#066F36; --green-2:#2CA64E; --green-3:#7FD495; --ink:#021A0E;
    --ink-900:#0d1410; --ink-600:#4c5650; --ink-400:#7d8a82; --ink-300:#a3a59a;
    --paper:#fff; --paper-2:#f5f6f3; --line:#e6e7e1;
    display:block; overflow-x:clip; font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif; -webkit-font-smoothing:antialiased;
  }
  *{box-sizing:border-box;} a{text-decoration:none;color:inherit;}
  button,input{font-family:inherit;}

  .foot{ position:relative; background:var(--paper-2); border-top:1px solid var(--line); overflow:hidden; }
  .foot::before{ content:""; position:absolute; inset:0; pointer-events:none;
    background-image:linear-gradient(rgba(6,111,54,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(6,111,54,.045) 1px,transparent 1px);
    background-size:44px 44px;
    -webkit-mask-image:radial-gradient(ellipse 70% 90% at 88% 4%, #000, transparent 70%);
    mask-image:radial-gradient(ellipse 70% 90% at 88% 4%, #000, transparent 70%); }
  .inner{ position:relative; z-index:1; max-width:1440px; margin:0 auto; padding:0 24px; }

  /* ---- top grid ---- */
  .top{ display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:28px 40px; padding:56px 0 44px; }

  .brand-col .logo{ display:inline-flex; align-items:center; gap:9px; }
  .brand-col .wm{ font-weight:900; letter-spacing:-.045em; font-size:22px; color:var(--ink-900); }
  .brand-col .wm .tld{ color:var(--green); }
  .brand-col .tag{ margin-top:16px; max-width:36ch; font-size:14px; line-height:1.6; color:var(--ink-600); }

  /* ---- app store badges ---- */
  .apps{ margin-top:24px; }
  .apps .ac{ font:600 10px/1 'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin-bottom:10px; }
  .apps .row{ display:flex; gap:10px; flex-wrap:wrap; }
  .store{ display:inline-flex; align-items:center; gap:10px; height:48px; padding:0 16px; border-radius:12px;
    background:var(--ink-900); color:#fff; transition:transform .1s, background .14s; }
  .store:hover{ background:#000; }
  .store:active{ transform:translateY(1px); }
  .store svg{ width:22px; height:22px; flex-shrink:0; }
  .store .st{ display:flex; flex-direction:column; line-height:1.1; }
  .store .st small{ font-size:9.5px; font-weight:500; letter-spacing:.02em; color:rgba(255,255,255,.72); }
  .store .st b{ font-size:15px; font-weight:700; letter-spacing:-.01em; }

  .col .ct{ font:600 10px/1 'JetBrains Mono',monospace; letter-spacing:.13em; text-transform:uppercase; color:var(--ink-400); margin-bottom:16px; }
  .col ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
  .col a{ display:inline-flex; align-items:center; gap:7px; font-size:13.5px; color:var(--ink-600); transition:color .14s, transform .14s; }
  .col a:hover{ color:var(--green); transform:translateX(2px); }

  /* ---- newsletter strip ---- */
  .news{ display:grid; grid-template-columns:auto 1fr; align-items:center; gap:28px;
    padding:22px 26px; margin-bottom:44px; border:1px solid var(--line); border-radius:20px;
    background:linear-gradient(120deg,#fff,#f0f6f1); }
  .news .nl{ min-width:0; }
  .news .nc{ font-weight:800; letter-spacing:-.02em; font-size:18px; color:var(--ink-900); }
  .news .ns{ margin-top:4px; font-size:13px; color:var(--ink-600); }
  .news form{ display:flex; gap:8px; justify-self:end; width:100%; max-width:420px; }
  .news input{ flex:1; height:46px; padding:0 16px; border-radius:12px; border:1px solid var(--line); background:#fff;
    font-size:14px; color:var(--ink-900); outline:none; transition:border-color .14s, box-shadow .14s; }
  .news input::placeholder{ color:var(--ink-300); }
  .news input:focus{ border-color:var(--green); box-shadow:0 0 0 3px rgba(6,111,54,.1); }
  .news button{ height:46px; padding:0 20px; border:0; border-radius:12px; cursor:pointer; white-space:nowrap;
    background:var(--green); color:#fff; font-size:14px; font-weight:600; letter-spacing:-.01em;
    display:inline-flex; align-items:center; gap:8px; transition:background .14s; }
  .news button:hover{ background:var(--ink); }
  .news button svg{ width:16px; height:16px; }

  /* ---- legal info strip ---- */
  .legalinfo{ display:flex; align-items:center; gap:10px 16px; flex-wrap:wrap; padding:18px 0; border-top:1px solid var(--line);
    font:500 11.5px/1.5 'JetBrains Mono',monospace; letter-spacing:.02em; color:var(--ink-400); }
  .legalinfo b{ color:var(--ink-600); font-weight:600; }
  .legalinfo .d{ color:var(--line); }

  /* ---- bottom bar ---- */
  .bar{ display:flex; align-items:center; gap:20px 26px; flex-wrap:wrap; padding:22px 0 30px; border-top:1px solid var(--line); }
  .cc{ font:500 11px/1.6 'JetBrains Mono',monospace; letter-spacing:.03em; color:var(--ink-400); max-width:none; }
  .cc b{ color:var(--ink-600); font-weight:600; }
  .loc{ display:inline-flex; align-items:center; gap:6px; font-size:12.5px; color:var(--ink-400); }
  .loc svg{ width:14px; height:14px; }
  .legal{ display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
  .legal a{ font-size:12.5px; color:var(--ink-600); transition:color .14s; }
  .legal a:hover{ color:var(--green); }
  .spacer{ flex:1; }
  .soc{ display:flex; align-items:center; gap:8px; }
  .soc a{ width:36px; height:36px; border-radius:10px; display:grid; place-items:center; color:var(--ink-600);
    border:1px solid var(--line); background:#fff; transition:color .14s, border-color .14s, transform .1s; }
  .soc a:hover{ color:var(--green); border-color:var(--green-3); }
  .soc a:active{ transform:translateY(1px); }
  .soc svg{ width:17px; height:17px; }

  /* ---- responsive ---- */
  @media (max-width:1024px){
    .top{ grid-template-columns:1fr 1fr; gap:32px; }
    .brand-col{ grid-column:1 / -1; }
    .news{ grid-template-columns:1fr; gap:16px; }
    .news form{ justify-self:stretch; max-width:none; }
  }
  @media (max-width:560px){
    .inner{ padding:0 18px; }
    .top{ grid-template-columns:1fr; gap:30px; padding:44px 0 36px; }
    .news{ padding:20px; }
    .news form{ flex-direction:column; }
    .news input, .news button{ height:52px; width:100%; flex:0 0 auto; justify-content:center; }
    .news input{ border:1.5px solid var(--ink-300); background:#fff; font-size:15px; }
    .bar{ gap:16px; }
    .spacer{ display:none; }
    .legal{ gap:14px; }
    /* app-бейджи — естественной ширины, рядом друг с другом (переносятся при нехватке места) */
    .apps .row{ flex-wrap:wrap; }
    .store{ flex:0 0 auto; }
  }
  /* самые узкие телефоны (≤400): ещё немного ужимаем */
  @media (max-width:400px){
    .inner{ padding:0 16px; }
    .brand-col .tag{ max-width:none; }
    /* нижняя полоса: в столбик, длинный текст переносится */
    .bar{ flex-direction:column; align-items:flex-start; gap:14px; padding:20px 0 28px; }
    .bar > *{ min-width:0; max-width:100%; }
    .cc, .legalinfo{ font-size:10.5px; overflow-wrap:anywhere; }
    .legalinfo{ min-width:0; }
    .news .nc{ font-size:16.5px; }
  }
  @media (prefers-reduced-motion:reduce){ .col a, .soc a, .news button{ transition:none; } }
  `;

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      this.lang = localStorage.getItem(LS_LANG) || 'ru';
      if (!I18N[this.lang]) this.lang = 'ru';
      this.attachShadow({ mode: 'open' });
      this.render();
      this.wire();
      this._onLocale = (e) => {
        const l = e?.detail?.lang;
        if (l && I18N[l] && l !== this.lang) { this.lang = l; this.render(); this.wire(); }
      };
      document.addEventListener('sixsotok:locale-change', this._onLocale);
    }
    disconnectedCallback() {
      document.removeEventListener('sixsotok:locale-change', this._onLocale);
    }
    t() { return I18N[this.lang]; }

    render() {
      const t = this.t(), year = new Date().getFullYear();
      const yr = year > 2021 ? `2021–${year}` : '2021';
      const cols = t.cols.map(c => `
        <div class="col">
          <div class="ct">${c.title}</div>
          <ul>${c.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>
        </div>`).join('');

      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <footer class="foot">
          <div class="inner">
            <div class="top">
              <div class="brand-col">
                <a class="logo" href="index.html" aria-label="6sotok.kz"><span class="wm">6sotok<span class="tld">.kz</span></span></a>
                <p class="tag">${t.tagline}</p>
                <div class="apps">
                  <div class="row">
                    <a class="store" href="#" aria-label="App Store">${ic.apple}<span class="st"><small>${t.appTop1}</small><b>App Store</b></span></a>
                    <a class="store" href="#" aria-label="Google Play">${ic.play}<span class="st"><small>${t.appTop2}</small><b>Google Play</b></span></a>
                  </div>
                </div>
              </div>
              ${cols}
            </div>

            <div class="news">
              <div class="nl">
                <div class="nc">${t.newCap}</div>
                <div class="ns">${t.newSub}</div>
              </div>
              <form id="nlForm">
                <input type="email" required placeholder="${t.newPh}" aria-label="${t.newPh}" />
                <button type="submit">${t.newBtn}${ic.arr}</button>
              </form>
            </div>

            <div class="bar">
              <div class="cc">© ${yr} · ${t.rights}</div>
              <div class="legal">${t.legal.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>
              <span class="spacer"></span>
              <div class="soc">
                <a href="https://instagram.com/6sotok.kz" target="_blank" rel="noopener" aria-label="Instagram">${ic.ig}</a>
                <a href="#" aria-label="Telegram">${ic.tg}</a>
                <a href="#" aria-label="YouTube">${ic.yt}</a>
              </div>
            </div>
          </div>
        </footer>`;
    }

    wire() {
      const form = this.shadowRoot.getElementById('nlForm');
      if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.textContent = '✓';
        setTimeout(() => { this.render(); this.wire(); }, 1800);
      });
    }
  }
  customElements.define('site-footer', SiteFooter);
})();
