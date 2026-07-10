'use client';

/* =========================================================================
   Главная 6sotok.kz — порт макета «index (Главная AIDA)».
   Живые части: ротация рекламной карточки (hero), live-тикер, мастер подбора.
   Цены — через useCurrency (₸↔$ переключается в хедере).
   ========================================================================= */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/currency-context';
import { listingUrl } from '@/lib/listing-url';
import './home.css';

export type HomeFeatured = {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  area: number;
  landType?: string;
  location: string;
  image?: string;
};

type Props = {
  featured: HomeFeatured[];
  landCount: number;
  businessCount: number;
  locationsCount: number;
};

const fmtNum = (n: number) => n.toLocaleString('ru-RU');

function phClass(landType?: string): string {
  switch (landType) {
    case 'ИЖС': case 'МЖС': return 'ph-plot';
    case 'Сельхоз': case 'КХ': return 'ph-soil';
    case 'ЛПХ': return 'ph-water';
    case 'Дача': return 'ph-grass';
    case 'Коммерция': case 'Промбаза': return 'ph-rock';
    case 'Рекреация': return 'ph-mountain';
    default: return 'ph-plot';
  }
}

// стилизованные позиции пинов на hero-карте
const PIN_POS = [
  { mx: 56, my: 26 }, { mx: 62, my: 46 }, { mx: 52, my: 58 }, { mx: 47, my: 42 },
  { mx: 60, my: 74 }, { mx: 70, my: 86 }, { mx: 82, my: 78 }, { mx: 88, my: 76 },
  { mx: 66, my: 90 }, { mx: 78, my: 72 },
];

const Ic = ({ d, w = 24, sw = 2 }: { d: string; w?: number; sw?: number }) => (
  <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const CHECK = 'M20 6 9 17l-5-5';
// гео-пин с внутренним кружком (как в макете)
const PinIcon = ({ w = 14, sw = 2.2 }: { w?: number; sw?: number }) => (
  <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.6" />
  </svg>
);
const WA_FULL = 'M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.7.7-.9 1.7-.6 2.7a9 9 0 0 0 4.6 4.8c1.4.6 2 .5 2.7.4.5-.1 1.4-.6 1.5-1.1.2-.5.2-.9.1-1z';

/* ═══════════════════════ HERO ═══════════════════════ */
function Hero({ featured, landCount }: { featured: HomeFeatured[]; landCount: number }) {
  const { format } = useCurrency();
  // пул рекламы hero — до 10 объявлений (как в макете); если реальных меньше, добираем циклом
  const base = featured.slice(0, 10);
  const items = base.length === 0 ? [] : base.length >= 10 ? base : Array.from({ length: 10 }, (_, i) => base[i % base.length]);
  const n = items.length;
  const [idx, setIdx] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const connRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (n <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setIdx(i => (i + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  // пунктирный коннектор от активного пина к рекламной карточке
  const drawConn = useCallback(() => {
    const stage = stageRef.current, path = connRef.current, card = cardRef.current;
    if (!stage || !path) return;
    if (!card || window.innerWidth < 1024) { path.setAttribute('d', ''); return; }
    const s = stage.getBoundingClientRect(), c = card.getBoundingClientRect();
    if (!c.width) { path.setAttribute('d', ''); return; }
    const p = PIN_POS[idx % PIN_POS.length];
    const x1 = s.width * p.mx / 100, y1 = s.height * p.my / 100;
    const x2 = c.left - s.left + 26, y2 = c.bottom - s.top - 16;
    path.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${((x1 + x2) / 2).toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }, [idx]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(drawConn));
    window.addEventListener('resize', drawConn);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', drawConn); };
  }, [drawConn]);

  const cur = items[idx];
  const pos = PIN_POS[idx % PIN_POS.length];
  const mLabel = cur ? (cur.location.split(',').pop() || cur.location).trim() : '';

  return (
    <section className="relative bg-white overflow-hidden border-b border-paper-3">
      <div className="hero-map" />
      <div className="hero-road" style={{ left: 0, right: 0, top: '57%', height: 12 }} />
      <div className="hero-road" style={{ top: 0, bottom: 0, left: '63%', width: 11 }} />
      <div className="hero-road" style={{ left: '63%', right: 0, top: '28%', height: 7, background: 'rgba(255,255,255,.78)' }} />
      <div className="hero-scrim" />

      <div className="relative max-w-[1440px] mx-auto px-5 sm:px-6 py-12 lg:py-0">
        <div className="hero-stage" ref={stageRef}>
          <svg className="hero-conn" width="100%" height="100%" fill="none" aria-hidden="true">
            <path ref={connRef} d="" stroke="#066F36" strokeOpacity="0.42" strokeWidth="1.6" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          <div className="hero-pins">
            {items.map((it, i) => {
              const p = PIN_POS[i % PIN_POS.length];
              return (
                <div key={i} className={`hero-pin${i === idx ? ' active' : ''}`} style={{ left: `${p.mx}%`, top: `${p.my}%` }}>
                  <span className="ring" /><span className="dot" />
                </div>
              );
            })}
            {[
              { v: 12500000, a: 10, left: 47, top: 31 },
              { v: 9800000, a: 6, left: 44, top: 66 },
              { v: 24000000, a: 15, left: 55, top: 83 },
            ].map(c => (
              <div key={c.left} className="hero-chip" style={{ left: `${c.left}%`, top: `${c.top}%` }}>
                {format(c.v)} <i>{c.a} сот</i>
              </div>
            ))}
          </div>

          <div className="hero-text2">
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <div className="inline-flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-3 sm:pr-4 py-1.5 rounded-2xl sm:rounded-full bg-white border border-paper-3 shadow-sm max-w-full">
                <span className="ping-dot flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-brand-600 text-white font-black text-[11.5px] tracking-tighter">№1</span>
                <span className="text-[12.5px] sm:text-[13px] font-semibold text-ink-900 tracking-tight leading-snug">Маркетплейс земельных участков в Казахстане</span>
                <span className="hidden sm:block w-1 h-1 shrink-0 rounded-full bg-ink-300" />
                <span className="hidden sm:inline mono text-[11px] uppercase tracking-[0.12em] text-ink-400 shrink-0">с 2021 года</span>
              </div>
            </div>
            <h1 className="font-black tracking-tightest text-[38px] leading-[1.0] sm:text-[54px] sm:leading-[0.96] text-ink-900">
              Найдите идеальный участок <span className="text-brand-600">для жизни и бизнеса.</span>
            </h1>
            <p className="mt-5 text-[16px] sm:text-[18px] text-ink-600 leading-relaxed max-w-xl">
              Покупайте и продавайте земельные участки удобно — быстро находите на карте и легко размещайте объявления.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/catalog" className="px-6 h-13 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-[15px] inline-flex items-center justify-center gap-2 hover:bg-brand-700 transition shadow-[0_12px_32px_-12px_rgba(6,111,54,.55)]">Найти участок <span>→</span></Link>
              <Link href="/add-listing" className="px-6 h-13 py-3.5 rounded-xl bg-white border border-paper-3 text-ink-900 font-semibold text-[15px] inline-flex items-center justify-center gap-2 hover:border-ink-400 transition">Разместить объявление</Link>
            </div>
          </div>

          <div className="hero-cardwrap">
            <div className="hero-mmap">
              <div className="mroad" style={{ left: 0, right: 0, top: '56%', height: 8 }} />
              <div className="mroad" style={{ top: 0, bottom: 0, left: '66%', width: 7 }} />
              {[[24, 34], [78, 30], [40, 74], [85, 66], [15, 62]].map(([l, t], i) => (
                <span key={i} className="mdot" style={{ left: `${l}%`, top: `${t}%` }} />
              ))}
              <div className="mpin" style={{ left: `${(14 + pos.mx * 0.7).toFixed(1)}%`, top: `${(22 + (pos.my / 100) * 54).toFixed(1)}%` }}>
                <span className="ring" /><span className="dot" />
              </div>
              <div className="mlabel">{mLabel || 'На карте'}</div>
            </div>

            {cur ? (
              <div ref={cardRef} className="card overflow-hidden relative fw-topround">
                <div className="relative aspect-[16/10]">
                  <div key={`ph-${idx}`} className={`absolute inset-0 fw-anim ${cur.image ? '' : phClass(cur.landType)}`}>
                    {cur.image && <img src={cur.image} alt={cur.title} className="absolute inset-0 w-full h-full object-cover" />}
                  </div>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg,transparent 52%,rgba(20,22,15,.42))' }} />
                  <span className="absolute top-4 left-4 z-10 pointer-events-none inline-flex items-center h-[22px] px-[9px] rounded-md mono text-[10px] uppercase tracking-[0.08em] text-ink-500" style={{ background: 'rgba(250,250,247,0.82)', backdropFilter: 'blur(6px)', border: '1px solid rgba(20,22,15,0.06)' }}>Реклама</span>
                  {n > 1 && <span className="absolute top-4 right-4 z-10 mono text-[11px] font-semibold text-white bg-black/35 backdrop-blur px-2.5 py-1 rounded-md num pointer-events-none">{idx + 1} / {n}</span>}
                  <div key={`meta-${idx}`} className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none fw-anim">
                    <div className="mono text-[10.5px] uppercase tracking-[0.06em] text-white/80">{cur.landType ?? 'Участок'} · {cur.area} сот · {cur.location}</div>
                    <div className="font-extrabold tracking-tighter text-[20px] sm:text-[22px] text-white leading-tight mt-1">{cur.title}</div>
                  </div>
                </div>
                <div key={`info-${idx}`} className="p-5 sm:p-6 flex items-center gap-4 fw-anim">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="font-extrabold text-[24px] sm:text-[26px] tracking-tighter text-brand-600 num leading-none">{format(cur.price)}</span>
                      <span className="mono text-[12px] text-ink-500 num">{cur.area ? format(Math.round(cur.price / cur.area), { perSotka: true }) : ''}</span>
                    </div>
                  </div>
                  <Link href={listingUrl(cur)} className="shrink-0 inline-flex px-5 h-11 rounded-xl text-white text-[13.5px] font-semibold hover:bg-brand-600 transition items-center gap-2" style={{ background: '#14160f' }}>Смотреть <span>→</span></Link>
                </div>
                {n > 1 && (
                  <>
                    <div className="px-5 sm:px-6 pb-4 -mt-1 flex items-center gap-1.5">
                      {items.map((_, i) => (
                        <span key={i} className="rounded-full transition-all duration-300" style={{ height: 5, width: i === idx ? 18 : 5, background: i === idx ? '#066F36' : '#d9d7cf' }} />
                      ))}
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/5"><div key={idx} className="h-full bg-brand-500 fw-prog" /></div>
                  </>
                )}
              </div>
            ) : (
              <div className="card ph-plot p-8 sm:p-12 text-center">
                <span className="inline-flex items-center mb-4 h-[22px] px-[9px] rounded-md mono text-[10px] uppercase tracking-[0.08em] text-ink-500" style={{ background: 'rgba(250,250,247,0.9)', border: '1px solid rgba(20,22,15,0.06)' }}>Реклама</span>
                <div className="font-extrabold tracking-tighter text-[22px] sm:text-[26px] text-ink-900">Место для рекламы</div>
                <p className="mt-2.5 text-[14px] text-ink-600 max-w-sm mx-auto leading-snug">Самый заметный блок главной — его видит каждый, кто заходит на 6sotok. Продвиньте свой участок в топ.</p>
                <Link href="/add-listing" className="mt-6 inline-flex px-5 h-11 rounded-xl bg-brand-600 text-white font-semibold text-[14px] hover:bg-brand-700 transition items-center gap-2">Разместить рекламу <span>→</span></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════ LIVE ТИКЕР ═══════════════════════ */
const FEED: { title: string; meta: string; v: string }[] = [
  { title: 'Новый участок · ИЖС 12 соток', meta: 'Талгар, Алматинская обл.', v: '12,5 млн ₸' },
  { title: 'Цена снижена на 8%', meta: 'Каскелен · участок 10 соток', v: '−1,1 млн' },
  { title: '+312 просмотров за час', meta: 'Алматинская обл.', v: '' },
  { title: 'Добавлен в избранное', meta: 'Коммерция · Шымкент, объездная', v: '' },
  { title: 'Новый участок · у воды', meta: 'Капчагай, побережье', v: '24 млн ₸' },
  { title: 'Сделка закрыта', meta: 'Иссык · дача 8 соток', v: '' },
  { title: '+128 в поиске «ИЖС до 10 млн»', meta: 'за последний час', v: '' },
];

function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => setI(k => (k + 1) % FEED.length), 3600);
    return () => clearInterval(t);
  }, []);
  const e = FEED[i];
  return (
    <div className="bg-white border-b border-paper-3">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 h-12 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 shrink-0 mono text-[10px] uppercase tracking-[0.14em] font-semibold text-brand-700">
          <span className="live-dot"><span className="ping" /><span className="core" /></span>Live
        </span>
        <span className="w-px h-4 bg-paper-3 shrink-0" />
        <div key={i} className="feed-swap flex-1 min-w-0 flex items-center gap-2.5 overflow-hidden">
          <span className="font-semibold text-[13.5px] text-ink-900 truncate">{e.title}</span>
          <span className="text-ink-400 text-[12.5px] truncate hidden sm:inline">· {e.meta}</span>
          {e.v && <span className="ml-auto shrink-0 num font-bold text-[12.5px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{e.v}</span>}
        </div>
        <Link href="/catalog" className="shrink-0 mono text-[10px] uppercase tracking-[0.1em] text-ink-400 hover:text-brand-600 transition hidden sm:inline">Всё на карте →</Link>
      </div>
    </div>
  );
}

/* ═══════════════════════ МАСТЕР ПОДБОРА ═══════════════════════ */
type Sample = [string, string, string, string]; // [место, площадь, цена, ph-класс]
const GOALS: { id: string; label: string; sub: string; tone: string; base: number; type: string; samples: Sample[] }[] = [
  { id: 'dom', label: 'Построить дом', sub: 'ИЖС для постоянного проживания', tone: 'ph-plot', base: 612, type: 'izhs',
    samples: [['Каскелен · ИЖС', '10 соток', '12,5 млн ₸', 'ph-plot'], ['Талгар · ИЖС', '12 соток', '18 млн ₸', 'ph-plot'], ['Бесагаш · вид на горы', '9 соток', '24 млн ₸', 'ph-mountain']] },
  { id: 'dacha', label: 'Дача и отдых', sub: 'Садовые участки для сезона', tone: 'ph-grass', base: 208, type: 'dacha',
    samples: [['Иссык · дача', '8 соток', '9,8 млн ₸', 'ph-grass'], ['Тургень · сад', '6 соток', '6,5 млн ₸', 'ph-grass'], ['Капшагай · у воды', '15 соток', '24 млн ₸', 'ph-water']] },
  { id: 'business', label: 'Под бизнес', sub: 'Коммерческая земля под доход', tone: 'ph-rock', base: 236, type: 'kommertsiya',
    samples: [['Кордай · трасса', '12 соток', '45 млн ₸', 'ph-rock'], ['Шымкент · объездная', '25 соток', '60 млн ₸', 'ph-rock'], ['Алматы · БАКАД', '9 соток', '28 млн ₸', 'ph-soil']] },
  { id: 'invest', label: 'Инвестиции', sub: 'Купить сейчас — продать дороже', tone: 'ph-mountain', base: 142, type: '',
    samples: [['Или · массив', '20 соток', '32 млн ₸', 'ph-water'], ['БАКАД · под застройку', '30 соток', '54 млн ₸', 'ph-mountain'], ['Талгар · участок', '14 соток', '21 млн ₸', 'ph-plot']] },
  { id: 'farm', label: 'Фермерство', sub: 'Сельхоз и КХ, большие массивы', tone: 'ph-soil', base: 86, type: 'selhoz',
    samples: [['Енбекшиказахский · КХ', '2 га', '18 млн ₸', 'ph-soil'], ['Жамбылская обл · поле', '5 га', '30 млн ₸', 'ph-soil'], ['Или · поливная', '3 га', '22 млн ₸', 'ph-grass']] },
  { id: 'any', label: 'Пока не определился', sub: 'Показать все участки по бюджету', tone: 'ph-plot', base: 1284, type: '',
    samples: [['Каскелен · ИЖС', '10 соток', '12,5 млн ₸', 'ph-plot'], ['Иссык · дача', '8 соток', '9,8 млн ₸', 'ph-grass'], ['Капшагай · у воды', '15 соток', '24 млн ₸', 'ph-water']] },
];
const REGIONS = [
  { id: 'almaty_city', label: 'Алматы', f: 0.9 }, { id: 'astana_city', label: 'Астана', f: 0.6 },
  { id: 'shymkent_city', label: 'Шымкент', f: 0.4 }, { id: 'almaty_obl', label: 'Алматинская область', f: 1.0 },
  { id: 'jetisu', label: 'Жетысуская область', f: 0.3 }, { id: 'akmola', label: 'Акмолинская область', f: 0.34 },
  { id: 'aktobe', label: 'Актюбинская область', f: 0.3 }, { id: 'atyrau', label: 'Атырауская область', f: 0.24 },
  { id: 'west_kz', label: 'Западно-Казахстанская область', f: 0.24 }, { id: 'jambyl', label: 'Жамбылская область', f: 0.3 },
  { id: 'karaganda', label: 'Карагандинская область', f: 0.34 }, { id: 'ulytau', label: 'Улытауская область', f: 0.14 },
  { id: 'kostanay', label: 'Костанайская область', f: 0.28 }, { id: 'kyzylorda', label: 'Кызылординская область', f: 0.2 },
  { id: 'mangystau', label: 'Мангистауская область', f: 0.24 }, { id: 'pavlodar', label: 'Павлодарская область', f: 0.26 },
  { id: 'north_kz', label: 'Северо-Казахстанская область', f: 0.22 }, { id: 'turkistan', label: 'Туркестанская область', f: 0.3 },
  { id: 'east_kz', label: 'Восточно-Казахстанская область', f: 0.28 }, { id: 'abai', label: 'Область Абай', f: 0.18 },
  { id: 'all', label: 'Вся страна', f: 1.6 },
];
const PIN_D = 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z';

function QuizFinder() {
  const [step, setStep] = useState<1 | 2 | 3 | 'result'>(1);
  const [goal, setGoal] = useState<string | null>(null);
  const [budget, setBudget] = useState(15);
  const [region, setRegion] = useState<string | null>(null);
  const [ddOpen, setDdOpen] = useState(false);
  const [q, setQ] = useState('');
  const ddRef = useRef<HTMLDivElement>(null);
  const BUD_MAX = 200;

  useEffect(() => {
    if (!ddOpen) return;
    const h = (e: MouseEvent) => { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [ddOpen]);

  const budLabel = (v: number) => v >= BUD_MAX ? `от ${BUD_MAX} млн ₸` : `до ${v} млн ₸`;
  const budgetFactor = (v: number) => Math.min(1, Math.max(0.15, 0.15 + (v - 2) / (BUD_MAX - 2) * 0.85));
  const matchCount = () => {
    const g = GOALS.find(x => x.id === goal) || GOALS[0];
    const r = REGIONS.find(x => x.id === region) || { f: 0.9 };
    return Math.max(3, Math.round(g.base * r.f * budgetFactor(budget)));
  };
  const stepNum = step === 'result' ? 4 : step;
  const stepState = (n: number) => (step === 'result' || n < stepNum) ? 'done' : n === stepNum ? 'active' : '';
  const canNext = step === 1 ? !!goal : step === 3 ? !!region : true;
  const selRegion = REGIONS.find(x => x.id === region);
  const filtered = REGIONS.filter(r => r.label.toLowerCase().includes(q.trim().toLowerCase()));

  const goalObj = GOALS.find(x => x.id === goal) || GOALS[0];
  const catalogHref = `/catalog${goalObj.type ? `?type=${goalObj.type}` : ''}`;

  const goNext = () => {
    if (!canNext) return;
    if (step === 1) setStep(2); else if (step === 2) setStep(3); else if (step === 3) setStep('result');
  };
  const goBack = () => {
    if (step === 'result') setStep(3); else if (step === 3) setStep(2); else if (step === 2) setStep(1);
  };

  return (
    <div className="card overflow-hidden mt-8">
      <div className="flex items-start gap-3 sm:gap-6 px-6 sm:px-9 pt-7 pb-6 border-b border-paper-3">
        {[[1, 'Цель'], [2, 'Бюджет'], [3, 'Регион']].map(([nRaw, name]) => {
          const nn = nRaw as number; const s = stepState(nn);
          return (
            <div key={nn} className={`qz-step flex-1 min-w-0 ${s}`}>
              <div className="flex items-center gap-2.5">
                <span className="qz-step-num">{s === 'done' ? <Ic d={CHECK} w={12} sw={3} /> : <span>{nn}</span>}</span>
                <div className="min-w-0"><div className="mono text-[9px] uppercase tracking-[0.12em] text-ink-400 leading-none">Шаг {nn}</div><div className="qz-step-name font-bold text-[13.5px] tracking-tight leading-tight mt-1">{name}</div></div>
              </div>
              <div className="qz-step-bar mt-3 h-1 rounded-full" />
            </div>
          );
        })}
      </div>

      <div className="p-6 sm:p-9">
        {step === 1 && (
          <div className="fw-anim grid sm:grid-cols-2 gap-2.5">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)} className={`qz-opt text-left rounded-xl border p-4 flex items-center gap-3.5 transition bg-white ${goal === g.id ? 'border-brand-500 ring-2 ring-brand-100' : 'border-paper-3 hover:border-brand-300'}`}>
                <span className={`${g.tone} w-11 h-11 rounded-lg shrink-0 border border-black/5`} />
                <span className="min-w-0"><span className="block font-bold text-[14.5px] text-ink-900 tracking-tight">{g.label}</span><span className="block text-[12px] text-ink-500 leading-snug mt-0.5">{g.sub}</span></span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="fw-anim rounded-2xl border border-paper-3 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400">Бюджет</span>
              <span className="font-extrabold text-[24px] tracking-tighter text-brand-600 num">{budLabel(budget)}</span>
            </div>
            <input type="range" min={2} max={BUD_MAX} step={1} value={budget} onChange={e => setBudget(+e.target.value)} className="qz-range mt-4" />
            <div className="flex justify-between mono text-[10px] text-ink-400 mt-2"><span>2 млн</span><span>{BUD_MAX} млн+ ₸</span></div>
            <div className="mt-5 flex items-center gap-2 text-[13px] text-ink-500"><span className="live-dot"><span className="ping" /><span className="core" /></span><span>Примерно {fmtNum(matchCount())} участков в этом бюджете</span></div>
          </div>
        )}

        {step === 3 && (
          <div className="fw-anim relative" ref={ddRef}>
            <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400 mb-2">Регион поиска</div>
            <button type="button" onClick={() => { setDdOpen(o => !o); setQ(''); }} className={`w-full rounded-xl border ${selRegion ? 'border-brand-500' : 'border-paper-3'} bg-white px-4 h-14 flex items-center gap-3 text-left hover:border-brand-300 transition`}>
              <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><PinIcon /></span>
              <span className={`flex-1 min-w-0 truncate font-semibold text-[14.5px] ${selRegion ? 'text-ink-900' : 'text-ink-400'}`}>{selRegion ? selRegion.label : 'Выберите регион'}</span>
              <span className={`text-ink-400 transition-transform ${ddOpen ? 'rotate-180' : ''}`}><Ic d="m6 9 6 6 6-6" w={18} sw={2.2} /></span>
            </button>
            {ddOpen && (
              <div className="mt-2 rounded-xl border border-paper-3 bg-white overflow-hidden">
                <div className="p-2 border-b border-paper-3"><input autoFocus value={q} onChange={e => setQ(e.target.value)} type="text" placeholder="Поиск региона…" className="w-full h-10 px-3 rounded-lg bg-paper-2 text-[14px] text-ink-900 placeholder:text-ink-400 outline-none focus:ring-2 focus:ring-brand-100" /></div>
                <div className="max-h-[264px] overflow-y-auto py-1">
                  {filtered.length ? filtered.map(r => (
                    <button key={r.id} onClick={() => { setRegion(r.id); setDdOpen(false); }} className={`w-full text-left px-3 h-12 flex items-center gap-3 transition ${region === r.id ? 'bg-brand-50' : ''} hover:bg-paper-2`}>
                      <span className={`w-7 h-7 rounded-lg ${region === r.id ? 'bg-brand-100 text-brand-700' : 'bg-paper-2 text-ink-500'} flex items-center justify-center shrink-0`}><PinIcon /></span>
                      <span className="flex-1 min-w-0 truncate font-medium text-[14px] text-ink-900">{r.label}</span>
                      {region === r.id && <span className="text-brand-600"><Ic d={CHECK} w={16} sw={2.6} /></span>}
                    </button>
                  )) : <div className="px-4 py-6 text-center text-[13px] text-ink-400">Ничего не найдено</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'result' && (
          <div className="fw-anim">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div><div className="mono text-[10.5px] uppercase tracking-[0.1em] text-ink-400">Нашлось для вас</div>
                <div className="flex items-baseline gap-2 mt-1"><span className="font-black text-[40px] tracking-tighter text-brand-600 num">{fmtNum(matchCount())}</span><span className="text-[14px] text-ink-500">участков</span></div></div>
              <div className="text-right text-[12.5px] text-ink-500 max-w-[48%] leading-snug">{goalObj.label} · {budLabel(budget)}<br />{selRegion?.label}</div>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {goalObj.samples.map(s => (
                <Link key={s[0]} href={catalogHref} className="tile rounded-xl border border-paper-3 overflow-hidden bg-white hover:border-brand-300 transition">
                  <div className={`${s[3]} aspect-[16/10] relative`}><span className="absolute top-2 left-2 mono text-[9px] uppercase bg-white/80 px-1.5 py-0.5 rounded text-ink-600">{s[1]}</span></div>
                  <div className="p-3"><div className="font-extrabold tracking-tighter text-[15px] text-brand-600 num">{s[2]}</div><div className="text-[12px] text-ink-500 mt-0.5 truncate">{s[0]}</div></div>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <Link href={catalogHref} className="px-6 h-12 rounded-xl bg-brand-600 text-white font-semibold text-[14.5px] inline-flex items-center gap-2 hover:bg-brand-700 transition shadow-[0_12px_32px_-12px_rgba(6,111,54,.55)]">Смотреть все {fmtNum(matchCount())} <span>→</span></Link>
              <button onClick={() => { setStep(1); setGoal(null); setRegion(null); setBudget(15); }} className="px-4 h-12 rounded-xl border border-paper-3 text-ink-600 font-semibold text-[14px] hover:border-ink-400 transition">Начать заново</button>
            </div>
          </div>
        )}
      </div>

      {step !== 'result' && (
        <div className="px-6 sm:px-9 py-5 border-t border-paper-3 flex items-center justify-between gap-3">
          <button onClick={goBack} className={`px-4 h-11 rounded-xl border border-paper-3 text-ink-600 font-semibold text-[14px] hover:border-ink-400 transition inline-flex items-center gap-2 ${step === 1 ? 'invisible' : ''}`}><span>←</span> Назад</button>
          <button onClick={goNext} disabled={!canNext} className="px-6 h-11 rounded-xl bg-brand-600 text-white font-semibold text-[14px] hover:bg-brand-700 transition inline-flex items-center gap-2 disabled:opacity-45 disabled:pointer-events-none">{step === 3 ? 'Показать участки' : 'Далее'} <span>→</span></button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ СТРАНИЦА ═══════════════════════ */
export function HomeClient({ featured, landCount, businessCount, locationsCount }: Props) {
  return (
    <div className="home-scope bg-paper text-ink-900">
      <Hero featured={featured} landCount={landCount} />
      <Ticker />

      {/* 02 · Подбор участка */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="sec-label mb-4"><span className="sec-num">02</span><span className="sec-name">Подбор участка</span><span className="sec-rule" /></div>
          <div className="max-w-[900px]">
            <h2 className="font-extrabold tracking-tightest text-[28px] sm:text-[40px] leading-none text-ink-900">Подберём землю под вашу задачу</h2>
            <p className="mt-3 text-[14.5px] sm:text-[16px] text-ink-500 max-w-xl leading-snug">Мини-квиз вместо сложных фильтров: ответьте на пару вопросов — и сразу увидите готовую подборку участков из каталога под вашу задачу.</p>
          </div>
          <QuizFinder />
        </div>
      </section>

      {/* 03 · Продавцам */}
      <section className="bg-paper border-b border-paper-3 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="sec-label mb-9"><span className="sec-num">03</span><span className="sec-name">Продавцам</span><span className="sec-rule" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="font-extrabold tracking-tightest text-[30px] sm:text-[44px] leading-[0.97] text-ink-900">Разместить участок — 3 минуты с телефона</h2>
              <p className="mt-5 text-[16px] text-ink-600 leading-relaxed max-w-md">Заполняете короткую форму, публикуете — и заявки приходят напрямую вам в WhatsApp. Без посредников и без комиссии.</p>
              <ul className="mt-7 space-y-4 max-w-md">
                {[['01', 'Основные данные', 'Категория, площадь и цена — по пунктам, без лишних полей.'], ['02', 'Точка на карте и фото', 'Ставите метку участка и добавляете снимки прямо с камеры.'], ['03', 'Заявки в WhatsApp', 'Покупатель нажимает «Написать» — и пишет вам напрямую.']].map(([nn, tt, dd]) => (
                  <li key={nn} className="flex gap-3.5">
                    <span className="mono text-[12px] font-bold text-brand-600 pt-0.5 shrink-0">{nn}</span>
                    <div><div className="font-bold text-[15px] text-ink-900 tracking-tight">{tt}</div><p className="text-[13.5px] text-ink-500 leading-snug mt-0.5">{dd}</p></div>
                  </li>
                ))}
              </ul>
              <Link href="/add-listing" className="mt-8 inline-flex px-6 h-13 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-[15px] hover:bg-brand-700 transition items-center gap-2 shadow-[0_12px_32px_-12px_rgba(6,111,54,.55)]">Разместить бесплатно <span>→</span></Link>
            </div>
            <div className="justify-self-center flex items-start gap-4 sm:gap-6">
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="px-4 pt-9 pb-3 bg-white border-b border-paper-3 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-500 border border-paper-3"><Ic d="M15 18l-6-6 6-6" w={15} sw={2.2} /></span>
                    <div className="flex-1"><div className="text-[13.5px] font-bold text-ink-900 tracking-tight">Новое объявление</div><div className="mono text-[9px] uppercase tracking-wider text-ink-400 mt-0.5">шаг 1 из 3 · основное</div></div>
                    <span className="mono text-[10px] font-bold text-brand-600">33%</span>
                  </div>
                  <div className="h-1 bg-paper-2"><div className="h-full bg-brand-600" style={{ width: '33%' }} /></div>
                  <div className="p-4 space-y-3.5 bg-paper/40" style={{ height: 428, overflow: 'hidden' }}>
                    <div>
                      <div className="mono text-[9.5px] uppercase tracking-wide text-ink-400 mb-1.5">Категория земли</div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-3 h-8 rounded-lg bg-brand-600 text-white text-[12px] font-semibold flex items-center">ИЖС</span>
                        <span className="px-3 h-8 rounded-lg bg-white border border-paper-3 text-ink-600 text-[12px] font-semibold flex items-center">ЛПХ</span>
                        <span className="px-3 h-8 rounded-lg bg-white border border-paper-3 text-ink-600 text-[12px] font-semibold flex items-center">Коммерция</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div><div className="mono text-[9.5px] uppercase tracking-wide text-ink-400 mb-1.5">Площадь</div><div className="h-10 rounded-lg bg-white border border-paper-3 px-3 flex items-center justify-between"><span className="text-[13px] font-semibold text-ink-900 num">12</span><span className="text-[11px] text-ink-400">соток</span></div></div>
                      <div><div className="mono text-[9.5px] uppercase tracking-wide text-ink-400 mb-1.5">Цена, ₸</div><div className="h-10 rounded-lg bg-white border-2 border-brand-500 px-3 flex items-center shadow-[0_0_0_3px_rgba(6,111,54,.1)]"><span className="text-[13px] font-semibold text-ink-900 num">12 500 000</span><span className="w-px h-4 bg-brand-500 ml-0.5 cursor-blink" /></div></div>
                    </div>
                    <div>
                      <div className="mono text-[9.5px] uppercase tracking-wide text-ink-400 mb-1.5">Точка на карте</div>
                      <div className="map-bg relative h-24 rounded-xl border border-paper-3 overflow-hidden">
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full"><svg viewBox="0 0 24 24" width="24" height="24" fill="#066F36" stroke="#fff" strokeWidth="1.5"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2.4" fill="#fff" /></svg></span>
                        <span className="absolute bottom-1.5 left-1.5 mono text-[8.5px] uppercase bg-white/80 px-1.5 py-0.5 rounded text-ink-500">Талгар</span>
                      </div>
                    </div>
                    <div>
                      <div className="mono text-[9.5px] uppercase tracking-wide text-ink-400 mb-1.5">Фото участка</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="ph-plot aspect-square rounded-lg" />
                        <div className="ph-grass aspect-square rounded-lg" />
                        <div className="aspect-square rounded-lg border border-dashed border-paper-3 bg-white flex items-center justify-center text-ink-300"><Ic d="M12 5v14M5 12h14" w={16} sw={2} /></div>
                        <div className="aspect-square rounded-lg border border-dashed border-paper-3 bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-0 right-0 bottom-0 p-3.5 bg-white border-t border-paper-3">
                    <div className="relative h-11 rounded-xl bg-brand-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2">Далее · фото и карта <span>→</span><span className="tap-ring" /></div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex flex-col gap-3 pt-14 w-[172px]">
                <div className="wa-toast card p-3.5 flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: '#25D366' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d={WA_FULL} /></svg></span>
                  <div><div className="text-[11.5px] font-bold text-ink-900 leading-tight">Новая заявка</div><div className="text-[10.5px] text-ink-500 leading-snug mt-0.5">«Здравствуйте! Участок ещё актуален?»</div></div>
                </div>
                <div className="text-center mono text-[9px] uppercase tracking-wider text-ink-400">напрямую вам,<br />без комиссии</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04 · Агентствам */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="sec-label mb-9"><span className="sec-num">04</span><span className="sec-name">Агентствам</span><span className="sec-rule" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="font-extrabold tracking-tightest text-[28px] sm:text-[42px] leading-[0.97] text-ink-900">Витрина агентства — без своего сайта</h2>
              <p className="mt-4 text-[15.5px] sm:text-[16px] text-ink-600 leading-relaxed max-w-lg">Все ваши объявления на одной странице — с логотипом, названием и контактами. Клиенты видят бренд, а лиды идут напрямую вам.</p>
              <ul className="mt-6 space-y-3.5">
                <li className="flex items-start gap-3 text-[15px] text-ink-700"><span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5"><Ic d={CHECK} w={11} sw={2.6} /></span><span className="min-w-0">Персональная ссылка <span className="mono text-[13px] text-brand-600 break-all">6sotok.kz/agency/name</span></span></li>
                <li className="flex items-center gap-3 text-[15px] text-ink-700"><span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0"><Ic d={CHECK} w={11} sw={2.6} /></span>Логотип, описание и единый контакт агентства</li>
                <li className="flex items-center gap-3 text-[15px] text-ink-700"><span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0"><Ic d={CHECK} w={11} sw={2.6} /></span>Массовая загрузка и статистика по показам</li>
              </ul>
              <Link href="/b2b" className="mt-8 inline-flex px-6 h-13 py-3.5 rounded-xl text-white font-semibold text-[15px] items-center gap-2 hover:bg-brand-600 transition" style={{ background: '#14160f' }}>Получить витрину <span>→</span></Link>
            </div>
            <div className="tile card overflow-hidden min-w-0">
              <div className="h-10 border-b border-paper-3 flex items-center gap-1.5 px-4">
                <span className="w-2.5 h-2.5 rounded-full bg-paper-3" /><span className="w-2.5 h-2.5 rounded-full bg-paper-3" /><span className="w-2.5 h-2.5 rounded-full bg-paper-3" />
                <span className="ml-3 min-w-0 truncate mono text-[11.5px] text-ink-500">6sotok.kz/agency/jer-invest</span>
                <span className="ml-auto hidden sm:inline-flex items-center gap-1 mono text-[10px] uppercase tracking-wide text-brand-600"><span className="w-1.5 h-1.5 rounded-full bg-brand-500" />verified</span>
              </div>
              <div className="ph-mountain relative h-24 border-b border-paper-3"><div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(6,111,54,0.05),rgba(20,22,15,0.28))' }} /></div>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-8 relative">
                <div className="flex items-end gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-[24px] tracking-tighter shrink-0 border-4 border-white shadow-sm">Ji</div>
                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2"><span className="font-extrabold tracking-tighter text-[20px] text-ink-900">Jer Invest</span><span className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0"><Ic d={CHECK} w={10} sw={3} /></span></div>
                    <div className="text-[12.5px] text-ink-500 mt-0.5">Земельное агентство · Алматы</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 rounded-xl border border-paper-3 overflow-hidden divide-x divide-paper-3">
                  <div className="px-3 py-2.5 text-center"><div className="font-extrabold text-[17px] tracking-tighter text-ink-900 num leading-none">128</div><div className="mono text-[8.5px] uppercase tracking-wide text-ink-400 mt-1">участков</div></div>
                  <div className="px-3 py-2.5 text-center"><div className="font-extrabold text-[17px] tracking-tighter text-ink-900 num leading-none">4,9</div><div className="mono text-[8.5px] uppercase tracking-wide text-ink-400 mt-1">★ рейтинг</div></div>
                  <div className="px-3 py-2.5 text-center"><div className="font-extrabold text-[17px] tracking-tighter text-brand-600 num leading-none">312</div><div className="mono text-[8.5px] uppercase tracking-wide text-ink-400 mt-1">сделок</div></div>
                </div>
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  <span className="px-2.5 h-7 rounded-full bg-brand-600 text-white text-[11px] font-semibold flex items-center">Все 128</span>
                  <span className="px-2.5 h-7 rounded-full bg-white border border-paper-3 text-ink-600 text-[11px] font-semibold flex items-center">ИЖС</span>
                  <span className="px-2.5 h-7 rounded-full bg-white border border-paper-3 text-ink-600 text-[11px] font-semibold flex items-center">Коммерция</span>
                  <span className="px-2.5 h-7 rounded-full bg-white border border-paper-3 text-ink-600 text-[11px] font-semibold flex items-center">У воды</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[['ph-plot', '10 сот.', '12,5 млн', 'Каскелен, ИЖС'], ['ph-grass', '8 сот.', '9,8 млн', 'Иссык, дача'], ['ph-water', '15 сот.', '24 млн', 'Капчагай']].map(([cls, area, price, loc]) => (
                    <div key={loc} className="rounded-xl border border-paper-3 bg-white overflow-hidden">
                      <div className={`${cls} aspect-[4/3] relative`}><span className="absolute top-1.5 left-1.5 mono text-[8.5px] text-ink-600 uppercase bg-white/75 px-1.5 py-0.5 rounded">{area}</span></div>
                      <div className="p-2.5"><div className="font-extrabold tracking-tighter text-[13px] text-brand-600 num">{price}</div><div className="text-[10.5px] text-ink-500 mt-0.5 truncate">{loc}</div></div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-paper/60 border border-paper-3 p-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: '#25D366' }}><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20z" /></svg></span>
                  <div className="flex-1 min-w-0"><div className="text-[12.5px] font-bold text-ink-900 leading-tight">Единый контакт агентства</div><div className="text-[11px] text-ink-500">Лиды идут напрямую вам</div></div>
                  <span className="px-3 h-8 rounded-lg bg-brand-600 text-white text-[12px] font-semibold flex items-center shrink-0">Написать</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 · Готовый бизнес */}
      <section className="border-b" style={{ background: 'linear-gradient(180deg,#fbf8ee,#f8f2e2)', borderColor: '#ece2c6' }}>
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="sec-label mb-9"><span className="sec-num" style={{ color: '#a8801a' }}>05</span><span className="sec-name">Готовый бизнес</span><span className="sec-rule" style={{ background: '#ece2c6' }} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="font-extrabold tracking-tightest text-[30px] sm:text-[44px] leading-[0.97] text-ink-900">Готовый бизнес под ключ</h2>
              <p className="mt-5 text-[16px] text-ink-600 leading-relaxed max-w-md">Действующие бизнесы с оборудованием, клиентами и выручкой — автомойки, кафе, магазины и другое. С помещением или без него — на ваш выбор.</p>
              <ul className="mt-7 space-y-4 max-w-md">
                {['С оборудованием, персоналом и клиентами', 'Продаётся с недвижимостью или без неё', 'Фильтры по типу бизнеса и обороту'].map(txt => (
                  <li key={txt} className="flex items-center gap-3 text-[15px] text-ink-700"><span className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0" style={{ background: '#a8801a' }}><Ic d={CHECK} w={11} sw={2.6} /></span>{txt}</li>
                ))}
              </ul>
              <Link href="/business" className="mt-8 inline-flex px-6 h-13 py-3.5 rounded-xl text-white font-semibold text-[15px] items-center gap-2 hover:opacity-90 transition" style={{ background: '#3a2f16' }}>Смотреть готовый бизнес <span>→</span></Link>
            </div>
            <div className="tile card overflow-hidden min-w-0" style={{ borderColor: '#ece2c6' }}>
              <div className="px-6 sm:px-7 py-5 flex items-center gap-4" style={{ background: 'linear-gradient(180deg,#fbf8ee,#f8f2e2)', borderBottom: '1px solid #ece2c6' }}>
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: '#3a2f16' }}><Ic d="M4 8h16v12H4zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16" w={22} sw={1.9} /></span>
                <div className="flex-1 min-w-0"><div className="mono text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: '#a8801a' }}>Раздел каталога</div><div className="font-extrabold tracking-tighter text-[24px] text-ink-900 leading-none mt-1">Готовый бизнес</div></div>
                <div className="text-right shrink-0"><div className="font-extrabold text-[22px] tracking-tighter num leading-none text-ink-900">{businessCount || 0}</div><div className="mono text-[9px] uppercase tracking-wide text-ink-400 mt-1">объектов</div></div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {[['Автомойки и СТО', 'ph-rock', '64'], ['Кафе и рестораны', 'ph-rock', '52'], ['Магазины и аптеки', 'ph-soil', '38'], ['Гостиницы и базы', 'ph-grass', '60']].map(([name, cls, count]) => (
                  <div key={name} className={`${cls} relative h-[62px] rounded-lg overflow-hidden flex items-end`} style={{ border: '1px solid #ece2c6' }}>
                    <span className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-ink-900 bg-white/85 backdrop-blur px-1.5 py-0.5 rounded truncate">{name}</span>
                      <span className="mono text-[9.5px] font-semibold text-ink-600 bg-white/85 backdrop-blur px-1 py-0.5 rounded num shrink-0">{count}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 -mt-1">
                <div className="flex items-center justify-between rounded-lg px-3 h-10" style={{ background: '#fbf8ee', border: '1px solid #ece2c6' }}>
                  <span className="text-[12px] text-ink-600">Салоны, пекарни и другое — тоже в разделе</span>
                  <Link href="/business" className="mono text-[11px] font-semibold" style={{ color: '#a8801a' }}>Все →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 · Журнал */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="sec-label mb-4"><span className="sec-num">06</span><span className="sec-name">Журнал</span><span className="sec-rule" /></div>
          <div className="flex items-end justify-between gap-6 flex-wrap mb-9">
            <h2 className="font-extrabold tracking-tightest text-[28px] sm:text-[40px] leading-none text-ink-900">Разбираемся в земле</h2>
            <a href="#" className="text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition flex items-center gap-1.5 mb-1">Все статьи <span>→</span></a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-14">
            <a href="#" className="tile group flex flex-col rounded-2xl overflow-hidden card">
              <div className="ph-plot aspect-[16/8] relative"><span className="absolute bottom-3 left-3 mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">разбор</span></div>
              <div className="p-7">
                <div className="mono text-[11px] uppercase tracking-[0.08em] text-brand-600">Право · 6 минут</div>
                <div className="mt-3 font-extrabold tracking-tighter text-[23px] sm:text-[28px] text-ink-900 leading-tight">ИЖС или ЛПХ: чем отличаются и что можно строить</div>
                <p className="mt-3 text-[14.5px] text-ink-600 leading-snug max-w-lg">Категория земли решает всё — от этажности дома до подключения газа. Объясняем на примерах, без юридического языка.</p>
              </div>
            </a>
            <div className="flex flex-col divide-y divide-paper-3 border-y border-paper-3">
              {[['01', 'Проверка', '5 документов, которые стоит проверить перед покупкой'], ['02', 'Стройка', 'Что такое красная линия и как она ограничивает стройку'], ['03', 'Документы', 'Перевод земли под коммерцию: сколько стоит и сколько ждать'], ['04', 'Кадастр', 'Как проверить кадастровый номер за 2 минуты']].map(([nn, tag, title]) => (
                <a key={nn} href="#" className="tile group py-5 flex items-start gap-4 hover:pl-1 transition-all">
                  <span className="mono text-[12px] text-ink-400 pt-1">{nn}</span>
                  <div><div className="mono text-[10.5px] uppercase tracking-[0.08em] text-ink-500 mb-1.5">{tag}</div><div className="font-bold text-[16.5px] text-ink-900 tracking-tight leading-snug group-hover:text-brand-600 transition">{title}</div></div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
