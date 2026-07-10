'use client'

import { useState, FormEvent, InvalidEvent } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import type { AccountType } from '@/lib/auth'

const ROLES: { value: AccountType; title: string; sub: string }[] = [
  { value: 'owner', title: 'Хозяин', sub: 'Продаю свой участок или дачу' },
  { value: 'agent', title: 'Агент / агентство', sub: 'Веду клиентов, нужны инструменты' },
]

interface AuthCardProps {
  defaultTab?: 'login' | 'register'
  onSuccess?: () => void
  next?: string
}

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M21.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.3c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" />
    <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.3 2 12s.4 3.2 1.1 4.6L6.4 14z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
  </svg>
)

const labelCls = 'block font-mono text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5b5e54] mb-2'

// Сообщение об ошибке под полем — в нашем стиле
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <span className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-danger)]">
      <AlertCircle className="size-3.5 shrink-0" />
      {msg}
    </span>
  )
}

// Человеческое сообщение из браузерного ValidityState
function validityMessage(el: HTMLInputElement): string {
  const v = el.validity
  if (v.valueMissing) return 'Заполните это поле'
  if (v.typeMismatch) return el.type === 'email' ? 'Введите корректный email' : 'Проверьте формат'
  if (v.tooShort) return `Минимум ${el.minLength} символов`
  return 'Проверьте поле'
}

export function AuthCard({ defaultTab = 'login', onSuccess, next = '/profile' }: AuthCardProps) {
  const { signIn, signUp } = useAuth()
  const tab = defaultTab
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('owner')
  const [consent, setConsent] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Ошибки по полям (своя валидация вместо браузерных «пузырей»)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const onInvalid = (key: string) => (e: InvalidEvent<HTMLInputElement>) => {
    e.preventDefault() // гасим нативный пузырь
    const msg = validityMessage(e.currentTarget) // читаем ДО setErrs (потом currentTarget = null)
    setErrs((p) => ({ ...p, [key]: msg }))
  }
  const clearErr = (key: string) =>
    setErrs((p) => {
      if (!p[key]) return p
      const n = { ...p }
      delete n[key]
      return n
    })

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const newErrs: Record<string, string> = {}
    if (password.length < 6) newErrs.password = 'Минимум 6 символов'
    if (!consent) newErrs.consent = 'Подтвердите согласие с условиями'
    if (Object.keys(newErrs).length) {
      setErrs((p) => ({ ...p, ...newErrs }))
      return
    }
    setLoading(true)
    try {
      await signUp({
        name: `${name} ${surname}`.trim(),
        email,
        password,
        phone: phone || undefined,
        accountType,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const errorBox = error && (
    <div className="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-4 py-2.5 text-sm text-[var(--color-danger)]">
      {error}
    </div>
  )

  // ── ВХОД ───────────────────────────────────────────────────────────────────
  if (tab === 'login') {
    return (
      <div>
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <label className="flex flex-col">
            <span className="auth-label">Email</span>
            <input
              type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); clearErr('email') }}
              onInvalid={onInvalid('email')}
              aria-invalid={!!errs.email}
              required autoComplete="email" placeholder="example@mail.com" className="auth-input"
            />
            <FieldError msg={errs.email} />
          </label>

          <label className="flex flex-col">
            <span className="auth-label">Пароль</span>
            <span
              className="auth-input-wrap relative flex items-center h-12 rounded-xl border border-[var(--line)] bg-white pr-2 transition-all"
              aria-invalid={!!errs.password}
            >
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); clearErr('password') }}
                onInvalid={onInvalid('password')}
                required autoComplete="current-password" placeholder="••••••••"
                className="flex-1 h-full bg-transparent px-3.5 text-[14.5px] font-medium text-[var(--ink-900)] placeholder:text-[var(--ink-300)] placeholder:font-normal focus:outline-none"
                style={{ letterSpacing: '-0.01em' }}
              />
              <button
                type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}
                className="cursor-pointer px-1.5 text-[var(--ink-300)] hover:text-[var(--ink-500)] transition-colors"
              >
                {showPass ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </span>
            <FieldError msg={errs.password} />
          </label>

          {errorBox}

          <button
            type="submit" disabled={loading}
            className="auth-btn-ink relative mt-1 flex w-full items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Входим…' : 'Войти'}
            {!loading && <span className="absolute right-5 text-white/55 text-xs font-medium">↵</span>}
          </button>
        </form>

        <div className="flex items-center gap-3.5 my-6">
          <div className="flex-1 h-px bg-[var(--line)]" />
          <span className="auth-label !text-[var(--ink-400)] !tracking-[0.14em] text-[10px]">
            или одним кликом
          </span>
          <div className="flex-1 h-px bg-[var(--line)]" />
        </div>

        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="auth-provider flex w-full items-center justify-center gap-2.5"
        >
          <GoogleIcon /> Продолжить с Google
        </a>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-[var(--ink-400)]">
          Продолжая, вы соглашаетесь с{' '}
          <a href="/terms" className="text-[var(--ink-700)] hover:underline">офертой</a> и{' '}
          <a href="/privacy" className="text-[var(--ink-700)] hover:underline">политикой</a> обработки данных.
        </p>
      </div>
    )
  }

  // ── РЕГИСТРАЦИЯ ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* Роль */}
      <div>
        <label className={labelCls}>Я выступаю как</label>
        <div className="flex flex-col gap-2">
          {ROLES.map((r) => {
            const active = accountType === r.value
            return (
              <button
                key={r.value} type="button" onClick={() => setAccountType(r.value)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                  active ? 'border-primary bg-primary-soft' : 'border-border bg-white hover:border-[#cfcdc3]'
                }`}
              >
                {/* radio-кружок как в макете */}
                <span
                  className={`flex size-5 shrink-0 rounded-full bg-white transition-all ${
                    active ? 'border-[6px] border-primary' : 'border-[1.5px] border-[#cfcdc3]'
                  }`}
                />
                <div>
                  <div className={`text-sm font-bold tracking-tight ${active ? 'text-primary' : 'text-[#09090b]'}`}>
                    {r.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#7d8074]">{r.sub}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Имя + Фамилия */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className={labelCls}>Имя</span>
          <input
            type="text" value={name}
            onChange={(e) => { setName(e.target.value); clearErr('name') }}
            onInvalid={onInvalid('name')} aria-invalid={!!errs.name}
            required autoComplete="given-name" placeholder="Айдар" className="auth-input"
          />
          <FieldError msg={errs.name} />
        </label>
        <label className="flex flex-col">
          <span className={labelCls}>Фамилия</span>
          <input
            type="text" value={surname} onChange={(e) => setSurname(e.target.value)}
            autoComplete="family-name" placeholder="Кенжебеков" className="auth-input"
          />
        </label>
      </div>

      {/* Телефон */}
      <label className="flex flex-col">
        <span className={labelCls}>Номер телефона</span>
        <span
          className="auth-input-wrap flex items-center h-12 px-3.5 bg-white border border-[var(--line)] rounded-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-150"
          aria-invalid={!!errs.phone}
        >
          <span className={`font-mono text-[14px] font-semibold pr-2 transition-colors ${phone ? 'text-[#09090b]' : 'text-[#a3a59a]'}`}>+7</span>
          <input
            type="tel" value={phone}
            onChange={(e) => { setPhone(e.target.value); clearErr('phone') }}
            onInvalid={onInvalid('phone')} aria-invalid={!!errs.phone}
            required autoComplete="tel" placeholder="(7XX) XXX XX XX"
            className="flex-1 bg-transparent text-[14.5px] font-medium text-[#09090b] placeholder:text-[#a3a59a] placeholder:font-normal focus:outline-none"
          />
        </span>
        <FieldError msg={errs.phone} />
      </label>

      {/* Email */}
      <label className="flex flex-col">
        <span className={labelCls}>Email</span>
        <input
          type="email" value={email}
          onChange={(e) => { setEmail(e.target.value); clearErr('email') }}
          onInvalid={onInvalid('email')} aria-invalid={!!errs.email}
          required autoComplete="email" placeholder="example@mail.com" className="auth-input"
        />
        <FieldError msg={errs.email} />
      </label>

      {/* Пароль */}
      <label className="flex flex-col">
        <span className={labelCls}>Пароль</span>
        <span
          className="auth-input-wrap relative flex items-center h-12 rounded-xl border border-[var(--line)] bg-white pr-2 transition-all"
          aria-invalid={!!errs.password}
        >
          <input
            type={showPass ? 'text' : 'password'} value={password}
            onChange={(e) => { setPassword(e.target.value); clearErr('password') }}
            onInvalid={onInvalid('password')} aria-invalid={!!errs.password}
            required minLength={6} autoComplete="new-password" placeholder="Минимум 6 символов"
            className="flex-1 h-full bg-transparent px-3.5 text-[14.5px] font-medium text-[var(--ink-900)] placeholder:text-[var(--ink-300)] placeholder:font-normal focus:outline-none"
          />
          <button
            type="button" onClick={() => setShowPass((v) => !v)} tabIndex={-1}
            className="cursor-pointer px-1.5 text-[var(--ink-300)] hover:text-[var(--ink-500)] transition-colors"
          >
            {showPass ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </span>
        <FieldError msg={errs.password} />
      </label>

      {/* Согласие */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <button
            type="button" onClick={() => { setConsent((v) => !v); clearErr('consent') }}
            className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all ${
              consent ? 'bg-primary border-primary' : errs.consent ? 'bg-white border-[var(--color-danger)]' : 'bg-white border-[#cfcdc3]'
            }`}
          >
            {consent && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            )}
          </button>
          <span className="text-[12.5px] leading-relaxed text-[#5b5e54]">
            Согласен(а) с <a href="/terms" className="text-[#09090b] hover:underline">офертой</a>,{' '}
            <a href="/rules" className="text-[#09090b] hover:underline">правилами</a> и обработкой{' '}
            <a href="/privacy" className="text-[#09090b] hover:underline">персональных данных</a>.
          </span>
        </label>
        <FieldError msg={errs.consent} />
      </div>

      {errorBox}

      {/* CTA-ряд: создать + Google (на мобиле — столбиком) */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 pt-1">
        <button
          type="submit" disabled={loading}
          className="auth-btn-brand flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Создаём…' : 'Создать аккаунт →'}
        </button>
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          className="auth-provider auth-provider--lg flex items-center justify-center gap-2 px-4"
          title="Зарегистрироваться через Google"
        >
          <GoogleIcon size={18} /> Google
        </a>
      </div>
    </form>
  )
}
