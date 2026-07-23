'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ListingMap, type MapPOI } from '@/components/listings/listing-map';
import './listing.css';

/* ─── Данные страницы (всё уже посчитано на сервере, сериализуемо) ─────────── */
export interface PdpSimilar {
  id: string;
  href: string;
  cover?: string;        // url реального фото
  placeholder: string;   // класс-заглушка plot-img-N
  type: string;          // «ИЖС · Талгар»
  title: string;
  price: string;         // «21.0 млн ₸»
  per: string;           // «1.50 млн / сотка»
  dist?: string;         // «2.4 км»
  photos: number;
  tags: { label: string; green?: boolean }[];
}

export interface PdpTravel { label: string; value: string }

export interface PdpData {
  id: string;
  publicId: string;
  type: string;               // slug типа для ссылок
  title: string;
  landTypeLabel: string;
  location: string;
  publishedAt: string;        // «12 июля»

  price: number;
  pricePerSotka: number;
  area: number;
  elevationM?: number;
  purpose?: string;
  landType?: string;
  landCategory?: string;
  plotShape?: string;
  frontWidth?: number;
  depth?: number;
  reliefType?: string;
  cadastralNumber?: string;
  isPledged?: boolean;
  hasEncumbrances?: boolean;
  hasStateAct?: boolean;
  readyToBuild?: boolean;
  urgent?: boolean;

  utilities: { key: string; label: string; on: boolean }[];
  locationType?: string[];

  description?: string;

  images: string[];           // реальные фото (может быть пусто)
  videos: string[];           // видео объявления (mp4/mov/webm)
  videoDuration?: string;

  hasMap: boolean;
  lat?: number;
  lng?: number;
  mapPOIs: MapPOI[];
  travel: PdpTravel[];

  seller: {
    name: string;
    phone: string;
    isAgency: boolean;
    hasWhatsApp: boolean;
    registerYear: number;
    listingsCount: number;
  } | null;

  similar: PdpSimilar[];
  similarTotal: number;
  listingUrl: string;
}

/* ─── Форматтеры ──────────────────────────────────────────────────────────── */
const nf = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
function mlnStr(n: number, dp = 1): { main: string; unit: string } {
  const m = n / 1_000_000;
  if (m >= 1) return { main: (Math.round(m * 10 ** dp) / 10 ** dp).toLocaleString('ru-RU', { minimumFractionDigits: dp === 2 ? 2 : 0 }), unit: 'млн' };
  return { main: nf(n), unit: '₸' };
}

/* ─── Иконки ──────────────────────────────────────────────────────────────── */
const IcShare = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>;
const IcPrint = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>;
const IcPhone = () => <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>;
const IcWa = ({ s = 20 }: { s?: number }) => <svg style={{ width: s, height: s }} className="shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.18-3.1.8.83-3-.2-.31A8.2 8.2 0 1 1 20.2 12 8.23 8.23 0 0 1 12 20.2Zm4.5-6.1c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.13-.17.25-.64.8-.78.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48c-.16 0-.42.06-.64.31-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.17 1.7 2.6 4.12 3.64.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>;
const IcSave = () => <svg className="w-4 h-4 pdp-save-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10a1 1 0 0 1 1 1v15.2a.5.5 0 0 1-.77.42L12 17.4l-5.23 3.22A.5.5 0 0 1 6 20.2V5a1 1 0 0 1 1-1z"/></svg>;
const IcOpen = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>;
const IcCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.3 12.2 2.5 2.5 4.9-5.4"/></svg>;

const NAV = [
  { id: 's-specs', label: 'Характеристики' },
  { id: 's-build', label: 'Что построить' },
  { id: 's-docs', label: 'Документы' },
  { id: 's-map', label: 'На карте' },
  { id: 's-nearby', label: 'Похожие' },
];

const LS_BOOKMARKS = '6sotok_bookmarks';

/* ─── Документы (генерируются из реальных полей) ───────────────────────────── */
function docLines(n: number) {
  return Array.from({ length: n }, (_, i) => (
    <span key={i} className="ln" style={{ top: 9 + i * 8, width: `${60 + ((i * 37) % 34)}%` }} />
  ));
}

export function ListingView({ d }: { d: PdpData }) {
  const [lb, setLb] = useState<{ open: boolean; i: number }>({ open: false, i: 0 });
  // POI («что рядом» + пины на карте) грузим после отрисовки: публичный Overpass
  // отвечает 7–9 с, на сервере он держал TTFB карточки. На сервере результат
  // кеширован на сутки, поэтому ждёт его только первый посетитель объявления.
  const [poi, setPoi] = useState<{ mapPOIs: PdpData['mapPOIs']; travel: PdpData['travel'] }>(
    { mapPOIs: d.mapPOIs, travel: d.travel },
  );

  useEffect(() => {
    if (!d.hasMap || d.lat == null || d.lng == null) return;
    const ac = new AbortController();
    fetch(`/api/poi?lat=${d.lat}&lng=${d.lng}`, { signal: ac.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j) setPoi({ mapPOIs: j.mapPOIs ?? [], travel: j.travel ?? [] }); })
      .catch(() => { /* POI — украшение карточки, молча обходимся без них */ });
    return () => ac.abort();
  }, [d.hasMap, d.lat, d.lng]);
  const [phoneShown, setPhoneShown] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareLbl, setShareLbl] = useState('Поделиться');
  const [active, setActive] = useState<string>('s-specs');
  const [doc, setDoc] = useState<null | { badge: string; title: string; meta: string; body: React.ReactNode }>(null);

  // Медиа объявления = фото + видео единым списком (видео идут после фото).
  // Раньше видео вообще не доходило до карточки — рендерились только d.images.
  const media = [
    ...d.images.map(url => ({ url, video: false })),
    ...d.videos.map(url => ({ url, video: true })),
  ];
  const hasPhotos = media.length > 0;
  const lbCount = hasPhotos ? media.length : 5;
  const extra = hasPhotos ? Math.max(0, media.length - 5) : 0;
  const cleanPhone = d.seller?.phone?.replace(/\D/g, '') ?? '';
  const priceP = mlnStr(d.price, 1);
  const perP = mlnStr(d.pricePerSotka, 2);
  const areaStr = Number.isInteger(d.area) ? String(d.area) : d.area.toFixed(1);

  /* favorite: читаем из LS при монтировании */
  useEffect(() => {
    try {
      const raw: string[] = JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? '[]');
      setSaved(raw.includes(d.id));
    } catch { /* пусто */ }
  }, [d.id]);

  const toggleSave = useCallback(() => {
    setSaved(prev => {
      const next = !prev;
      try {
        const raw: string[] = JSON.parse(localStorage.getItem(LS_BOOKMARKS) ?? '[]');
        const set = new Set(raw);
        if (next) set.add(d.id); else set.delete(d.id);
        localStorage.setItem(LS_BOOKMARKS, JSON.stringify([...set]));
        window.dispatchEvent(new Event('bookmarks-updated'));
      } catch { /* quota */ }
      return next;
    });
  }, [d.id]);

  /* lightbox body-lock + клавиши */
  useEffect(() => {
    if (!lb.open) return;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLb(s => ({ ...s, open: false }));
      if (e.key === 'ArrowRight') setLb(s => ({ ...s, i: (s.i + 1) % lbCount }));
      if (e.key === 'ArrowLeft') setLb(s => ({ ...s, i: (s.i - 1 + lbCount) % lbCount }));
    };
    window.addEventListener('keydown', onKey);
    return () => { document.documentElement.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [lb.open, lbCount]);

  /* doc modal body-lock */
  useEffect(() => {
    if (!doc) return;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDoc(null); };
    window.addEventListener('keydown', onKey);
    return () => { document.documentElement.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [doc]);

  /* scroll-spy */
  useEffect(() => {
    const io = new IntersectionObserver(
      es => es.forEach(en => { if (en.isIntersecting) setActive(en.target.id); }),
      { rootMargin: '-130px 0px -65% 0px', threshold: 0 },
    );
    NAV.forEach(n => { const el = document.getElementById(n.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 120, behavior: 'smooth' });
  };

  const share = async () => {
    const url = d.listingUrl;
    if (navigator.share) { try { await navigator.share({ title: d.title, url }); return; } catch { /* отмена */ } }
    try { await navigator.clipboard.writeText(url); } catch { /* нет доступа */ }
    setShareLbl('Ссылка скопирована');
    setTimeout(() => setShareLbl('Поделиться'), 1600);
  };

  const waHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Здравствуйте! Интересует «${d.title}».\n${d.listingUrl}`)}`;

  /* Обременения */
  const encum = (d.isPledged || d.hasEncumbrances)
    ? { text: 'Есть', cls: 'text-zinc-900 font-semibold' }
    : d.hasStateAct
      ? { text: 'Нет', cls: 'text-brand-600 font-semibold' }
      : { text: 'Не проверено', cls: 'text-zinc-400 font-medium' };

  /* Документы из реальных полей */
  const buildAct = () => {
    setDoc({
      badge: 'АКТ', title: 'Акт на право собственности', meta: 'Гос. акт',
      body: (
        <>
          <div className="flex justify-between items-start gap-4">
            <div>
              <div style={{ font: '700 15px/1.25 Inter', color: '#18181b' }}>Акт на право частной собственности на земельный участок</div>
              {d.cadastralNumber && <div style={{ font: '500 11px/1.4 var(--font-mono), JetBrains Mono, ui-monospace, monospace', color: '#a1a1aa', marginTop: 6 }}>№ {d.cadastralNumber}</div>}
            </div>
            <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: '50%', border: '2px solid #066F36', opacity: .5, display: 'grid', placeItems: 'center', font: '700 7.5px/1.2 var(--font-mono), JetBrains Mono, ui-monospace, monospace', color: '#066F36', textAlign: 'center' }}>ГОС<br />АКТ</div>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              ['Собственник', d.seller?.name ?? '—'],
              ['Целевое назначение', d.purpose ?? d.landType ?? '—'],
              ['Площадь', `${(d.area / 100).toFixed(4)} га`],
              ['Кадастровый №', d.cadastralNumber ?? '—'],
              ['Обременения', encum.text.toLowerCase()],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4" style={{ font: '400 13px/1.4 Inter' }}>
                <span style={{ color: '#71717a' }}>{k}</span>
                <span style={{ color: '#18181b', fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: '1px dashed #e4e4e7', font: '400 12px/1.7 Inter', color: '#71717a' }}>
            Удостоверяет право частной собственности на участок в границах, отражённых в межевом плане. Право зарегистрировано в органах юстиции.
          </div>
        </>
      ),
    });
  };

  const buildMezh = () => {
    setDoc({
      badge: 'ПЛАН', title: 'Межевой план + координаты', meta: 'СК-63',
      body: (
        <>
          <div style={{ font: '700 15px/1.25 Inter', color: '#18181b' }}>Межевой план земельного участка</div>
          <div style={{ font: '500 11px/1.4 var(--font-mono), JetBrains Mono, ui-monospace, monospace', color: '#a1a1aa', marginTop: 6 }}>Система координат СК-63</div>
          <div className="mt-4" style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 8, height: 220, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 400 220" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs><pattern id="pdpg" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#e4e4e7" strokeWidth="1" /></pattern></defs>
              <rect width="400" height="220" fill="url(#pdpg)" />
              <polygon points="120,52 285,44 300,146 135,164" fill="rgba(6,111,54,.12)" stroke="#066F36" strokeWidth="2" />
              {[[120, 52], [285, 44], [300, 146], [135, 164]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill="#066F36" />)}
              {d.frontWidth && <text x="192" y="34" fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="9" fill="#71717a">{d.frontWidth} м</text>}
              {d.depth && <text x="312" y="102" fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="9" fill="#71717a">{d.depth} м</text>}
            </svg>
          </div>
          <div className="mt-4 grid gap-3">
            {['т.1', 'т.2', 'т.3', 'т.4'].map(t => (
              <div key={t} className="flex justify-between gap-4" style={{ font: '400 13px/1.4 Inter' }}>
                <span style={{ color: '#71717a' }}>Точка {t.slice(2)}</span>
                <span style={{ color: '#18181b', fontWeight: 600, fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>по кадастру</span>
              </div>
            ))}
          </div>
        </>
      ),
    });
  };

  const docs: { badge: string; t: string; m: string; open: () => void }[] = [];
  if (d.hasStateAct) docs.push({ badge: 'АКТ', t: 'Акт на право собственности', m: 'PDF · гос. акт', open: buildAct });
  if (d.cadastralNumber) docs.push({ badge: 'ПЛАН', t: 'Межевой план + координаты', m: 'PDF · СК-63', open: buildMezh });

  /* Норм застройки — плотность из площади */
  const coverage = Math.round(d.area * 100 * 0.4);

  return (
    <div className="pdp-page">
      <main className="max-w-[1180px] mx-auto px-5 pt-6 pb-28 lg:pb-16">

        {/* ═══ GALLERY ═══ */}
        <section className="grid grid-cols-4 grid-rows-2 gap-2 h-[280px] sm:h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden mb-6">
          {[0, 1, 2, 3, 4].map(i => {
            const item = hasPhotos ? media[i] : undefined;
            const url = item?.url;
            const isVid = !!item?.video;
            const cls = `plot-img-${(i % 5) + 1}`;
            const isFirst = i === 0;
            return (
              <button
                key={i}
                onClick={() => setLb({ open: true, i: Math.min(i, lbCount - 1) })}
                className={`gallery-tile relative overflow-hidden cursor-zoom-in ${isFirst ? 'col-span-4 sm:col-span-2 row-span-2' : 'hidden sm:block'} ${url ? '' : `${cls} noise`}`}
              >
                {url && (isVid
                  ? <video src={url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                  : <Image src={url} alt={d.title} fill priority={isFirst} sizes={isFirst ? '(max-width: 640px) 100vw, 620px' : '310px'} className="object-cover" />
                )}
                {isVid && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <span className="w-12 h-12 rounded-full bg-black/55 backdrop-blur flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                )}
                {i === 4 && extra > 0 && (
                  <span className="absolute inset-0 bg-black/55 backdrop-blur-sm text-white flex flex-col items-center justify-center gap-0.5 z-10">
                    <span className="font-black tracking-tighter text-[26px] num">+{extra}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">фото</span>
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* ═══ TITLE ═══ */}
        <section className="mb-6">
          <div className="flex items-start justify-between gap-6">
            <h1 className="font-black tracking-tightest text-[30px] sm:text-[42px] leading-[1.02] text-zinc-900 max-w-2xl">
              {d.title}
            </h1>
            <div className="hidden sm:flex items-center gap-2 shrink-0 pt-1">
              <button className="share-btn" onClick={share}>{IcShare()}<span>{shareLbl}</span></button>
              <button className="share-btn" onClick={() => window.print()}>{IcPrint()}Печать</button>
            </div>
          </div>
        </section>

        {/* ═══ SECTION NAV ═══ */}
        <nav id="pdp-secnav" className="sticky top-[61px] lg:top-[69px] z-40 -mx-5 px-5 mb-8 bg-white/90 backdrop-blur border-b border-zinc-200">
          <div className="flex gap-1 overflow-x-auto py-2.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)} className={`secnav-i ${active === n.id ? 'active' : ''}`}>{n.label}</button>
            ))}
          </div>
        </nav>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">

          {/* ───── LEFT ───── */}
          <div className="min-w-0">

            {/* KEY FACTS */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 pb-9 border-b border-zinc-200">
              <Fact label="Площадь" value={areaStr} unit=" сот." />
              <Fact label="За сотку" value={perP.main} unit={` ${perP.unit}`} accent />
              <Fact label="Высота" value={d.elevationM != null ? String(d.elevationM) : '—'} unit={d.elevationM != null ? ' м' : ''} />
              <Fact label="Категория" value={d.purpose ?? d.landType ?? '—'} unit="" />
            </section>

            {/* DESCRIPTION */}
            {d.description && (
              <section className="py-9 border-b border-zinc-200">
                <div className="text-[15px] sm:text-[16px] leading-relaxed text-zinc-700 space-y-3 max-w-2xl whitespace-pre-line">
                  {d.description}
                </div>
              </section>
            )}

            {/* MOBILE SELLER */}
            {d.seller && (
              <section className="lg:hidden py-7 border-b border-zinc-200">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black tracking-tighter text-[14px] shrink-0">{initials(d.seller.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-bold text-zinc-900 leading-tight">{d.seller.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <SellerTag agency={d.seller.isAgency} />
                      <span className="text-[11.5px] text-zinc-500">на 6sotok.kz с {d.seller.registerYear}</span>
                    </div>
                  </div>
                  {d.seller.listingsCount > 0 && (
                    <Link href={`/catalog`} className="shrink-0 text-right">
                      <div className="font-black tracking-tighter text-[18px] text-zinc-900 leading-none num">{d.seller.listingsCount}</div>
                      <div className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-400 mt-1">объявл.</div>
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* CHARACTERISTICS + COMMUNICATIONS */}
            <section id="s-specs" className="py-9 border-b border-zinc-200">
              <div className="sec-label"><span className="sec-num">01</span><span className="sec-name">Характеристики и коммуникации</span><span className="sec-rule" /></div>
              <div className="grid sm:grid-cols-2 gap-x-12">
                <dl>
                  <div className="spec col-h"><dt>О участке</dt><dd /></div>
                  <Spec dt="Категория земли" dd={d.landCategory ?? '—'} />
                  <Spec dt="Целевое назначение" dd={d.purpose ?? d.landType ?? '—'} />
                  <Spec dt="Форма участка" dd={d.plotShape ?? '—'} />
                  <Spec dt="Фасад × глубина" dd={d.frontWidth && d.depth ? `${d.frontWidth} × ${d.depth} м` : '—'} mono />
                  <Spec dt="Рельеф" dd={d.reliefType ?? '—'} />
                  <Spec dt="Кадастровый №" dd={d.cadastralNumber ?? '—'} mono muted={!d.cadastralNumber} />
                  <div className="spec"><dt>Обременения</dt><dd className={encum.cls}>{encum.text}</dd></div>
                </dl>
                <dl>
                  <div className="spec col-h"><dt>Коммуникации</dt><dd /></div>
                  {d.utilities.map(u => (
                    <div key={u.key} className="spec"><dt>{u.label}</dt><dd className={u.on ? 'dd-on' : 'dd-off'}>{u.on ? 'Есть' : 'Нет'}</dd></div>
                  ))}
                </dl>
              </div>
            </section>

            {/* WHAT CAN BE BUILT */}
            <section id="s-build" className="py-9 border-b border-zinc-200">
              <div className="sec-label"><span className="sec-num">02</span><span className="sec-name">Что можно построить</span><span className="sec-rule" /></div>
              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-7 items-start">
                <dl>
                  <div className="spec col-h"><dt>Нормы для {d.purpose ?? d.landType ?? 'участка'}</dt><dd /></div>
                  <Spec dt="Этажность" dd="до 3 этажей + мансарда" />
                  <Spec dt="Макс. высота" dd="12 м" mono />
                  <Spec dt="Плотность застройки" dd={`до 40% · ≈ ${nf(coverage)} м²`} />
                  <Spec dt="Отступ от улицы" dd="5 м" mono />
                  <Spec dt="Отступ от соседей" dd="3 м" mono />
                  <Spec dt="Разрешено" dd="дом, ЛПХ, гараж, баня" />
                </dl>
                <div>
                  <div className="spec col-h"><dt>Ориентация и вид</dt><dd /></div>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="relative w-[150px] h-[150px] shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        <text x="50" y="11" textAnchor="middle" fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="7" fontWeight="600" fill="#066F36">С · горы</text>
                        <polygon points="22,32 33,20 44,32" fill="#d4d4d8" />
                        <polygon points="39,32 53,17 67,32" fill="#c4c4cc" />
                        <polygon points="60,32 71,22 82,32" fill="#d4d4d8" />
                        <circle cx="83" cy="18" r="4" fill="none" stroke="#a1a1aa" strokeWidth="1.2" />
                        <rect x="33" y="40" width="34" height="38" rx="3" fill="rgba(6,111,54,.10)" stroke="#066F36" strokeWidth="1.6" />
                        <line x1="50" y1="55" x2="50" y2="63" stroke="#066F36" strokeWidth="1.4" />
                        <polygon points="50,52 47.5,57 52.5,57" fill="#066F36" />
                        <text x="50" y="95" textAnchor="middle" fontFamily="var(--font-mono), ui-monospace, monospace" fontSize="7" fill="#71717a">Ю · улица</text>
                      </svg>
                    </div>
                    <ul className="text-[13.5px] leading-snug text-zinc-700 space-y-2.5">
                      <li>Вид на горы — <b className="text-zinc-900 font-semibold">север</b>, застройки перед видом нет</li>
                      <li>Фасад и въезд — <b className="text-zinc-900 font-semibold">юг</b>, на тихую улицу</li>
                      <li>Солнце на участке <b className="text-zinc-900 font-semibold">весь день</b></li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* DOCUMENTS */}
            <section id="s-docs" className="py-9 border-b border-zinc-200">
              <div className="sec-label"><span className="sec-num">03</span><span className="sec-name">Документы</span><span className="sec-rule" /></div>
              {docs.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {docs.map(dc => (
                    <button key={dc.badge} className="doc" onClick={dc.open}>
                      <span className="thumb">{docLines(6)}<span className="seal" /></span>
                      <span className="min-w-0">
                        <span className="badge">{dc.badge}</span>
                        <span className="t block mt-1.5">{dc.t}</span>
                        <span className="m block">{dc.m}</span>
                      </span>
                      <span className="open">{IcOpen()}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] text-zinc-400">Документы прикладываются к сделке — запросите у продавца.</p>
              )}
            </section>

            {/* MAP */}
            {d.hasMap && (
              <section id="s-map" className="py-9 border-b border-zinc-200">
                <div className="sec-label"><span className="sec-num">04</span><span className="sec-name">Где это и что рядом</span><span className="sec-rule" />{d.location && <span className="text-[11px] text-zinc-400 font-mono">{d.location}</span>}</div>
                {poi.travel.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {poi.travel.map((t, i) => <span key={i} className="tt">{t.label} <b>{t.value}</b></span>)}
                  </div>
                )}
                <div className="relative h-[300px] sm:h-[380px] rounded-2xl overflow-hidden border border-zinc-200 isolate z-0">
                  <ListingMap lat={d.lat!} lng={d.lng!} title={d.title} pois={poi.mapPOIs} />
                </div>
              </section>
            )}

            {/* NEARBY */}
            {d.similar.length > 0 && (
              <section id="s-nearby" className="pt-9">
                <div className="sec-label"><span className="sec-num">05</span><span className="sec-name">Похожие рядом</span><span className="sec-rule" /><Link href="/catalog" className="text-[12px] font-medium text-zinc-600 hover:text-zinc-900">все {d.similarTotal} →</Link></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {d.similar.map(s => <NearbyCard key={s.id} s={s} />)}
                </div>
              </section>
            )}
          </div>

          {/* ───── RIGHT (desktop only) ───── */}
          <aside className="min-w-0 hidden lg:block">
            <div className="sticky-card rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04),0_10px_34px_-12px_rgba(9,9,11,0.10)] p-6">
              <div className="flex items-baseline gap-2">
                <div className="font-black tracking-tightest text-[40px] text-zinc-900 leading-none num">{priceP.main}</div>
                <div className="text-[20px] font-bold text-zinc-400">{priceP.unit} {priceP.unit === 'млн' ? '₸' : ''}</div>
              </div>
              <div className="mt-2.5 text-[12.5px] text-zinc-500 num">{nf(d.pricePerSotka)} ₸ / сотка</div>
              {d.readyToBuild && <div className="mt-4"><span className="chip-ready">{IcCheck()}Готов к стройке</span></div>}

              {d.seller && (
                <div className="mt-5 pt-5 border-t border-zinc-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black tracking-tighter text-[13px] shrink-0">{initials(d.seller.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-zinc-900 leading-tight">{d.seller.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <SellerTag agency={d.seller.isAgency} />
                      <span className="text-[11.5px] text-zinc-500">на 6sotok.kz с {d.seller.registerYear}</span>
                    </div>
                  </div>
                  {d.seller.listingsCount > 0 && (
                    <Link href="/catalog" className="shrink-0 self-start text-right">
                      <div className="font-black tracking-tighter text-[17px] text-zinc-900 leading-none num">{d.seller.listingsCount}</div>
                      <div className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-400 mt-1">объявл.</div>
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-2.5">
                <button onClick={() => { if (phoneShown && cleanPhone) { window.location.href = `tel:${cleanPhone}`; } else { setPhoneShown(true); } }}
                  className="min-h-[54px] rounded-2xl bg-zinc-900 text-white font-semibold text-[15px] hover:bg-black transition flex items-center justify-center gap-2.5 px-4">
                  {IcPhone()}
                  <span>{phoneShown ? (d.seller?.phone || 'Телефон недоступен') : 'Показать телефон'}</span>
                </button>
                {d.seller?.hasWhatsApp && cleanPhone && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="min-h-[54px] rounded-2xl bg-brand-600 text-white font-semibold text-[15px] hover:bg-brand-700 transition flex items-center justify-center gap-2.5 px-4">
                    <IcWa /> Написать в WhatsApp
                  </a>
                )}
                <button onClick={toggleSave} className={`min-h-[46px] rounded-xl border font-medium text-[13.5px] transition flex items-center justify-center gap-2 ${saved ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={saved ? '#f0fdf4' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10a1 1 0 0 1 1 1v15.2a.5.5 0 0 1-.77.42L12 17.4l-5.23 3.22A.5.5 0 0 1 6 20.2V5a1 1 0 0 1 1-1z" /></svg>
                  <span>{saved ? 'В избранном' : 'Сохранить в избранное'}</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 text-[11.5px] text-zinc-400">
                Объявление № {d.publicId} · размещено {d.publishedAt}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ═══ MOBILE STICKY CTA ═══ */}
      <div className="pdp-mobile-cta lg:hidden fixed bottom-0 inset-x-0 z-[900] bg-white border-t border-zinc-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_-4px_rgba(9,9,11,0.08)]">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1.5">
            <div className="font-black tracking-tightest text-[24px] text-zinc-900 leading-none num">{priceP.main} {priceP.unit === 'млн' ? 'млн ₸' : '₸'}</div>
          </div>
          <div className="text-[10.5px] font-mono text-zinc-500 mt-1">{perP.main} {perP.unit} / сотка</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {cleanPhone && (
            <a href={`tel:${cleanPhone}`} className="h-11 w-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center" aria-label="Позвонить">{IcPhone()}</a>
          )}
          {d.seller?.hasWhatsApp && cleanPhone ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="h-11 px-4 rounded-xl bg-brand-600 text-white font-semibold text-[13.5px] flex items-center gap-2"><IcWa s={18} /> WhatsApp</a>
          ) : (
            <button onClick={toggleSave} className={`h-11 px-4 rounded-xl font-semibold text-[13.5px] flex items-center gap-2 border ${saved ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-zinc-200 text-zinc-700'}`}>
              <IcSave /> {saved ? 'В избранном' : 'В избранное'}
            </button>
          )}
        </div>
      </div>

      {/* ═══ LIGHTBOX ═══ */}
      <div className={`pdp-lb ${lb.open ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="lb-scrim" onClick={() => setLb(s => ({ ...s, open: false }))} />
        <button className="lb-close" onClick={() => setLb(s => ({ ...s, open: false }))} aria-label="Закрыть"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        <button className="lb-ctrl lb-prev" onClick={() => setLb(s => ({ ...s, i: (s.i - 1 + lbCount) % lbCount }))} aria-label="Назад"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
        <div className="lb-stage">
          {hasPhotos
            ? (media[lb.i]?.video
                ? <video src={media[lb.i].url} controls autoPlay playsInline className="max-h-full max-w-full" />
                : <img src={media[lb.i]?.url} alt={d.title} />)
            : <div className={`w-full h-full noise plot-img-${(lb.i % 5) + 1}`} />}
        </div>
        <button className="lb-ctrl lb-next" onClick={() => setLb(s => ({ ...s, i: (s.i + 1) % lbCount }))} aria-label="Вперёд"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
        <div className="lb-counter">{lb.i + 1} / {lbCount}</div>
      </div>

      {/* ═══ DOC MODAL ═══ */}
      <div className={`pdp-modal ${doc ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-scrim" onClick={() => setDoc(null)} />
        {doc && (
          <div className="modal-panel">
            <div className="modal-head">
              <span className="font-mono text-[10px] font-bold text-zinc-500 border border-zinc-300 rounded px-1.5 py-1">{doc.badge}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-zinc-900 leading-tight">{doc.title}</div>
                <div className="text-[11px] text-zinc-400 font-mono">{doc.meta}</div>
              </div>
              <button className="ml-auto w-9 h-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500" onClick={() => setDoc(null)} aria-label="Закрыть">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body"><div className="sheet">{doc.body}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Мелкие подкомпоненты ────────────────────────────────────────────────── */
function Fact({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className={`mt-1.5 font-black tracking-tighter text-[26px] leading-none num ${accent ? 'text-brand-600' : 'text-zinc-900'}`}>
        {value}{unit && <span className={`text-[14px] font-bold ${accent ? 'text-brand-500' : 'text-zinc-400'}`}>{unit}</span>}
      </div>
    </div>
  );
}

function Spec({ dt, dd, mono, muted }: { dt: string; dd: string; mono?: boolean; muted?: boolean }) {
  return (
    <div className="spec"><dt>{dt}</dt><dd className={`${mono ? 'font-mono' : ''} ${muted ? 'text-zinc-400' : ''}`}>{dd}</dd></div>
  );
}

function SellerTag({ agency }: { agency: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full bg-brand-50 text-brand-600 text-[11px] font-medium border border-brand-600/20">
      <span className="w-[5px] h-[5px] rounded-full bg-brand-600" />{agency ? 'Агентство' : 'Хозяин'}
    </span>
  );
}

function NearbyCard({ s }: { s: PdpSimilar }) {
  return (
    <Link href={s.href} className="ncard group">
      <div className={`relative overflow-hidden ${s.cover ? '' : `${s.placeholder} noise`}`} style={{ aspectRatio: '5/3' }}>
        {s.cover && <Image src={s.cover} alt={s.title} fill sizes="(max-width: 640px) 60vw, 260px" className="object-cover" />}
        <span className="absolute bottom-2 left-2 z-[2] font-mono text-[9px] text-zinc-700 bg-white/70 rounded px-1.5 py-0.5">{s.photos} фото</span>
      </div>
      <div className="p-3">
        <div className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-500 truncate">{s.type}</div>
        <h3 className="mt-1 font-semibold tracking-tight text-[13.5px] leading-snug text-zinc-900 line-clamp-1">{s.title}</h3>
        <div className="mt-2 font-black tracking-tighter text-[17px] text-zinc-900 leading-none num">{s.price}</div>
        <div className="font-mono text-[10.5px] text-zinc-500 mt-1">{s.per}{s.dist ? ` · ${s.dist}` : ''}</div>
        {s.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {s.tags.map((t, i) => <span key={i} className={`tag ${t.green ? 'tag-g' : ''}`}>{t.label}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}
