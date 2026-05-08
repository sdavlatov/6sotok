'use client'

import { useState, FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

interface AuthCardProps {
  defaultTab?: 'login' | 'register'
  onSuccess?: () => void        // если не передан — редирект через router делает родитель
  title?: string
  subtitle?: string
}

export function AuthCard({ defaultTab = 'login', onSuccess, title, subtitle }: AuthCardProps) {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    setError('')
    setConfirm('')
  }

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
    if (password !== confirm) { setError('Пароли не совпадают'); return }
    if (password.length < 6) { setError('Пароль — минимум 6 символов'); return }
    setLoading(true)
    try {
      await signUp({ name, email, password, phone: phone || undefined })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150'
  const labelCls = 'block text-sm font-medium text-zinc-700 mb-1.5'

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {(title || subtitle) && (
        <div className="text-center px-6 pt-6 pb-2">
          {title && <p className="text-base font-bold text-zinc-900">{title}</p>}
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Переключатель */}
      <div className="px-6 pt-5">
        <div className="flex rounded-xl bg-zinc-100 p-1 gap-1">
          {(['login', 'register'] as const).map(t => (
            <button key={t} type="button" onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}>
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="example@mail.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Пароль</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  className={inputCls + ' pr-11'} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelCls}>Имя</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                required autoComplete="name" placeholder="Иван Иванов" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                Телефон <span className="text-zinc-400 font-normal">(необязательно)</span>
              </label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                autoComplete="tel" placeholder="+7 777 000 00 00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="example@mail.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Пароль</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Минимум 6 символов"
                  className={inputCls + ' pr-11'} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Повторите пароль</label>
              <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password" placeholder="••••••••" className={inputCls} />
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
