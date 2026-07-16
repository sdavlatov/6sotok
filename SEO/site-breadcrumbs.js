/* =========================================================================
   6sotok.kz · <site-breadcrumbs> — единые хлебные крошки (десктоп + мобайл)
   -------------------------------------------------------------------------
   Веб-компонент с Shadow DOM. Один и тот же DOM работает как навигация
   для пользователя И как структурированные данные BreadcrumbList для SEO.

   Подключение (после site-header):
     <script src="site-breadcrumbs.js" defer></script>

   Использование — путь задаётся атрибутом trail (JSON-массив):
     <site-breadcrumbs trail='[
       {"name":"Купить","href":"/buy/"},
       {"name":"Алматинская обл.","href":"/almaty/"},
       {"name":"Талгар","href":"/almaty/talgar/"},
       {"name":"Бесагаш · 8 сот."}
     ]'></site-breadcrumbs>

   ПРАВИЛА:
   • «Главная» добавляется автоматически первым узлом — в trail НЕ включать.
   • Последний узел без "href" = текущая страница (не ссылка, aria-current).
   • Ставить со 2-го уровня и глубже; на главной компонент не размещать.
   • Desktop: одна строка 13px под шапкой. Mobile (≤1024): 12px, горизонт.
     скролл с fade у края + автоскролл к текущей. Всё — один DOM (важно SEO).
   • При >5 узлах середина сворачивается в «…» (раскрывается по клику),
     но узлы ОСТАЮТСЯ в DOM — микроразметка не ломается.

   Атрибуты:
     trail   — JSON-массив узлов [{name, href?}, ...] (обязательный)
     home    — переопределить корень (по умолч. «Главная» → "/")
     origin  — базовый домен для абсолютных URL в разметке
               (по умолч. https://6sotok.kz)
   ========================================================================= */
(() => {
  if (customElements.get('site-breadcrumbs')) return;

  const ORIGIN = 'https://6sotok.kz';
  const HOME = { ru: 'Главная', kz: 'Басты бет', en: 'Home' };
  const LS_LANG = '6sotok:lang';
  const MAX_VISIBLE = 5; // корень + до 5 = свыше — сворачиваем середину

  const abs = (origin, href) => {
    if (!href) return null;
    if (/^https?:\/\//i.test(href)) return href;
    return origin.replace(/\/+$/, '') + '/' + String(href).replace(/^\/+/, '');
  };
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const STYLE = `
  :host{
    --green:#066F36; --ink-900:#0d1410; --ink-500:#7d8a82; --ink-300:#c8cdc6;
    --line:#e6e7e1; --paper:#fff;
    display:block;
    font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  *{box-sizing:border-box;}
  .row{position:relative;background:var(--paper);border-bottom:1px solid var(--line);}
  .in{max-width:1440px;margin:0 auto;padding:0 24px;height:40px;display:flex;align-items:center;}
  ol{display:flex;align-items:center;gap:8px;font-size:13px;line-height:1;color:var(--ink-500);white-space:nowrap;list-style:none;margin:0;padding:0;}
  a{color:var(--ink-500);text-decoration:none;transition:color .12s;border-radius:4px;}
  a:hover{color:var(--ink-900);}
  a:focus-visible{outline:2px solid var(--green);outline-offset:2px;}
  .sep{color:var(--ink-300);user-select:none;}
  [aria-current="page"]{color:var(--ink-900);font-weight:600;}
  .more{color:var(--ink-500);background:none;border:0;font:inherit;cursor:pointer;padding:0 2px;border-radius:4px;}
  .more:hover{color:var(--ink-900);}
  li[hidden]{display:none;}

  @media(max-width:1024px){
    .row::after{content:"";position:absolute;top:0;right:0;bottom:1px;width:34px;pointer-events:none;
      background:linear-gradient(90deg,transparent,var(--paper) 78%);}
    .in{padding:0;height:auto;}
    ol{font-size:12px;gap:7px;overflow-x:auto;padding:11px 16px;
      -webkit-overflow-scrolling:touch;scrollbar-width:none;}
    ol::-webkit-scrollbar{display:none;}
  }
  @media print{ .row{border:0;} .more{display:none;} li[hidden]{display:inline!important;} }
  `;

  class SiteBreadcrumbs extends HTMLElement {
    static get observedAttributes() { return ['trail', 'home', 'origin']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }

    _lang() {
      let l = 'ru';
      try { l = localStorage.getItem(LS_LANG) || 'ru'; } catch (e) {}
      return HOME[l] ? l : 'ru';
    }
    _trail() {
      try { const a = JSON.parse(this.getAttribute('trail') || '[]'); return Array.isArray(a) ? a : []; }
      catch (e) { console.warn('<site-breadcrumbs>: некорректный trail JSON'); return []; }
    }

    render() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      const origin = (this.getAttribute('origin') || ORIGIN).trim();
      const homeName = this.getAttribute('home') || HOME[this._lang()];
      // полный список узлов: [Главная, ...trail]
      const nodes = [{ name: homeName, href: '/' }, ...this._trail()];
      // последний = текущая страница (ссылку убираем)
      const last = nodes.length - 1;

      // Сворачивать середину при глубине > MAX_VISIBLE (корень + MAX_VISIBLE узлов).
      // Прячем узлы 1 … last-2, видимыми остаются: корень, предпоследний, текущий.
      const collapse = nodes.length > MAX_VISIBLE + 1;
      const hideFrom = 1, hideTo = last - 2; // включительно

      const parts = [];
      nodes.forEach((n, i) => {
        const isLast = i === last;
        const url = abs(origin, n.href);
        const item = (!isLast && url)
          ? `<a itemprop="item" href="${esc(url)}"><span itemprop="name">${esc(n.name)}</span></a>`
          : `<span itemprop="name">${esc(n.name)}</span>`;
        const cur = isLast ? ' aria-current="page"' : '';
        const nodeHidden = collapse && i >= hideFrom && i <= hideTo;
        parts.push(
          `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"${cur}` +
          `${nodeHidden ? ' hidden data-collapsible' : ''}>` +
          `${item}<meta itemprop="position" content="${i + 1}"></li>`
        );
        if (!isLast) {
          // разделитель ПОСЛЕ узла i; прячем те, что попадают внутрь свёрнутого блока
          const sepHidden = collapse && i >= hideFrom && i <= hideTo;
          parts.push(`<li class="sep" aria-hidden="true"${sepHidden ? ' hidden data-collapsible' : ''}>/</li>`);
          // после разделителя корня (i===0) вставляем «…» + его собственный разделитель
          if (collapse && i === 0) {
            parts.push(`<li aria-hidden="true" data-more><button class="more" type="button" aria-label="Показать все">…</button></li>`);
            parts.push(`<li class="sep" aria-hidden="true" data-more>/</li>`);
          }
        }
      });

      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style>` +
        `<nav class="row" aria-label="Хлебные крошки"><div class="in">` +
        `<ol itemscope itemtype="https://schema.org/BreadcrumbList">${parts.join('')}</ol>` +
        `</div></nav>`;

      // «…» → раскрыть середину: показать свёрнутые узлы/разделители, убрать «…»
      const btn = this.shadowRoot.querySelector('.more');
      if (btn) btn.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('li[data-collapsible]').forEach((li) => { li.hidden = false; });
        this.shadowRoot.querySelectorAll('li[data-more]').forEach((li) => li.remove());
      });

      // автоскролл к текущей странице на мобиле
      const ol = this.shadowRoot.querySelector('ol');
      if (ol) requestAnimationFrame(() => { ol.scrollLeft = ol.scrollWidth; });
    }
  }

  customElements.define('site-breadcrumbs', SiteBreadcrumbs);
})();
