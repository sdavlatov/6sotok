'use client'

// Вход/регистрация — 1:1 порт макета «Дизайн html/Вход/auth.html».
// Вёрстка и классы из макета (auth.css), логика — боевая: useAuth + Google OAuth.

import { useEffect, useState, FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import type { AccountType } from '@/lib/auth'
import './auth.css'

type Mode = 'login' | 'register'

interface Stats {
  total: number
  verified: number
}

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')

// «1 участок / 2 участка / 8 участков» — макет писал «участка» под статичное 1 284
const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

// API (Payload) может отдать ошибку на английском — переводим в человеческий текст
function humanError(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('email or password') || (s.includes('парол') && s.includes('невер')))
    return 'Неверный e-mail или пароль. Проверьте данные или войдите через Google.'
  if (s.includes('already registered') || s.includes('unique') || s.includes('уже зарегистрирован') || s.includes('уникальн'))
    return 'Аккаунт с таким e-mail уже есть — попробуйте войти.'
  if (s.includes('failed to fetch') || s.includes('network'))
    return 'Нет соединения. Проверьте интернет и попробуйте ещё раз.'
  return raw
}

// «(7XX) XXX XX XX» → +7XXXXXXXXXX: ведущую 7/8 убираем только у 11-значного номера
function normalizePhone(input: string): string | undefined {
  let d = input.replace(/\D/g, '')
  if (!d) return undefined
  if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1)
  return `+7${d}`
}

/* ── Иконки макета (inline svg, 1:1) ─────────────────────────────────────── */
const IC = {
  google: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M21.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.3c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" />
      <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.3 2 12s.4 3.2 1.1 4.6L6.4 14z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeoff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 5.1A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.9" />
      <path d="m2 2 20 20" /><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  arr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
}

/* ── Бренд-панель ────────────────────────────────────────────────────────── */
function BrandPanel({ mode, stats }: { mode: Mode; stats: Stats | null }) {
  return (
    <div className="brand">
      <div className="plots" aria-hidden="true">
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 480 620" preserveAspectRatio="none">
          <polygon points="70,150 210,120 310,200 270,330 120,350" fill="rgba(44,166,78,.14)" stroke="rgba(127,212,149,.45)" strokeWidth="1.5" strokeDasharray="5 4" />
          <polygon points="250,380 380,370 400,460 270,490" fill="rgba(6,111,54,.26)" stroke="rgba(127,212,149,.38)" strokeWidth="1.5" strokeDasharray="5 4" />
        </svg>
        <span className="pin drift" style={{ top: 150, left: 280 }}><span className="st">★</span>38.6 млн ₸</span>
        <span className="pin dark sm drift" style={{ top: 222, left: 120, animationDelay: '-1.6s' }}>16.5 млн ₸</span>
      </div>

      <Link className="wm" href="/">6sotok<span className="tld">.kz</span></Link>

      <div className="bcontent" key={mode} style={{ position: 'relative' }}>
        <div className="eyebrow">{mode === 'login' ? 'Личный кабинет' : 'Регистрация'}</div>
        {mode === 'login' ? (
          <>
            <h2>С возвращением</h2>
            <p className="lead">Избранные участки, сохранённые поиски и черновики объявлений — всё на месте.</p>
          </>
        ) : (
          <>
            <h2>Найдём ваши шесть соток</h2>
            <ul>
              {['Сохраняйте поиски и подписки на участки', 'Публикуйте объявления и ведите их из кабинета', 'Кадастровая проверка и торг в чате'].map((t, i) => (
                <li key={i}><span className="ck">{IC.check}</span>{t}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="stats">
        <div>
          <div className="n">{stats ? fmt(stats.total) : '—'}</div>
          <div className="c">{stats ? plural(stats.total, ['участок', 'участка', 'участков']) : 'участков'} в продаже</div>
        </div>
        <div><div className="n">{stats ? fmt(stats.verified) : '—'}</div><div className="c">проверено кадастром</div></div>
      </div>
    </div>
  )
}

/* ── Поля ────────────────────────────────────────────────────────────────── */
function Field({
  label, aside, icon, prefix, type = 'text', placeholder, value, onChange, autoComplete, required,
}: {
  label: string
  aside?: ReactNode
  icon?: ReactNode
  prefix?: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="field">
      <span className="lab"><span className="t">{label}</span>{aside}</span>
      <span className="box">
        {prefix ? <span className="pre">{prefix}</span> : icon ? <span className="ico">{icon}</span> : null}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete={autoComplete} required={required} />
      </span>
    </label>
  )
}

function Password({
  label, aside, placeholder = '••••••••', value, onChange, autoComplete, minLength,
}: {
  label: string
  aside?: ReactNode
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      <span className="lab"><span className="t">{label}</span>{aside}</span>
      <span className="box">
        <span className="ico">{IC.lock}</span>
        <input
          type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange}
          autoComplete={autoComplete} required minLength={minLength}
        />
        <button type="button" className="eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Скрыть' : 'Показать'} tabIndex={-1}>
          {show ? IC.eyeoff : IC.eye}
        </button>
      </span>
    </label>
  )
}

function Check({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <label className={'check' + (on ? ' on' : '')} onClick={(e) => { e.preventDefault(); onToggle() }}>
      <span className="bx">{IC.check}</span>
      <span>{children}</span>
    </label>
  )
}

const GoogleButton = ({ next, children }: { next: string; children: ReactNode }) => (
  <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="gbtn">
    {IC.google} {children}
  </a>
)

/* ── Вход ────────────────────────────────────────────────────────────────── */
function LoginForm({ go, next, initialError }: { go: (m: Mode) => void; next: string; initialError: string }) {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(initialError)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await signIn(email, pw)
      router.push(next)
    } catch (err) {
      setError(humanError(err instanceof Error ? err.message : 'Не получилось войти. Попробуйте ещё раз.'))
      setLoading(false)
    }
  }

  // Бэкенда восстановления пока нет — честно говорим об этом, а не молчим
  const onForgot = (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    setNotice('Восстановление пароля скоро появится. Пока войдите через Google — если почта совпадает, попадёте в тот же аккаунт.')
  }

  return (
    <form onSubmit={submit}>
      <h1>Вход в кабинет</h1>
      <p className="sub">Войдите по e-mail или через Google.</p>

      <GoogleButton next={next}>Войти через Google</GoogleButton>

      <div className="div"><span className="ln"></span><span>или по e-mail</span><span className="ln"></span></div>

      <div className="fields">
        {error && <div className="err" role="alert">{error}</div>}
        {notice && <div className="note" role="status">{notice}</div>}
        <Field label="E-mail" icon={IC.mail} type="email" placeholder="you@mail.kz" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        <Password
          label="Пароль"
          aside={<a href="#" onClick={onForgot} style={{ fontSize: 12, fontWeight: 600 }}>Забыли пароль?</a>}
          value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password"
        />
        <div className="rowline" style={{ marginTop: 2 }}>
          <Check on={remember} onToggle={() => setRemember(r => !r)}>Запомнить меня</Check>
        </div>
        <button type="submit" className="submit" style={{ marginTop: 6 }} disabled={loading}>
          {loading ? 'Входим…' : <>Войти {IC.arr}</>}
        </button>
      </div>

      <div className="switch">Нет аккаунта? <button type="button" onClick={() => go('register')}>Зарегистрироваться</button></div>
      <p className="foot-note">
        Продолжая, вы соглашаетесь с <a href="/terms">офертой</a> и <a href="/privacy">политикой</a> обработки данных.
      </p>
    </form>
  )
}

/* ── Регистрация ─────────────────────────────────────────────────────────── */
function RegisterForm({ go, next }: { go: (m: Mode) => void; next: string }) {
  const router = useRouter()
  const { signUp } = useAuth()
  const [role, setRole] = useState<AccountType>('owner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pw, setPw] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    // валидация полей «как положено»
    const nm = name.trim()
    const ph = normalizePhone(phone) || ''
    if (nm.length < 2) { setError('Укажите имя и фамилию'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Введите корректный e-mail'); return }
    if (!/^\+7\d{10}$/.test(ph)) { setError('Введите телефон в формате +7 XXX XXX XX XX'); return }
    if (pw.length < 8) { setError('Пароль должен быть не короче 8 символов'); return }
    if (!/[A-Za-zА-Яа-я]/.test(pw) || !/\d/.test(pw)) { setError('Пароль должен содержать буквы и цифры'); return }
    if (!agree) { setError('Подтвердите согласие с офертой и обработкой персональных данных'); return }
    setLoading(true)
    try {
      const { needsVerification } = await signUp({
        name: nm,
        email: email.trim(),
        password: pw,
        phone: ph,
        accountType: role,
      })
      if (needsVerification) { setSentTo(email.trim()); setLoading(false); return }
      router.push(next)
    } catch (err) {
      setError(humanError(err instanceof Error ? err.message : 'Не получилось создать аккаунт. Попробуйте ещё раз.'))
      setLoading(false)
    }
  }

  if (sentTo) {
    return (
      <div>
        <h1>Подтвердите e-mail</h1>
        <p className="sub">Мы отправили письмо на <strong>{sentTo}</strong>. Откройте его и нажмите кнопку подтверждения, чтобы завершить регистрацию.</p>
        <div className="note" style={{ marginTop: 16 }}>
          Письмо не пришло? Проверьте папку «Спам». Ссылка действует ограниченное время.
        </div>
        <button type="button" className="btn" style={{ marginTop: 16 }} onClick={() => go('login')}>Перейти ко входу</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <h1>Создать аккаунт</h1>
      <p className="sub">Зарегистрируйтесь по e-mail или через Google — это займёт минуту.</p>

      <GoogleButton next={next}>Продолжить с Google</GoogleButton>

      <div className="div"><span className="ln"></span><span>или по e-mail</span><span className="ln"></span></div>

      <div className="fields">
        {error && <div className="err" role="alert">{error}</div>}
        <div className="field">
          <span className="lab"><span className="t">Я выступаю как</span></span>
          <div className="roles">
            <button type="button" className={'role' + (role === 'owner' ? ' on' : '')} onClick={() => setRole('owner')}>
              <span className="rr"></span>
              <span><span className="rt">Хозяин</span><span className="rs">Продаю свой участок или дачу</span></span>
            </button>
            <button type="button" className={'role' + (role === 'agent' ? ' on' : '')} onClick={() => setRole('agent')}>
              <span className="rr"></span>
              <span><span className="rt">Агент</span><span className="rs">Веду клиентов и объявления</span></span>
            </button>
          </div>
        </div>

        <Field label="Имя и фамилия" icon={IC.user} placeholder="Айдар Кенжебеков" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
        <Field label="E-mail" icon={IC.mail} type="email" placeholder="you@mail.kz" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        <Field label="Номер телефона" prefix="+7" type="tel" placeholder="(7XX) XXX XX XX" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" required />
        <Password label="Пароль" placeholder="Минимум 6 символов" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" minLength={6} />

        <Check on={agree} onToggle={() => setAgree(a => !a)}>
          Согласен(а) с <a href="/terms">офертой</a>, <a href="/rules">правилами</a> и обработкой <a href="/privacy">персональных данных</a>.
        </Check>

        <button type="submit" className="submit" style={{ marginTop: 4 }} disabled={loading}>
          {loading ? 'Создаём…' : <>Создать аккаунт {IC.arr}</>}
        </button>
      </div>

      <div className="switch">Уже есть аккаунт? <button type="button" onClick={() => go('login')}>Войти</button></div>
    </form>
  )
}

/* ── Страница ────────────────────────────────────────────────────────────── */
export function AuthView({ initialMode }: { initialMode: Mode }) {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/profile'
  const initialError = initialMode === 'login' ? searchParams.get('error') || '' : ''
  const [mode, setMode] = useState<Mode>(initialMode)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  // Табы переключают режим на месте (как в макете) и синхронизируют URL
  const go = (m: Mode) => {
    setMode(m)
    const qs = searchParams.get('next') ? `?next=${encodeURIComponent(next)}` : ''
    window.history.replaceState(null, '', (m === 'login' ? '/login' : '/register') + qs)
  }

  return (
    <div className="auth-page">
      <div className="wrap">
        <div className="card">
          <BrandPanel mode={mode} stats={stats} />
          <div className="form">
            <div className="tabs">
              <button className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Вход</button>
              <button className={mode === 'register' ? 'on' : ''} onClick={() => go('register')}>Регистрация</button>
            </div>
            {mode === 'login'
              ? <LoginForm key="login" go={go} next={next} initialError={initialError} />
              : <RegisterForm key="register" go={go} next={next} />}
          </div>
        </div>
      </div>
    </div>
  )
}
