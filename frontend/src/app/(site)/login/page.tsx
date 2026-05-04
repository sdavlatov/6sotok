'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { useAuth } from '@/context/auth-context'

function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/profile'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-zinc-50 flex items-center">
      <Container>
        <div className="mx-auto max-w-sm w-full py-12">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-primary-soft p-3 rounded-2xl mb-4">
              <LogIn className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Вход в аккаунт</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="example@mail.com"
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-zinc-700">Пароль</label>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </form>
          </div>

        </div>
      </Container>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
