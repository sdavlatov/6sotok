'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/profile'
  const error = searchParams.get('error')

  return (
    <AuthShell variant="login">
      <div className="mb-8">
        <p
          className="mb-3 font-mono uppercase text-primary"
          style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.12em' }}
        >
          С возвращением
        </p>
        <h1 className="text-[32px] sm:text-[44px] font-black leading-none tracking-[-0.05em] text-[var(--ink-900)]">
          Вход в кабинет
        </h1>
        <p className="mt-3.5 text-[16px] leading-relaxed text-[var(--ink-500)]">
          Войдите через Google за пару кликов — или по почте.
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
          {error}
        </div>
      )}
      <AuthCard next={next} onSuccess={() => router.push(next)} />
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
