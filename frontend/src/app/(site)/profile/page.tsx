'use client'

/* Личный кабинет продавца — порт макета «Дизайн html/Личный кабинет/».
   Моно-палитра + один зелёный акцент. Токены/.mono — из globals + cabinet.css.
   Боевое: auth-guard, реальные объявления (Мои объявления), настройки, выход.
   Демо (нет бэкенда): продвижение, услуги, заявки, баланс, аналитика — как в макете. */

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import './cabinet.css'

/* ── money ── */
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const KZT = ({ v, per, sub }: { v: number; per?: string; sub?: boolean }) => (
  <span className="mono" style={{ whiteSpace: 'nowrap', color: sub ? 'var(--ink-400)' : 'inherit', fontWeight: sub ? 500 : 700, letterSpacing: '.01em' }}>
    {fmt(v)}<span style={{ opacity: .7, marginLeft: 2 }}>₸</span>{per && <span style={{ color: 'var(--ink-400)', fontWeight: 500 }}>{per}</span>}
  </span>
)

/* ── icon set — clean 1.6px line SVGs (из макета) ── */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const ICONS: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...P} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...P} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...P} /></>,
  rocket: <><path d="M5 15c-1.5 1-2 4-2 4s3-.5 4-2c.6-.9.5-2-.3-2.7-.8-.8-1.9-.9-1.7.7Z" {...P} /><path d="M9 12c3-6 7-9 12-9 0 5-3 9-9 12l-3-3Z" {...P} /><path d="M9 12l-4 1M12 15l-1 4" {...P} /><circle cx="15" cy="9" r="1.4" {...P} /></>,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" {...P} /><path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" {...P} /></>,
  drone: <><rect x="9" y="10" width="6" height="4" rx="1" {...P} /><path d="M9 11L4 8M15 11l5-3M9 13l-5 3M15 13l5 3" {...P} /><circle cx="4" cy="7.5" r="2" {...P} /><circle cx="20" cy="7.5" r="2" {...P} /><circle cx="4" cy="16.5" r="2" {...P} /><circle cx="20" cy="16.5" r="2" {...P} /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2" {...P} /><path d="M15 10l6-3v10l-6-3" {...P} /><circle cx="9" cy="12" r="2.2" {...P} /></>,
  target: <><circle cx="12" cy="12" r="8" {...P} /><circle cx="12" cy="12" r="4.5" {...P} /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" {...P} /><circle cx="12" cy="13" r="3.3" {...P} /></>,
  ruler: <><rect x="3" y="8" width="18" height="8" rx="1.5" {...P} /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" {...P} /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" {...P} /><path d="M9 12l2 2 4-4" {...P} /></>,
  scale: <><path d="M12 3v18M7 21h10M6 7h12M6 7l-3 6h6l-3-6ZM18 7l-3 6h6l-3-6Z" {...P} /></>,
  handshake: <><path d="M8 12l2.5 2.5a1.5 1.5 0 0 0 2.1 0l3.4-3.4L20 14M3 9l3-2 4 2M21 9l-3-2-3 1.5" {...P} /><path d="M12 8.5l-2 2a1.4 1.4 0 0 0 2 2" {...P} /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" {...P} /><path d="M3 10h18M16 14.5h2" {...P} /></>,
  chart: <><path d="M4 20V4M4 20h16" {...P} /><rect x="7" y="12" width="3" height="5" rx=".5" fill="currentColor" stroke="none" /><rect x="12" y="8" width="3" height="9" rx=".5" fill="currentColor" stroke="none" /><rect x="17" y="10" width="3" height="7" rx=".5" fill="currentColor" stroke="none" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" {...P} /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...P} /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" {...P} />,
  bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" {...P} />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...P} />,
  arrowDn: <path d="M12 5v14M6 13l6 6 6-6" {...P} />,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" {...P} /><circle cx="12" cy="10" r="2.4" {...P} /></>,
  eye: <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" {...P} /><circle cx="12" cy="12" r="2.8" {...P} /></>,
  phone: <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6l1.5-2 5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z" {...P} />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" {...P} />,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...P} /><path d="M10 20a2 2 0 0 0 4 0" {...P} /></>,
  plus: <path d="M12 5v14M5 12h14" {...P} />,
  check: <path d="M5 12l5 5 9-10" {...P} />,
  clock: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 7v5l3.5 2" {...P} /></>,
  dots: <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" {...P} /><path d="M14 5l4 4" {...P} /></>,
  cart: <><circle cx="9" cy="20" r="1.5" {...P} /><circle cx="18" cy="20" r="1.5" {...P} /><path d="M2 3h3l2.5 13h11l2-9H6" {...P} /></>,
  doc: <><path d="M6 3h8l4 4v14H6V3Z" {...P} /><path d="M14 3v4h4M9 12h6M9 16h6" {...P} /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" {...P} />,
  x: <path d="M6 6l12 12M18 6L6 18" {...P} />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" {...P} /></>,
}
const Ic = ({ n, s = 20, c, style }: { n: string; s?: number; c?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} style={{ color: c || 'currentColor', flexShrink: 0, display: 'block', ...style }}>{ICONS[n]}</svg>
)

/* ── button ── */
const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 10, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, letterSpacing: '-.01em', border: '1px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .1s, box-shadow .15s, background .15s' }
const BTN_V: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--ink-900)', color: '#fff' },
  brand: { background: 'var(--brand)', color: '#fff', boxShadow: '0 8px 22px -10px rgba(6,111,54,.6)' },
  ghost: { background: '#fff', color: 'var(--ink-900)', borderColor: 'var(--line)' },
  soft: { background: 'var(--paper-2)', color: 'var(--ink-900)' },
  ink: { background: 'var(--brand-ink)', color: '#fff' },
}
const Btn = ({ variant = 'ghost', icon, children, size, style, onClick, disabled }: { variant?: string; icon?: string; children?: React.ReactNode; size?: 'sm' | 'lg'; style?: React.CSSProperties; onClick?: () => void; disabled?: boolean }) => {
  const sz: React.CSSProperties = size === 'sm' ? { height: 32, padding: '0 12px', fontSize: 12.5, borderRadius: 9 } : size === 'lg' ? { height: 46, padding: '0 22px', fontSize: 15 } : {}
  return <button onClick={onClick} disabled={disabled} style={{ ...btnBase, ...BTN_V[variant], ...sz, ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}), ...style }}>{icon && <Ic n={icon} s={size === 'sm' ? 15 : 17} />}{children}</button>
}

/* ── eyebrow tag (mono) ── */
const Tag = ({ children, tone }: { children: React.ReactNode; tone?: string }) => (
  <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 6, fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', background: tone === 'green' ? 'var(--brand-50)' : 'var(--paper-2)', color: tone === 'green' ? 'var(--brand)' : 'var(--ink-400)', border: tone === 'green' ? '1px solid var(--brand-100)' : '1px solid var(--line)' }}>{children}</span>
)

/* ── status / meta chip ── */
const Badge = ({ children, tone = 'mute', dot, icon }: { children: React.ReactNode; tone?: string; dot?: boolean; icon?: string }) => {
  const S: React.CSSProperties = {
    green: { background: 'var(--brand-50)', color: 'var(--brand)', border: '1px solid var(--brand-100)' },
    solidgreen: { background: 'var(--brand)', color: '#fff', border: '1px solid var(--brand)' },
    ink: { background: 'var(--ink-900)', color: '#fff', border: '1px solid var(--ink-900)' },
    mute: { background: 'var(--paper-2)', color: 'var(--ink-500)', border: '1px solid var(--line)' },
    line: { background: '#fff', color: 'var(--ink-500)', border: '1px solid var(--line)' },
  }[tone] as React.CSSProperties
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: icon ? '0 9px 0 7px' : '0 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, letterSpacing: '-.005em', ...S }}>{dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor' }} />}{icon && <Ic n={icon} s={13} />}{children}</span>
}

/* ── filter chip ── */
const Chip = ({ label, count, active, onClick }: { label: string; count?: number; active?: boolean; onClick?: () => void }) => (
  <button onClick={onClick} style={{ flexShrink: 0, height: 34, padding: '0 13px', borderRadius: 999, border: active ? '1px solid var(--ink-900)' : '1px solid var(--line)', background: active ? 'var(--ink-900)' : '#fff', color: active ? '#fff' : 'var(--ink-700)', fontSize: 12.5, fontWeight: 600, letterSpacing: '-.005em', display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
    {label}
    {count != null && <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: active ? 'rgba(255,255,255,.7)' : 'var(--ink-400)' }}>{count}</span>}
  </button>
)

/* ── toggle ── */
const Toggle = ({ on, onClick }: { on: boolean; onClick?: () => void }) => (
  <button onClick={onClick} style={{ position: 'relative', width: 40, height: 24, borderRadius: 99, border: 'none', background: on ? 'var(--brand)' : '#d4d4d8', cursor: 'pointer', flexShrink: 0, transition: 'background .18s', padding: 0 }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 18, height: 18, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.28)', transition: 'left .18s' }} />
  </button>
)

/* ── аватар пользователя: реальная картинка или инициалы ── */
const Ava = ({ url, initials, size = 44, fontSize = 16 }: { url?: string; initials: string; size?: number; fontSize?: number }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: 'var(--brand-ink)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
    {url
      ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : initials}
  </span>
)

/* ── plot thumbnail (map-ish gradient block, либо реальное фото) ── */
const THUMB = ['linear-gradient(135deg,#dfe6d8,#c6d2bb)', 'linear-gradient(135deg,#e3ddd0,#cdc3ad)', 'linear-gradient(135deg,#d6e0dc,#b9c9c1)', 'linear-gradient(135deg,#e5e2da,#d0ccc0)']
const Thumb = ({ i = 0, size = 56, r = 10, star, url }: { i?: number; size?: number; r?: number; star?: boolean; url?: string }) => (
  <div style={{ width: size, height: size, borderRadius: r, background: url ? '#e6e7e1' : THUMB[i % 4], position: 'relative', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(9,9,11,.06)' }}>
    {url
      ? (/\.(mp4|mov|webm)$/i.test(url)
        ? <video src={url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Image src={url} alt="" fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />)
      : <svg viewBox="0 0 56 56" width={size} height={size} style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="none">
          <polygon points="14,18 40,12 46,30 34,44 16,40" fill="rgba(6,111,54,.16)" stroke="#066F36" strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>}
    {star && <span style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: 99, background: 'var(--brand)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="star" s={9} /></span>}
  </div>
)

/* =====================================================================
   DATA
===================================================================== */
const NAV = [
  { key: 'listings', label: 'Мои объявления', icon: 'grid' },
  { key: 'promote', label: 'Продвижение', icon: 'rocket' },
  { key: 'services', label: 'Доп. услуги', icon: 'sparkle' },
  { key: 'orders', label: 'Заявки на услуги', icon: 'doc', count: 4 },
  { key: 'balance', label: 'Баланс и платежи', icon: 'wallet' },
  { key: 'analytics', label: 'Аналитика', icon: 'chart' },
  { key: 'settings', label: 'Настройки', icon: 'gear' },
] as const

const STATUS_META: Record<string, { label: string; tone: string; dot?: boolean }> = {
  active: { label: 'Активно', tone: 'green', dot: true },
  moderation: { label: 'На модерации', tone: 'mute', dot: true },
  archived: { label: 'В архиве', tone: 'line' },
  draft: { label: 'Черновик', tone: 'line' },
}

/* платные метки — Реклама, Срочно, Снижение цены (демо) */
const BOOSTS = [
  { key: 'ad', name: 'Метка «Реклама»', desc: 'Обязательная тихая метка продвижения + выше в выдаче.', price: 2900, unit: '/нед', icon: 'sparkle', chip: 'ad' },
  { key: 'urgent', name: 'Метка «Срочно»', desc: 'Единственный кричащий элемент — чёрная метка на фото.', price: 1900, unit: '/нед', icon: 'bolt', chip: 'urgent' },
  { key: 'drop', name: 'Снижение цены', desc: 'Старая цена перечёркнута, новая — со скидкой в процентах.', price: 990, unit: 'разово', icon: 'arrowDn', chip: 'drop' },
]

/* дополнительные услуги (демо) */
const SERVICES = [
  { key: 'video', name: 'Видео-ролик участка', icon: 'drone', tone: 'feat', desc: 'Съёмка квадрокоптером + анимация облёта участка с профессиональной озвучкой. Готовый ролик 40–60 сек для объявления и соцсетей.', price: 35000, unit: 'от', tags: ['Квадрокоптер', 'Анимация облёта', 'Озвучка'], cta: 'cart', eta: '3–5 дней', sub: undefined as string | undefined, priceText: undefined as string | undefined },
  { key: 'ads', name: 'Реклама в Instagram', icon: 'target', desc: 'Таргет в Instagram на ваш участок. Объявление ведёт на карточку 6соток или прямо в WhatsApp. Аудитории, креативы, оптимизация.', price: 40000, unit: 'от', tags: ['Instagram', 'Таргет', 'WhatsApp'], sub: '+ рекламный бюджет', cta: 'cart', eta: 'запуск за 2 дня', tone: undefined as string | undefined, priceText: undefined as string | undefined },
  { key: 'realtor', name: 'Продажа «под ключ»', icon: 'handshake', desc: 'Реалтор берёт сделку на себя: показы, переговоры, торг, оформление и сопровождение до подписи. Вы получаете деньги.', price: null as number | null, priceText: 'комиссия 1.5%', tags: ['Показы', 'Переговоры', 'Оформление'], cta: 'request', eta: 'звонок сегодня', tone: undefined as string | undefined, unit: '', sub: undefined as string | undefined },
  { key: 'survey', name: 'Замер и межевание', icon: 'ruler', desc: 'Геодезист выезжает на участок, уточняет границы и площадь, готовит межевой план.', price: 45000, unit: 'от', tags: ['Геодезия', 'Границы', 'Межевой план'], cta: 'request', eta: '5–7 дней', tone: undefined as string | undefined, sub: undefined as string | undefined, priceText: undefined as string | undefined },
  { key: 'legal', name: 'Юридическая проверка', icon: 'shield', desc: 'Проверка документов, обременений и истории участка. Заключение о чистоте сделки.', price: 25000, unit: 'от', tags: ['Документы', 'Обременения', 'Заключение'], cta: 'cart', eta: '2–3 дня', tone: undefined as string | undefined, sub: undefined as string | undefined, priceText: undefined as string | undefined },
  { key: 'valuation', name: 'Оценка рыночной стоимости', icon: 'scale', desc: 'Анализ сопоставимых продаж и факторов участка. Обоснованная цена для быстрой продажи.', price: 15000, unit: 'от', tags: ['Анализ рынка', 'Отчёт'], cta: 'cart', eta: '1–2 дня', tone: undefined as string | undefined, sub: undefined as string | undefined, priceText: undefined as string | undefined },
]

/* заявки на услуги (демо) */
const ORDERS = [
  { id: 'S-1042', service: 'Видео-ролик участка', icon: 'drone', plot: '№28402 · Иссык, 20 сот', date: '12 июл', sum: 35000, sumText: '', status: 'work', person: 'Оператор Данияр' },
  { id: 'S-1038', service: 'Реклама в Instagram', icon: 'target', plot: '№28471 · Талгар, 12 сот', date: '09 июл', sum: 40000, sumText: '', status: 'accepted', person: 'Маркетолог Асель' },
  { id: 'S-1031', service: 'Юридическая проверка', icon: 'shield', plot: '№28390 · Каскелен', date: '04 июл', sum: 25000, sumText: '', status: 'done', person: 'Юрист Ержан' },
  { id: 'S-1024', service: 'Продажа «под ключ»', icon: 'handshake', plot: '№28210 · Капшагай', date: '28 июн', sum: 0, sumText: 'комиссия 1.5%', status: 'new', person: 'ждёт назначения' },
]
const ORDER_STATUS: Record<string, { label: string; tone: string; step: number }> = {
  new: { label: 'Новая', tone: 'line', step: 0 },
  accepted: { label: 'Принята', tone: 'green', step: 1 },
  work: { label: 'В работе', tone: 'ink', step: 2 },
  done: { label: 'Готово', tone: 'solidgreen', step: 3 },
  cancelled: { label: 'Отменена', tone: 'mute', step: -1 },
}
const ORDER_STEPS = ['Новая', 'Принята', 'В работе', 'Готово']

/* транзакции (демо) */
const TXNS0 = [
  { t: 'in' as const, label: 'Пополнение · Kaspi', date: '12 июл, 14:20', v: 30000 },
  { t: 'out' as const, label: 'Видео-ролик участка №28402', date: '12 июл, 14:22', v: 35000 },
  { t: 'out' as const, label: 'Турбо · №28402 (1 нед)', date: '10 июл, 09:11', v: 12900 },
  { t: 'in' as const, label: 'Пополнение · Visa •• 4417', date: '05 июл, 18:40', v: 50000 },
  { t: 'out' as const, label: 'Метка «Реклама» · №28471', date: '03 июл, 12:05', v: 2900 },
]
const TOPUPS = [10000, 25000, 50000, 100000]

/* аналитика (демо) */
const ANALYTICS = {
  kpis: [
    { label: 'Просмотры', v: 7032, d: '+18%', icon: 'eye' },
    { label: 'Звонки', v: 74, d: '+9%', icon: 'phone' },
    { label: 'В избранном', v: 163, d: '+24%', icon: 'bookmark' },
    { label: 'Показы в выдаче', v: 41200, d: '+12%', icon: 'chart' },
  ],
  week: [
    { d: 'Пн', v: 62 }, { d: 'Вт', v: 78 }, { d: 'Ср', v: 54 }, { d: 'Чт', v: 91 },
    { d: 'Пт', v: 100 }, { d: 'Сб', v: 84 }, { d: 'Вс', v: 47 },
  ],
  byListing: [
    { title: '№28402 · Иссык', views: 2210, calls: 39, pct: 100 },
    { title: '№28471 · Талгар', views: 1842, calls: 24, pct: 83 },
    { title: '№28390 · Каскелен', views: 980, calls: 11, pct: 44 },
  ],
}

/* =====================================================================
   TYPES
===================================================================== */
interface CartItem { key: string; name: string; price: number; unit: string }
interface Txn { t: 'in' | 'out'; label: string; date: string; v: number }
interface Row {
  id: string; status: 'active' | 'moderation' | 'archived' | 'draft'
  title: string; meta: string; price: number; per: number
  thumb: number; thumbUrl?: string; views: number; calls: number; saves: number
  oldPrice?: number; promo: string[]; days: number; sold?: boolean; editHref: string
}
interface Store {
  tab: string; setTab: (t: string) => void
  cart: CartItem[]; cartOpen: boolean; setCartOpen: (b: boolean) => void
  balance: number; txns: Txn[]
  addToCart: (i: CartItem) => void; removeFromCart: (k: string) => void
  topup: (a: number) => void; checkout: () => void
  listings: Row[]; counts: Record<string, number>; listingsLoading: boolean
  user: { name: string; initials: string; phone?: string; email: string; city?: string; isAgency?: boolean; since: string; avatarUrl?: string }
  go: (href: string) => void; signOut: () => void
  updateUser: (f: { name?: string; phone?: string }) => Promise<void>
  updateAvatar: (file: File) => Promise<void>
  /** Применяет промо к объявлению (PATCH промо-полей) и списывает цену с баланса. */
  applyPromo: (listingId: string, patch: Record<string, unknown>, price: number, label: string) => Promise<void>
}

/* =====================================================================
   DESKTOP
===================================================================== */
const Card = ({ children, style, pad = 20 }: { children: React.ReactNode; style?: React.CSSProperties; pad?: number }) => (
  <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: pad, ...style }}>{children}</div>
)
const Head = ({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
    <div>
      {eyebrow && <Tag>{eyebrow}</Tag>}
      <h1 style={{ margin: '9px 0 0', fontSize: 27, fontWeight: 900, letterSpacing: '-.04em', color: 'var(--brand-ink)', lineHeight: 1 }}>{title}</h1>
      {sub && <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'var(--ink-500)', maxWidth: 520, lineHeight: 1.45 }}>{sub}</p>}
    </div>
    {right}
  </div>
)
const KV = ({ ic, v, l }: { ic: string; v: number | string; l: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-400)', fontSize: 12 }} title={l}>
    <Ic n={ic} s={14} /><b className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600, fontSize: 12 }}>{typeof v === 'number' ? fmt(v) : v}</b>
  </span>
)
function PromoTags({ codes, drop }: { codes: string[]; drop: number | null }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {codes.includes('ad') && <Badge tone="mute" icon="sparkle">Реклама</Badge>}
      {codes.includes('urgent') && <Badge tone="ink" icon="bolt">Срочно</Badge>}
      {codes.includes('star') && <Badge tone="green" icon="star">Топ</Badge>}
      {codes.includes('drop') && drop && <Badge tone="mute">−{drop}%</Badge>}
    </div>
  )
}

const CHIPS: [string, string][] = [['all', 'Все'], ['active', 'Активные'], ['moderation', 'На модерации'], ['archived', 'Архив'], ['draft', 'Черновики']]

function EmptyListings({ store }: { store: Store }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
      <span style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--paper-2)', color: 'var(--ink-400)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Ic n="grid" s={24} /></span>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-900)' }}>Пока нет объявлений</div>
      <div style={{ fontSize: 13, color: 'var(--ink-400)', margin: '4px 0 16px' }}>Разместите первый участок или бизнес прямо сейчас.</div>
      <Btn variant="brand" icon="plus" onClick={() => store.go('/add-listing')}>Подать объявление</Btn>
    </Card>
  )
}

/* ── 1 · МОИ ОБЪЯВЛЕНИЯ ── */
function ListingsDesk({ store }: { store: Store }) {
  const [f, setF] = useState('all')
  const rows = store.listings.filter(l => f === 'all' || l.status === f)
  return (
    <>
      <Head eyebrow="01 · объявления" title="Мои объявления"
        sub="Управляйте публикациями, продвижением и статусами. Активный продавец видит статистику по каждому участку."
        right={<Btn variant="brand" icon="plus" onClick={() => store.go('/add-listing')}>Подать объявление</Btn>} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CHIPS.map(([k, lab]) => <Chip key={k} label={lab} count={store.counts[k]} active={f === k} onClick={() => setF(k)} />)}
      </div>
      {store.listingsLoading
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[0, 1, 2].map(i => <Card key={i} pad={14} style={{ height: 92, background: 'var(--paper-2)', border: '1px solid var(--line)' }}><span /></Card>)}</div>
        : rows.length === 0
          ? <EmptyListings store={store} />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(l => {
              const sm = STATUS_META[l.status]
              const drop = l.oldPrice ? Math.round((1 - l.price / l.oldPrice) * 100) : null
              return (
                <Card key={l.id} pad={14} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Thumb size={64} url={l.thumbUrl} star={l.promo.includes('star')} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <Badge tone={sm.tone} dot={sm.dot}>{sm.label}</Badge>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-300)' }}>№{l.id}</span>
                      {l.days > 0 && <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>· ещё {l.days} дн.</span>}
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-400)' }}>{l.meta}</span>
                      {l.status === 'active' && <><KV ic="eye" v={l.views} l="просмотры" />{l.calls > 0 && <KV ic="phone" v={l.calls} l="звонки" />}{l.saves > 0 && <KV ic="bookmark" v={l.saves} l="в избранном" />}</>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 190 }}>
                    {l.price > 0 ? (
                      <div>
                        {l.oldPrice && <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-300)', textDecoration: 'line-through', marginRight: 8 }}>{fmt(l.oldPrice)} ₸</span>}
                        <span style={{ fontSize: 16 }}><KZT v={l.price} /></span>
                        {l.per > 0 && <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, marginTop: 2 }} className="mono">{fmt(l.per)} ₸/сот.</div>}
                      </div>
                    ) : <span style={{ fontSize: 13, color: 'var(--ink-300)' }}>цена не указана</span>}
                    <PromoTags codes={l.promo} drop={drop} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '1px solid var(--line)', paddingLeft: 14 }}>
                    {l.status === 'draft'
                      ? <Btn size="sm" variant="primary" icon="edit" onClick={() => store.go(l.editHref)}>Дозаполнить</Btn>
                      : l.status === 'archived'
                        ? <Btn size="sm" variant="ghost" onClick={() => store.go(l.editHref)}>Повторить</Btn>
                        : <Btn size="sm" variant="brand" icon="rocket" onClick={() => store.setTab('promote')}>Продвинуть</Btn>}
                    <Btn size="sm" variant="ghost" icon="edit" style={{ justifyContent: 'flex-start' }} onClick={() => store.go(l.editHref)}>Изменить</Btn>
                  </div>
                </Card>
              )
            })}
          </div>}
    </>
  )
}

/* ── 2 · ПРОДВИЖЕНИЕ ── */
const WEEK_MS = 7 * 24 * 3600 * 1000

function PromoteDesk({ store }: { store: Store }) {
  const [apply, setApply] = useState<typeof BOOSTS[number] | null>(null)
  return (
    <>
      <Head eyebrow="02 · продвижение" title="Продвижение объявлений"
        sub="Платные метки для ваших объявлений — те же, что видны на карточках в каталоге. Оплата с баланса кабинета." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {BOOSTS.map(b => (
          <Card key={b.key} pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--paper-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-ink)' }}><Ic n={b.icon} s={19} /></span>
              {b.chip === 'urgent' ? <Badge tone="ink" icon="bolt">Срочно</Badge> : b.chip === 'ad' ? <Badge tone="mute" icon="sparkle">Реклама</Badge> : <Badge tone="mute">Скидка</Badge>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.02em' }}>{b.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4, lineHeight: 1.4 }}>{b.desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
              <span style={{ fontSize: 15 }}><KZT v={b.price} /><span style={{ fontSize: 11.5, color: 'var(--ink-400)', fontWeight: 500 }} className="mono"> {b.unit}</span></span>
              <Btn size="sm" variant="brand" icon="rocket" onClick={() => setApply(b)}>Применить</Btn>
            </div>
          </Card>
        ))}
      </div>
      {apply && <PromoApply store={store} boost={apply} onClose={() => setApply(null)} />}
    </>
  )
}

/** Выбор объявления + применение промо-метки к нему. */
function PromoApply({ store, boost, onClose }: { store: Store; boost: typeof BOOSTS[number]; onClose: () => void }) {
  const eligible = store.listings.filter(l => l.status === 'active' || l.status === 'moderation')
  const [pick, setPick] = useState<string>('')
  const [newPrice, setNewPrice] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const chosen = eligible.find(l => l.id === pick)
  const isDrop = boost.chip === 'drop'

  const confirm = async () => {
    if (!chosen) { setErr('Выберите объявление'); return }
    let patch: Record<string, unknown>
    if (isDrop) {
      const np = Number(newPrice.replace(/\s/g, ''))
      if (!Number.isFinite(np) || np <= 0 || np >= chosen.price) { setErr('Новая цена должна быть меньше текущей'); return }
      patch = { oldPrice: chosen.price, price: np }
    } else if (boost.chip === 'ad') {
      patch = { isFeatured: true, promoUntil: new Date(Date.now() + WEEK_MS).toISOString() }
    } else {
      patch = { isUrgent: true, promoUntil: new Date(Date.now() + WEEK_MS).toISOString() }
    }
    setBusy(true); setErr('')
    try { await store.applyPromo(chosen.id, patch, boost.price, boost.name); onClose() }
    catch { setErr('Не удалось применить'); setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,11,.5)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 460, background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 30px 80px -20px rgba(2,26,14,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--paper-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-ink)', flexShrink: 0 }}><Ic n={boost.icon} s={20} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.02em' }}>{boost.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Выберите объявление · <KZT v={boost.price} /> с баланса</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-400)' }}><Ic n="x" s={18} /></button>
        </div>
        {eligible.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-500)', padding: '18px 0', textAlign: 'center' }}>Нет активных объявлений для продвижения.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 260, overflowY: 'auto' }}>
              {eligible.map(l => (
                <button key={l.id} onClick={() => setPick(l.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, border: `1px solid ${pick === l.id ? 'var(--brand)' : 'var(--line)'}`, background: pick === l.id ? 'var(--brand-50)' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <Thumb size={40} r={9} url={l.thumbUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-400)' }} className="mono">{fmt(l.price)} ₸</div>
                  </div>
                  {pick === l.id && <Ic n="check" s={16} style={{ color: 'var(--brand)' }} />}
                </button>
              ))}
            </div>
            {isDrop && chosen && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 5 }}>Новая цена (меньше {fmt(chosen.price)} ₸)</div>
                <input value={newPrice} onChange={e => setNewPrice(e.target.value)} inputMode="numeric" placeholder="напр. 30 000 000"
                  style={{ height: 42, width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              </div>
            )}
            {err && <div style={{ fontSize: 12, color: 'var(--ink-900)', marginTop: 10 }}>{err}</div>}
            <Btn variant="brand" icon="check" style={{ width: '100%', marginTop: 14 }} onClick={confirm}
              disabled={busy || !pick}>{busy ? 'Применяем…' : `Применить · ${fmt(boost.price)} ₸`}</Btn>
          </>
        )}
      </div>
    </div>
  )
}

/* ── 3 · ДОП. УСЛУГИ ── */
function ServicesDesk({ store }: { store: Store }) {
  return (
    <>
      <Head eyebrow="03 · услуги" title="Дополнительные услуги"
        sub="Закажите съёмку, продвижение и сопровождение сделки. Стандартные услуги оплачиваются с баланса, сложные — по заявке с расчётом." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {SERVICES.map(s => {
          const inCart = store.cart.some(c => c.key === 'svc-' + s.key)
          const feat = s.tone === 'feat'
          return (
            <Card key={s.key} pad={0} style={{ overflow: 'hidden', border: feat ? '1.5px solid var(--brand)' : '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 14, padding: 18 }}>
                <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: feat ? 'var(--brand)' : 'var(--paper-2)', color: feat ? '#fff' : 'var(--brand-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={s.icon} s={24} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-.025em' }}>{s.name}</span>
                    {feat && <Badge tone="green">Хит</Badge>}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.45 }}>{s.desc}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {s.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 999, padding: '3px 9px' }}>{t}</span>)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
                <div>
                  {s.price != null
                    ? <span style={{ fontSize: 17 }}><span style={{ fontSize: 11.5, color: 'var(--ink-400)', fontWeight: 600 }} className="mono">{s.unit} </span><KZT v={s.price} /></span>
                    : <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-ink)' }} className="mono">{s.priceText}</span>}
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{s.sub || 'срок: ' + s.eta}</div>
                </div>
                {s.cta === 'cart'
                  ? <Btn variant={inCart ? 'soft' : 'brand'} icon={inCart ? 'check' : 'cart'} onClick={() => !inCart && s.price != null && store.addToCart({ key: 'svc-' + s.key, name: s.name, price: s.price, unit: s.unit + '' })}>{inCart ? 'В корзине' : 'В корзину'}</Btn>
                  : <Btn variant="primary" icon="phone">Оставить заявку</Btn>}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

/* ── 4 · ЗАЯВКИ ── */
function OrdersDesk() {
  const [open, setOpen] = useState<string | null>('S-1042')
  return (
    <>
      <Head eyebrow="04 · заявки" title="Заявки на услуги"
        sub="Статусы заказанных услуг — от новой заявки до готового результата." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ORDERS.map(o => {
          const st = ORDER_STATUS[o.status]
          const isOpen = open === o.id
          return (
            <Card key={o.id} pad={0} style={{ overflow: 'hidden' }}>
              <div onClick={() => setOpen(isOpen ? null : o.id)} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 16, cursor: 'pointer' }}>
                <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--paper-2)', color: 'var(--brand-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic n={o.icon} s={22} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-.02em' }}>{o.service}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-300)' }}>{o.id}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-400)', marginTop: 3 }}>{o.plot} · {o.person}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 14 }}>{o.sum > 0 ? <KZT v={o.sum} /> : <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{o.sumText}</span>}</span>
                  <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }} className="mono">{o.date}</div>
                </div>
                <Badge tone={st.tone} dot={st.tone !== 'ink' && st.tone !== 'solidgreen'}>{st.label}</Badge>
              </div>
              {isOpen && st.step >= 0 && (
                <div style={{ padding: '2px 16px 18px 74px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {ORDER_STEPS.map((s, i) => {
                      const done = i <= st.step, now = i === st.step
                      return (
                        <React.Fragment key={s}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 26, height: 26, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: done ? 'var(--brand)' : '#fff', color: done ? '#fff' : 'var(--ink-300)', border: done ? 'none' : '1px solid var(--line)' }} className="mono">{i < st.step ? <Ic n="check" s={13} /> : i + 1}</span>
                            <span style={{ fontSize: 10.5, fontWeight: now ? 700 : 500, color: done ? 'var(--ink-900)' : 'var(--ink-400)' }}>{s}</span>
                          </div>
                          {i < ORDER_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < st.step ? 'var(--brand)' : 'var(--line)', margin: '0 4px', marginBottom: 18 }} />}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}

/* ── 5 · БАЛАНС ── */
function BalanceDesk({ store }: { store: Store }) {
  const [amt, setAmt] = useState(25000)
  return (
    <>
      <Head eyebrow="05 · кошелёк" title="Баланс и платежи"
        sub="Пополняйте кошелёк и оплачивайте продвижение и услуги в один клик — без ввода карты каждый раз." />
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, marginBottom: 20 }}>
        <Card style={{ background: 'var(--brand-ink)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 168 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.1em' }} className="mono">Баланс кошелька</span>
            <Ic n="wallet" s={22} style={{ color: 'var(--brand-500)' }} />
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-.04em' }} className="mono">{fmt(store.balance)}<span style={{ fontSize: 22, opacity: .6 }}> ₸</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>{store.user.name} · счёт 6sotok-выплаты</div>
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Пополнить баланс</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
            {TOPUPS.map(v => <Chip key={v} label={fmt(v) + ' ₸'} active={amt === v} onClick={() => setAmt(v)} />)}
          </div>
          <Btn variant="brand" icon="plus" style={{ width: '100%' }} onClick={() => store.topup(amt)}>Пополнить на {fmt(amt)} ₸</Btn>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>Kaspi · Visa · Mastercard</span>
          </div>
        </Card>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink-400)', textTransform: 'uppercase', margin: '2px 0 10px' }} className="mono">История операций</div>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        {store.txns.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: t.t === 'in' ? 'var(--brand-50)' : 'var(--paper-2)', color: t.t === 'in' ? 'var(--brand)' : 'var(--ink-500)' }}><Ic n={t.t === 'in' ? 'plus' : 'arrow'} s={16} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 1 }} className="mono">{t.date}</div>
            </div>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: t.t === 'in' ? 'var(--brand)' : 'var(--ink-900)' }}>{t.t === 'in' ? '+' : '−'}{fmt(t.v)} ₸</span>
          </div>
        ))}
      </Card>
    </>
  )
}

/* ── 6 · АНАЛИТИКА ── */
function AnalyticsDesk() {
  const max = Math.max(...ANALYTICS.week.map(w => w.v))
  return (
    <>
      <Head eyebrow="06 · аналитика" title="Аналитика"
        sub="Как работают ваши объявления: просмотры, звонки, добавления в избранное и показы в выдаче." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {ANALYTICS.kpis.map(k => (
          <Card key={k.label} pad={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-400)' }}><Ic n={k.icon} s={18} /><Badge tone="green">{k.d}</Badge></div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.03em', marginTop: 12 }} className="mono">{fmt(k.v)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{k.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Просмотры за неделю</div>
            <Badge tone="mute">7 дней</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150 }}>
            {ANALYTICS.week.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: (w.v / max * 100) + '%', minHeight: 6, borderRadius: 6, background: w.v === max ? 'var(--brand)' : 'var(--brand-100)', transition: 'height .4s' }} />
                <span style={{ fontSize: 11, color: 'var(--ink-400)' }} className="mono">{w.d}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>По объявлениям</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ANALYTICS.byListing.map((b, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }} className="mono">{b.title}</span>
                  <span style={{ color: 'var(--ink-400)' }}><b style={{ color: 'var(--ink-900)' }}>{fmt(b.views)}</b> · {b.calls} зв.</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--paper-2)', overflow: 'hidden' }}><div style={{ width: b.pct + '%', height: '100%', background: 'var(--brand)', borderRadius: 99 }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

/* ── 7 · НАСТРОЙКИ ── */
function SettingsDesk({ store }: { store: Store }) {
  const [t, setT] = useState({ calls: true, wa: true, promo: false, weekly: true })
  const [type, setType] = useState(store.user.isAgency ? 'agency' : 'private')
  const [name, setName] = useState(store.user.name)
  const [phone, setPhone] = useState(store.user.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setAvatarBusy(true)
    try { await store.updateAvatar(file) } catch { /* тихо */ } finally { setAvatarBusy(false) }
  }
  const save = async () => {
    setSaving(true); setSaved(false)
    try { await store.updateUser({ name, phone: phone || undefined }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    finally { setSaving(false) }
  }
  const field = (label: string, value: string, onChange: (v: string) => void, ph?: string) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }} className="mono">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={ph}
        style={{ marginTop: 5, height: 40, width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', fontSize: 13.5, color: 'var(--ink-900)', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
    </div>
  )
  return (
    <>
      <Head eyebrow="07 · профиль" title="Настройки профиля" sub="Контактные данные, тип продавца и уведомления." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <button type="button" onClick={() => fileRef.current?.click()} title="Сменить фото"
              style={{ position: 'relative', border: 'none', background: 'none', padding: 0, cursor: 'pointer', borderRadius: 99, opacity: avatarBusy ? 0.6 : 1 }}>
              <Ava url={store.user.avatarUrl} initials={store.user.initials} size={56} fontSize={20} />
              <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 99, background: 'var(--brand)', border: '2px solid #fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Ic n="edit" s={11} />
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em' }}>{store.user.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-400)' }}>{avatarBusy ? 'Загрузка фото…' : 'Нажмите на фото, чтобы сменить'}</div>
            </div>
          </div>
          {field('Имя', name, setName)}
          {field('Телефон', phone, setPhone, '+7 701 234 56 78')}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }} className="mono">Email</label>
            <div style={{ marginTop: 5, height: 40, border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 13.5, color: 'var(--ink-500)', background: 'var(--paper)' }}>{store.user.email}</div>
          </div>
          {store.user.city && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }} className="mono">Город</label>
              <div style={{ marginTop: 5, height: 40, border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 13.5, color: 'var(--ink-500)', background: 'var(--paper)' }}>{store.user.city}</div>
            </div>
          )}
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }} className="mono">Тип продавца</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {[['private', 'Частник'], ['agency', 'Агентство']].map(([k, lab]) => <Chip key={k} label={lab} active={type === k} onClick={() => setType(k)} />)}
            </div>
          </div>
          <Btn variant="primary" style={{ width: '100%', marginTop: 14 }} onClick={save}>{saving ? 'Сохраняем…' : saved ? 'Сохранено ✓' : 'Сохранить'}</Btn>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Уведомления</div>
            {([['calls', 'Звонки и заявки по объявлениям'], ['wa', 'Дублировать в WhatsApp'], ['promo', 'Акции и советы по продвижению'], ['weekly', 'Еженедельный отчёт по аналитике']] as [keyof typeof t, string][]).map(([k, lab]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line)', cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{lab}</span>
                <Toggle on={t[k]} onClick={() => setT({ ...t, [k]: !t[k] })} />
              </label>
            ))}
          </Card>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Безопасность</div>
            <Btn variant="ghost" icon="shield" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }}>Сменить пароль</Btn>
            <Btn variant="ghost" icon="logout" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={store.signOut}>Выйти из аккаунта</Btn>
          </Card>
        </div>
      </div>
    </>
  )
}

const DESK_SECTIONS: Record<string, React.FC<{ store: Store }>> = { listings: ListingsDesk, promote: PromoteDesk, services: ServicesDesk, orders: OrdersDesk, balance: BalanceDesk, analytics: AnalyticsDesk, settings: SettingsDesk }

/* ── CART DRAWER ── */
function CartDrawer({ store }: { store: Store }) {
  if (!store.cartOpen) return null
  const total = store.cart.reduce((s, c) => s + c.price, 0)
  const enough = store.balance >= total
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={() => store.setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(2,26,14,.28)' }} />
      <div style={{ position: 'relative', width: 380, maxWidth: '100%', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px -20px rgba(0,0,0,.3)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="cart" s={19} />Корзина</div>
          <button onClick={() => store.setCartOpen(false)} style={{ border: 'none', background: 'var(--paper-2)', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="x" s={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {store.cart.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--ink-400)', fontSize: 13, padding: '60px 20px' }}>Корзина пуста.<br />Добавьте продвижение или услугу.</div>
            : store.cart.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--ink-400)' }} className="mono">{c.unit}</div></div>
                <span className="mono" style={{ fontSize: 13.5, fontWeight: 700 }}>{fmt(c.price)} ₸</span>
                <button onClick={() => store.removeFromCart(c.key)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-300)', cursor: 'pointer', padding: 4 }}><Ic n="x" s={15} /></button>
              </div>
            ))}
        </div>
        {store.cart.length > 0 && (
          <div style={{ padding: 18, borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ color: 'var(--ink-500)' }}>Итого</span><span className="mono" style={{ fontWeight: 800, fontSize: 18 }}>{fmt(total)} ₸</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: enough ? 'var(--ink-400)' : 'var(--ink-900)', marginBottom: 12 }}><span>Баланс кошелька</span><span className="mono" style={{ fontWeight: 600 }}>{fmt(store.balance)} ₸</span></div>
            {enough
              ? <Btn variant="brand" icon="check" style={{ width: '100%' }} onClick={store.checkout}>Оплатить с баланса</Btn>
              : <><div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 8 }}>Не хватает {fmt(total - store.balance)} ₸</div><Btn variant="primary" icon="plus" style={{ width: '100%' }} onClick={() => { store.setCartOpen(false); store.setTab('balance') }}>Пополнить баланс</Btn></>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── DESKTOP SHELL ── */
function DeskCabinet({ store }: { store: Store }) {
  const Section = DESK_SECTIONS[store.tab]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, maxWidth: 1440, margin: '0 auto', padding: '24px 24px 72px' }}>
      <aside style={{ width: 262, position: 'sticky', top: 84, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <Ava url={store.user.avatarUrl} initials={store.user.initials} size={38} fontSize={13} />
          <div><div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-.02em' }}>{store.user.name}</div><div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{store.user.isAgency ? 'Агентство' : 'Частник'}{store.user.city ? ' · ' + store.user.city : ''}</div></div>
        </div>
        <div style={{ padding: '4px 12px 8px' }}>
          <button onClick={() => store.setTab('balance')} style={{ width: '100%', textAlign: 'left', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-ink)', color: 'var(--brand-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="wallet" s={17} /></span>
            <div><div style={{ fontSize: 10, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.08em' }} className="mono">Баланс</div><div style={{ fontSize: 14.5, fontWeight: 800 }} className="mono">{fmt(store.balance)} ₸</div></div>
          </button>
        </div>
        <nav style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV.map(n => {
            const on = store.tab === n.key
            const count = n.key === 'listings' ? store.counts.all : (n as { count?: number }).count
            return (
              <button key={n.key} onClick={() => store.setTab(n.key)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--ink-900)' : 'transparent', color: on ? '#fff' : 'var(--ink-700)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: on ? 600 : 500, letterSpacing: '-.01em', textAlign: 'left' }}>
                <Ic n={n.icon} s={18} style={{ color: on ? 'var(--brand-500)' : 'var(--ink-400)' }} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {count ? <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: on ? 'rgba(255,255,255,.6)' : 'var(--ink-400)' }}>{count}</span> : null}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
          <button onClick={store.signOut} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ink-500)', fontFamily: 'inherit', fontSize: 13, width: '100%' }}><Ic n="logout" s={17} />Выйти</button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-400)' }}>
            <span>Кабинет</span><span style={{ color: 'var(--ink-300)' }}>/</span><span style={{ color: 'var(--ink-900)', fontWeight: 600 }}>{NAV.find(n => n.key === store.tab)?.label}</span>
          </div>
          <button style={{ position: 'relative', border: '1px solid var(--line)', background: '#fff', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="bell" s={18} /><span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 99, background: 'var(--brand)' }} /></button>
          <button onClick={() => store.setCartOpen(true)} style={{ position: 'relative', border: '1px solid var(--line)', background: '#fff', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic n="cart" s={18} />
            {store.cart.length > 0 && <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: 'var(--brand)', color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} className="mono">{store.cart.length}</span>}
          </button>
        </div>
        <Section store={store} />
      </div>
      <CartDrawer store={store} />
    </div>
  )
}

/* =====================================================================
   MOBILE
===================================================================== */
const MC = ({ children, style, pad = 14 }: { children: React.ReactNode; style?: React.CSSProperties; pad?: number }) => (
  <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: pad, ...style }}>{children}</div>
)
const MHead = ({ title, sub }: { title: string; sub?: string }) => (
  <div style={{ marginBottom: 14 }}>
    <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, letterSpacing: '-.04em', color: 'var(--brand-ink)' }}>{title}</h1>
    {sub && <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.4 }}>{sub}</p>}
  </div>
)
const MKV = ({ ic, v }: { ic: string; v: number | string }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ink-400)', fontSize: 11.5 }}><Ic n={ic} s={13} /><b className="mono" style={{ color: 'var(--ink-700)', fontWeight: 600 }}>{typeof v === 'number' ? fmt(v) : v}</b></span>

function MListings({ store }: { store: Store }) {
  const [f, setF] = useState('all')
  const rows = store.listings.filter(l => f === 'all' || l.status === f)
  return (
    <>
      <MHead title="Мои объявления" />
      <div className="no-bar" style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '0 -16px 14px', padding: '0 16px' }}>
        {CHIPS.map(([k, lab]) => <Chip key={k} label={lab === 'На модерации' ? 'Модерация' : lab} count={store.counts[k]} active={f === k} onClick={() => setF(k)} />)}
      </div>
      {rows.length === 0 && !store.listingsLoading
        ? <EmptyListings store={store} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(l => {
            const sm = STATUS_META[l.status]
            const drop = l.oldPrice ? Math.round((1 - l.price / l.oldPrice) * 100) : null
            return (
              <MC key={l.id} pad={12}>
                <div style={{ display: 'flex', gap: 11 }}>
                  <Thumb size={58} url={l.thumbUrl} star={l.promo.includes('star')} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}><Badge tone={sm.tone} dot={sm.dot}>{sm.label}</Badge><span className="mono" style={{ fontSize: 10, color: 'var(--ink-300)' }}>№{l.id}</span></div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.25 }}>{l.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-400)', marginTop: 3 }}>{l.meta}</div>
                  </div>
                </div>
                {l.price > 0 && <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 15 }}><KZT v={l.price} /></span>
                  {l.per > 0 && <span className="mono" style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>{fmt(l.per)} ₸/сот.</span>}
                </div>}
                {l.status === 'active' && <div style={{ display: 'flex', gap: 14, marginTop: 8 }}><MKV ic="eye" v={l.views} />{l.calls > 0 && <MKV ic="phone" v={l.calls} />}{l.saves > 0 && <MKV ic="bookmark" v={l.saves} />}</div>}
                {(l.promo.length > 0 || drop) && <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {l.promo.includes('ad') && <Badge tone="mute" icon="sparkle">Реклама</Badge>}
                  {l.promo.includes('urgent') && <Badge tone="ink" icon="bolt">Срочно</Badge>}
                  {drop && <Badge tone="mute">−{drop}%</Badge>}
                </div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {l.status === 'draft' ? <Btn size="sm" variant="primary" icon="edit" style={{ flex: 1 }} onClick={() => store.go(l.editHref)}>Дозаполнить</Btn>
                    : l.status === 'archived' ? <Btn size="sm" variant="ghost" style={{ flex: 1 }} onClick={() => store.go(l.editHref)}>Повторить</Btn>
                      : <><Btn size="sm" variant="brand" icon="rocket" style={{ flex: 1 }} onClick={() => store.setTab('promote')}>Продвинуть</Btn><Btn size="sm" variant="ghost" icon="edit" onClick={() => store.go(l.editHref)}>Изменить</Btn></>}
                </div>
              </MC>
            )
          })}
        </div>}
    </>
  )
}

function MPromote({ store }: { store: Store }) {
  const [apply, setApply] = useState<typeof BOOSTS[number] | null>(null)
  return (
    <>
      <MHead title="Продвижение" sub="Платные метки для объявлений — те же, что на карточках. Оплата с баланса." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BOOSTS.map(b => (
          <MC key={b.key} pad={13} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--paper-2)', color: 'var(--brand-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic n={b.icon} s={19} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-.02em' }}>{b.name}</div><div style={{ fontSize: 13, marginTop: 2 }}><KZT v={b.price} /><span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)' }}> {b.unit}</span></div></div>
            <Btn size="sm" variant="brand" icon="rocket" onClick={() => setApply(b)}>Применить</Btn>
          </MC>
        ))}
      </div>
      {apply && <PromoApply store={store} boost={apply} onClose={() => setApply(null)} />}
    </>
  )
}

function MServices({ store }: { store: Store }) {
  return (
    <>
      <MHead title="Дополнительные услуги" sub="Съёмка, реклама и сопровождение сделки." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {SERVICES.map(s => {
          const inCart = store.cart.some(c => c.key === 'svc-' + s.key)
          const feat = s.tone === 'feat'
          return (
            <MC key={s.key} pad={14} style={{ border: feat ? '1.5px solid var(--brand)' : '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: feat ? 'var(--brand)' : 'var(--paper-2)', color: feat ? '#fff' : 'var(--brand-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={s.icon} s={22} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '-.02em' }}>{s.name}</span>{feat && <Badge tone="green">Хит</Badge>}</div>
                  <p style={{ margin: '5px 0 0', fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.4 }}>{s.desc}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '11px 0' }}>{s.tags.map(t => <span key={t} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-500)', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 999, padding: '3px 8px' }}>{t}</span>)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 11, borderTop: '1px solid var(--line)' }}>
                <div>{s.price != null ? <span style={{ fontSize: 15 }}><span className="mono" style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600 }}>{s.unit} </span><KZT v={s.price} /></span> : <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-ink)' }}>{s.priceText}</span>}<div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 1 }}>{s.sub || 'срок: ' + s.eta}</div></div>
                {s.cta === 'cart' ? <Btn size="sm" variant={inCart ? 'soft' : 'brand'} icon={inCart ? 'check' : 'cart'} onClick={() => !inCart && s.price != null && store.addToCart({ key: 'svc-' + s.key, name: s.name, price: s.price, unit: s.unit + '' })}>{inCart ? 'В корзине' : 'Заказать'}</Btn> : <Btn size="sm" variant="primary" icon="phone">Заявка</Btn>}
              </div>
            </MC>
          )
        })}
      </div>
    </>
  )
}

function MOrders() {
  return (
    <>
      <MHead title="Заявки на услуги" sub="Статусы заказанных услуг." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ORDERS.map(o => {
          const st = ORDER_STATUS[o.status]
          return (
            <MC key={o.id} pad={13}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--paper-2)', color: 'var(--brand-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic n={o.icon} s={20} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-.02em' }}>{o.service}</div><div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>{o.plot}</div></div>
                <Badge tone={st.tone} dot={st.tone !== 'ink' && st.tone !== 'solidgreen'}>{st.label}</Badge>
              </div>
              {st.step >= 0 && <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                {ORDER_STEPS.map((s, i) => { const done = i <= st.step; return <React.Fragment key={s}>
                  <span style={{ width: 20, height: 20, borderRadius: 99, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: done ? 'var(--brand)' : '#fff', color: done ? '#fff' : 'var(--ink-300)', border: done ? 'none' : '1px solid var(--line)' }} className="mono">{i < st.step ? <Ic n="check" s={11} /> : i + 1}</span>
                  {i < 3 && <div style={{ flex: 1, height: 2, background: i < st.step ? 'var(--brand)' : 'var(--line)', margin: '0 3px' }} />}
                </React.Fragment> })}
              </div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5, color: 'var(--ink-400)' }} className="mono"><span>{o.date} · {o.person}</span><span style={{ color: 'var(--ink-900)', fontWeight: 700 }}>{o.sum > 0 ? fmt(o.sum) + ' ₸' : o.sumText}</span></div>
            </MC>
          )
        })}
      </div>
    </>
  )
}

function MBalance({ store }: { store: Store }) {
  const [amt, setAmt] = useState(25000)
  return (
    <>
      <MHead title="Баланс и платежи" />
      <MC style={{ background: 'var(--brand-ink)', color: '#fff', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Баланс кошелька</span><Ic n="wallet" s={19} style={{ color: 'var(--brand-500)' }} /></div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-.04em', marginTop: 12 }} className="mono">{fmt(store.balance)}<span style={{ fontSize: 18, opacity: .6 }}> ₸</span></div>
      </MC>
      <MC style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Пополнить</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>{TOPUPS.map(v => <Chip key={v} label={fmt(v) + ' ₸'} active={amt === v} onClick={() => setAmt(v)} />)}</div>
        <Btn variant="brand" icon="plus" style={{ width: '100%' }} onClick={() => store.topup(amt)}>Пополнить на {fmt(amt)} ₸</Btn>
      </MC>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink-400)', textTransform: 'uppercase', marginBottom: 10 }} className="mono">История</div>
      <MC pad={0} style={{ overflow: 'hidden' }}>
        {store.txns.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: t.t === 'in' ? 'var(--brand-50)' : 'var(--paper-2)', color: t.t === 'in' ? 'var(--brand)' : 'var(--ink-500)' }}><Ic n={t.t === 'in' ? 'plus' : 'arrow'} s={15} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div><div style={{ fontSize: 10.5, color: 'var(--ink-400)' }} className="mono">{t.date}</div></div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: t.t === 'in' ? 'var(--brand)' : 'var(--ink-900)' }}>{t.t === 'in' ? '+' : '−'}{fmt(t.v)}</span>
          </div>
        ))}
      </MC>
    </>
  )
}

function MAnalytics() {
  const max = Math.max(...ANALYTICS.week.map(w => w.v))
  return (
    <>
      <MHead title="Аналитика" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {ANALYTICS.kpis.map(k => (
          <MC key={k.label} pad={13}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-400)' }}><Ic n={k.icon} s={16} /><Badge tone="green">{k.d}</Badge></div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.03em', marginTop: 9 }} className="mono">{fmt(k.v)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{k.label}</div>
          </MC>
        ))}
      </div>
      <MC style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Просмотры за неделю</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>{ANALYTICS.week.map((w, i) => <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}><div style={{ width: '100%', height: (w.v / max * 100) + '%', minHeight: 5, borderRadius: 5, background: w.v === max ? 'var(--brand)' : 'var(--brand-100)' }} /><span className="mono" style={{ fontSize: 10, color: 'var(--ink-400)' }}>{w.d}</span></div>)}</div>
      </MC>
      <MC>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 13 }}>По объявлениям</div>
        {ANALYTICS.byListing.map((b, i) => <div key={i} style={{ marginBottom: i < 2 ? 13 : 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}><span className="mono" style={{ fontWeight: 600 }}>{b.title}</span><span style={{ color: 'var(--ink-400)' }}><b style={{ color: 'var(--ink-900)' }}>{fmt(b.views)}</b></span></div><div style={{ height: 7, borderRadius: 99, background: 'var(--paper-2)', overflow: 'hidden' }}><div style={{ width: b.pct + '%', height: '100%', background: 'var(--brand)' }} /></div></div>)}
      </MC>
    </>
  )
}

function MSettings({ store }: { store: Store }) {
  const [t, setT] = useState({ calls: true, wa: true, promo: false })
  const [type, setType] = useState(store.user.isAgency ? 'agency' : 'private')
  return (
    <>
      <MHead title="Настройки профиля" />
      <MC style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Ava url={store.user.avatarUrl} initials={store.user.initials} size={50} fontSize={18} />
          <div><div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.02em' }}>{store.user.name}</div><div style={{ fontSize: 11.5, color: 'var(--ink-400)' }}>{store.user.since}</div></div>
        </div>
        {([['Телефон', store.user.phone || '—'], ['Email', store.user.email], ['Город', store.user.city || '—']] as [string, string][]).map(([l, v]) => (
          <div key={l} style={{ marginBottom: 10 }}><label className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</label><div style={{ marginTop: 4, height: 38, border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 13, background: 'var(--paper)' }}>{v}</div></div>
        ))}
        <label className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Тип продавца</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>{[['private', 'Частник'], ['agency', 'Агентство']].map(([k, lab]) => <Chip key={k} label={lab} active={type === k} onClick={() => setType(k)} />)}</div>
      </MC>
      <MC style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Уведомления</div>
        {([['calls', 'Звонки и заявки'], ['wa', 'Дублировать в WhatsApp'], ['promo', 'Акции и советы']] as [keyof typeof t, string][]).map(([k, lab]) => <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line)' }}><span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{lab}</span><Toggle on={t[k]} onClick={() => setT({ ...t, [k]: !t[k] })} /></label>)}
      </MC>
      <Btn variant="ghost" icon="logout" style={{ width: '100%' }} onClick={store.signOut}>Выйти из аккаунта</Btn>
    </>
  )
}

const MOB_SECTIONS: Record<string, React.FC<{ store: Store }>> = { listings: MListings, promote: MPromote, services: MServices, orders: MOrders, balance: MBalance, analytics: MAnalytics, settings: MSettings }
const MOB_NAV = [{ key: 'listings', label: 'Объявл.', icon: 'grid' }, { key: 'promote', label: 'Продвиж.', icon: 'rocket' }, { key: 'services', label: 'Услуги', icon: 'sparkle' }, { key: 'balance', label: 'Баланс', icon: 'wallet' }]
const MORE_KEYS = ['orders', 'analytics', 'settings']

function MMore({ store, onClose }: { store: Store; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,26,14,.3)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px 20px 0 0', padding: '10px 16px 24px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--line)', margin: '4px auto 14px' }} />
        {NAV.filter(n => MORE_KEYS.includes(n.key)).map(n => (
          <button key={n.key} onClick={() => { store.setTab(n.key); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '13px 6px', border: 'none', borderBottom: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Ic n={n.icon} s={20} style={{ color: 'var(--brand)' }} /><span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 600 }}>{n.label}</span>{(n as { count?: number }).count ? <Badge tone="mute">{(n as { count?: number }).count}</Badge> : null}<Ic n="arrow" s={16} style={{ color: 'var(--ink-300)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

function MCart({ store }: { store: Store }) {
  if (!store.cartOpen) return null
  const total = store.cart.reduce((s, c) => s + c.price, 0)
  const enough = store.balance >= total
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={() => store.setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(2,26,14,.3)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Ic n="cart" s={18} />Корзина</div><button onClick={() => store.setCartOpen(false)} style={{ border: 'none', background: 'var(--paper-2)', width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="x" s={15} /></button></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
          {store.cart.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--ink-400)', fontSize: 13, padding: '40px 0' }}>Корзина пуста</div> : store.cart.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--line)' }}><div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</div><div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-400)' }}>{c.unit}</div></div><span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmt(c.price)} ₸</span><button onClick={() => store.removeFromCart(c.key)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-300)' }}><Ic n="x" s={14} /></button></div>
          ))}
        </div>
        {store.cart.length > 0 && <div style={{ padding: 16, borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 13, color: 'var(--ink-500)' }}>Итого</span><span className="mono" style={{ fontWeight: 800, fontSize: 17 }}>{fmt(total)} ₸</span></div>
          {enough ? <Btn variant="brand" icon="check" style={{ width: '100%' }} onClick={store.checkout}>Оплатить с баланса</Btn> : <Btn variant="primary" icon="plus" style={{ width: '100%' }} onClick={() => { store.setCartOpen(false); store.setTab('balance') }}>Пополнить баланс</Btn>}
        </div>}
      </div>
    </div>
  )
}

function MobileCabinet({ store }: { store: Store }) {
  const [more, setMore] = useState(false)
  const Section = MOB_SECTIONS[store.tab]
  const inMore = MORE_KEYS.includes(store.tab)
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
          <Ava url={store.user.avatarUrl} initials={store.user.initials} size={30} fontSize={11} />
          <span style={{ fontWeight: 900, fontSize: 15.5, letterSpacing: '-.04em', flex: 1 }}>Кабинет</span>
          <button onClick={() => store.setTab('balance')} style={{ height: 30, padding: '0 10px', border: '1px solid var(--line)', borderRadius: 99, background: 'var(--paper)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><Ic n="wallet" s={14} style={{ color: 'var(--brand)' }} /><span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{fmt(store.balance)} ₸</span></button>
          <button onClick={() => store.setCartOpen(true)} style={{ position: 'relative', border: '1px solid var(--line)', background: '#fff', width: 34, height: 34, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n="cart" s={16} />{store.cart.length > 0 && <span className="mono" style={{ position: 'absolute', top: -6, right: -6, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 99, background: 'var(--brand)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{store.cart.length}</span>}</button>
        </div>
      </div>
      <div style={{ padding: 16, paddingBottom: 110 }}><Section store={store} /></div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 72, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--line)', display: 'flex', paddingBottom: 10, zIndex: 950 }}>
        {MOB_NAV.map(n => { const on = store.tab === n.key; return (
          <button key={n.key} onClick={() => store.setTab(n.key)} style={{ flex: 1, border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', color: on ? 'var(--brand)' : 'var(--ink-400)', fontFamily: 'inherit' }}><Ic n={n.icon} s={21} /><span style={{ fontSize: 10, fontWeight: on ? 700 : 500 }}>{n.label}</span></button>
        ) })}
        <button onClick={() => setMore(true)} style={{ flex: 1, border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', color: inMore ? 'var(--brand)' : 'var(--ink-400)', fontFamily: 'inherit' }}><Ic n="dots" s={21} /><span style={{ fontSize: 10, fontWeight: inMore ? 700 : 500 }}>Ещё</span></button>
      </div>
      {more && <MMore store={store} onClose={() => setMore(false)} />}
      <MCart store={store} />
    </div>
  )
}

/* =====================================================================
   ROOT — auth, store, реальные объявления
===================================================================== */
const BUSINESS_TYPE_LABEL: Record<string, string> = {
  cafe: 'Кафе / ресторан', shop: 'Магазин', office: 'Офис', warehouse: 'Склад',
  production: 'Производство', service: 'АЗС / Сервис', hotel: 'Отель / Хостел', land: 'Земля под бизнес', other: 'Бизнес',
}

interface ApiListing {
  id: string | number; title?: string; price?: number; area?: number; buildingArea?: number
  location?: string; status?: string; views?: number; listingCategory?: string
  businessType?: string; landType?: string; images?: { image?: { url?: string } }[]
  isFeatured?: boolean; isUrgent?: boolean; oldPrice?: number; promoUntil?: string
}

function mapRow(l: ApiListing): Row {
  const isBusiness = l.listingCategory === 'business'
  const status: Row['status'] = l.status === 'published' ? 'active' : l.status === 'sold' ? 'archived' : l.status === 'draft' ? 'draft' : 'moderation'
  const typeLabel = isBusiness ? (BUSINESS_TYPE_LABEL[l.businessType || ''] || 'Бизнес') : (l.landType || 'Участок')
  const price = l.price || 0
  const per = !isBusiness && l.area && l.area > 0 ? Math.round(price / l.area) : 0
  return {
    id: String(l.id),
    status,
    title: l.title || 'Без названия',
    meta: [typeLabel, l.location].filter(Boolean).join(' · '),
    price,
    per,
    thumb: 0,
    thumbUrl: l.images?.[0]?.image?.url,
    views: l.views || 0,
    calls: 0,
    saves: 0,
    // реальные промо-метки объявления (учёт срока действия)
    promo: (() => {
      const active = !l.promoUntil || new Date(l.promoUntil).getTime() > Date.now()
      const p: string[] = []
      if (active && l.isFeatured) p.push('ad')
      if (active && l.isUrgent) p.push('urgent')
      if (active && l.oldPrice && l.oldPrice > price) p.push('drop')
      return p
    })(),
    oldPrice: (!l.promoUntil || new Date(l.promoUntil).getTime() > Date.now()) && l.oldPrice && l.oldPrice > price ? l.oldPrice : undefined,
    days: 0,
    sold: l.status === 'sold',
    editHref: isBusiness ? `/edit-business/${l.id}` : `/edit-listing/${l.id}`,
  }
}

function useMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(max-width:1024px)')
    const f = () => setM(q.matches)
    f(); q.addEventListener('change', f)
    return () => q.removeEventListener('change', f)
  }, [])
  return m
}

export default function ProfilePage() {
  const { user, loading, signOut, updateUser, updateAvatar } = useAuth()
  const router = useRouter()
  const mob = useMobile()

  const [tab, setTab] = useState('listings')
  const [cart, setCart] = useState<CartItem[]>([{ key: 'svc-video', name: 'Видео-ролик участка', price: 35000, unit: 'от' }])
  const [cartOpen, setCartOpen] = useState(false)
  const [balance, setBalance] = useState(24500)
  const [txns, setTxns] = useState<Txn[]>(TXNS0)
  const [flash, setFlash] = useState<string | null>(null)

  const [listings, setListings] = useState<Row[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/profile')
  }, [user, loading, router])

  const reloadListings = React.useCallback(async () => {
    if (!user) return
    try {
      const r = await fetch(`/api/listings?where[seller][equals]=${user.id}&depth=1&limit=50`, { credentials: 'include' })
      const data = await r.json()
      setListings(((data.docs ?? []) as ApiListing[]).map(mapRow))
    } catch { /* тихо */ }
  }, [user])

  useEffect(() => {
    if (!user) return
    setListingsLoading(true)
    reloadListings().finally(() => setListingsLoading(false))
  }, [user, reloadListings])

  if (loading || !user) {
    return (
      <div className="cabinet-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, border: '2px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    )
  }

  const counts: Record<string, number> = {
    all: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    moderation: listings.filter(l => l.status === 'moderation').length,
    archived: listings.filter(l => l.status === 'archived').length,
    draft: listings.filter(l => l.status === 'draft').length,
  }

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'

  const notify = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2200) }
  const addToCart = (item: CartItem) => { setCart(c => c.some(x => x.key === item.key) ? c : [...c, item]); setCartOpen(true) }
  const removeFromCart = (key: string) => setCart(c => c.filter(x => x.key !== key))
  const topup = (amt: number) => { setBalance(b => b + amt); setTxns(t => [{ t: 'in', label: 'Пополнение · Kaspi', date: 'сейчас', v: amt }, ...t]); notify('Баланс пополнен на ' + fmt(amt) + ' ₸') }
  const checkout = () => {
    const total = cart.reduce((s, c) => s + c.price, 0)
    setBalance(b => b - total)
    setTxns(t => [...cart.map(c => ({ t: 'out' as const, label: c.name, date: 'сейчас', v: c.price })), ...t])
    setCart([]); setCartOpen(false); notify('Оплачено ' + fmt(total) + ' ₸ · заявки созданы'); setTab('orders')
  }

  const applyPromo = async (listingId: string, patch: Record<string, unknown>, price: number, label: string) => {
    // реально применяем метку к объявлению (владелец правит своё)
    const r = await fetch(`/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    })
    if (!r.ok) { notify('Не удалось применить — попробуйте ещё раз'); throw new Error('patch failed') }
    // баланс демо: списываем цену метки
    setBalance(b => b - price)
    setTxns(t => [{ t: 'out', label, date: 'сейчас', v: price }, ...t])
    await reloadListings()
    notify(`${label} · применено к объявлению`)
  }

  const store: Store = {
    tab, setTab, cart, cartOpen, setCartOpen, balance, txns,
    addToCart, removeFromCart, topup, checkout,
    listings, counts, listingsLoading,
    user: { name: user.name, initials, phone: user.phone, email: user.email, city: user.city, isAgency: user.isAgency, since: 'на 6sotok', avatarUrl: user.avatar },
    go: (href: string) => router.push(href),
    signOut,
    updateUser,
    updateAvatar,
    applyPromo,
  }

  return (
    <div className="cabinet-page">
      {mob ? <MobileCabinet store={store} /> : <DeskCabinet store={store} />}
      {flash && <div style={{ position: 'fixed', bottom: mob ? 86 : 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--brand-ink)', color: '#fff', padding: '13px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 20px 50px -12px rgba(2,26,14,.5)', whiteSpace: 'nowrap' }}><Ic n="check" s={17} style={{ color: 'var(--brand-500)' }} />{flash}</div>}
    </div>
  )
}
