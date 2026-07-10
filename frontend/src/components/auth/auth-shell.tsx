'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'

interface Stats {
  total: number
  verified: number
}

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')

const COPY = {
  login: {
    tag: '01 · Вход',
    title: 'Снова здесь.',
    text: 'Сохранённые поиски, избранные участки и черновики ждут вас. Подписки оповестят, когда появится подходящее.',
    bullets: null as string[] | null,
  },
  register: {
    tag: '02 · Регистрация',
    title: 'Найдём ваши шесть соток.',
    text: null as string | null,
    bullets: [
      'Сохраняйте поиски и подписки',
      'Подавайте объявления — участки и бизнес',
      'Кадастровая проверка и торг в чате',
    ],
  },
}

/** Фон бренд-панели — точно по макету (#043E22 + свечения + сетка). */
const panelBg: React.CSSProperties = {
  backgroundColor: '#043E22',
  backgroundImage: [
    'radial-gradient(ellipse 460px 360px at 20% 18%, rgba(44,166,78,0.32), transparent 70%)',
    'radial-gradient(ellipse 480px 340px at 88% 88%, rgba(212,192,132,0.18), transparent 70%)',
    'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: '100% 100%, 100% 100%, 56px 56px, 56px 56px',
}

/** Зернистый шум поверх панели (subtle). */
const noiseStyle: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.85'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/></svg>\")",
  opacity: 0.035,
  mixBlendMode: 'multiply',
}

/** Декоративные пины карты на бренд-панели. */
function MapPins() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 480 720"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon
        points="80,240 220,210 320,290 280,420 130,440"
        fill="rgba(44,166,78,0.18)"
        stroke="rgba(44,166,78,0.55)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <polygon
        points="230,500 360,490 380,580 250,610"
        fill="rgba(212,192,132,0.20)"
        stroke="rgba(212,192,132,0.55)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </svg>
  )
}

/** Мобильный hero — кусок карты с участками (бренд-панель на мобиле скрыта). */
function MobileHero({ stats }: { stats: Stats | null }) {
  return (
    <div className="map-bg-m relative mb-6 h-[150px] overflow-hidden rounded-2xl lg:hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 156" preserveAspectRatio="none" aria-hidden>
        <polygon points="40,60 130,40 220,80 200,130 60,120" fill="rgba(6,111,54,0.18)" stroke="#066F36" strokeWidth="1.5" strokeDasharray="4 3" />
        <polygon points="220,30 320,30 320,110 240,120" fill="rgba(212,192,132,0.22)" stroke="rgba(180,140,60,0.6)" strokeWidth="1.2" strokeDasharray="4 3" />
      </svg>
      <span className="auth-drift absolute left-[58%] top-[36%] inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-900 shadow-md">
        <span className="flex size-4 items-center justify-center rounded-full bg-primary-light text-[8px] font-black text-white">★</span>
        38,6 млн ₸
      </span>
      <div className="absolute bottom-2.5 left-3 right-3 flex justify-between font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        <span>43.236°N · 76.945°E</span>
        <span>{stats ? `${stats.total.toLocaleString('ru-RU')} участков` : 'участки рядом'}</span>
      </div>
    </div>
  )
}

export function AuthShell({
  variant,
  children,
}: {
  variant: 'login' | 'register'
  children: ReactNode
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const copy = COPY[variant]

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="grid min-h-screen lg:grid-cols-[3fr_5fr]">
      {/* Бренд-панель — только десктоп */}
      <aside
        style={panelBg}
        className="relative hidden overflow-hidden px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div style={noiseStyle} className="pointer-events-none absolute inset-0" />
        <MapPins />

        {/* Плавающие чипы цен */}
        <div className="auth-drift pointer-events-none absolute left-[28%] top-[26%] inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-lg">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-light text-[9px] font-black text-white">
            ★
          </span>
          38,6 млн ₸
        </div>
        <div
          className="auth-drift pointer-events-none absolute left-[58%] top-[48%] inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-900 shadow-md"
          style={{ animationDelay: '-1.4s' }}
        >
          16,5 млн ₸
        </div>

        {/* Лого */}
        <Link href="/" className="relative inline-flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-white text-[17px] font-black tracking-tighter text-primary-dark">
            6
          </span>
          <span className="text-xl font-black tracking-tighter">
            соток<span className="text-white/50">.kz</span>
          </span>
        </Link>

        {/* Заголовок */}
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
            {copy.tag}
          </p>
          <h2 className="mt-3 max-w-[18ch] text-4xl font-black leading-[0.95] tracking-tighter">
            {copy.title}
          </h2>
          {copy.text && (
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/75">
              {copy.text}
            </p>
          )}
          {copy.bullets && (
            <ul className="mt-5 flex max-w-[34ch] flex-col gap-3">
              {copy.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[15px] text-white/85">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-light">
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Статы */}
        <div className="relative flex gap-10">
          <div>
            <div className="text-3xl font-black tracking-tight tabular-nums">
              {stats ? fmt(stats.total) : '—'}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              участков в продаже
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight tabular-nums">
              {stats ? fmt(stats.verified) : '—'}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">
              с госактом
            </div>
          </div>
        </div>
      </aside>

      {/* Форма */}
      <main
        style={{
          backgroundColor: '#fafaf7',
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
        className="relative flex flex-col px-4 py-6 sm:px-6 lg:items-center lg:justify-center lg:py-12"
      >
        {/* Переключатель — десктоп, правый верхний угол */}
        <div className="absolute right-6 top-6 hidden items-center gap-3 text-[13px] lg:flex">
          <span className="text-zinc-500">
            {variant === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          </span>
          <Link
            href={variant === 'login' ? '/register' : '/login'}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 font-semibold text-zinc-800 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50"
          >
            {variant === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </Link>
        </div>

        <div className={`w-full ${variant === 'login' ? 'max-w-[420px]' : 'max-w-md'}`}>
          {/* Мобильный нав: назад · лого · переключатель (вместо шапки сайта) */}
          <nav className="mb-5 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                aria-label="Назад"
                className="flex size-9 items-center justify-center rounded-full bg-white border border-[var(--line)] text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-2)]"
              >
                <ArrowLeft className="size-[18px]" />
              </Link>
              <Link href="/" className="inline-flex items-center gap-1.5">
                <span className="flex size-7 items-center justify-center rounded-[8px] bg-primary text-[15px] font-black tracking-tighter text-white">
                  6
                </span>
                <span className="text-[17px] font-black tracking-tighter text-[var(--ink-900)]">
                  соток<span className="text-[var(--ink-300)]">.kz</span>
                </span>
              </Link>
            </div>
            <Link
              href={variant === 'login' ? '/register' : '/login'}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {variant === 'login' ? 'Регистрация' : 'Войти'}
            </Link>
          </nav>

          <MobileHero stats={stats} />
          {children}
        </div>
      </main>
    </div>
  )
}
