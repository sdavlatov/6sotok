'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/profile'

  return (
    <AuthShell variant="register">
      <div className="mb-8">
        <p
          className="mb-3 font-mono uppercase text-primary"
          style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.12em' }}
        >
          Создать аккаунт
        </p>
        <h1 className="text-[30px] sm:text-[40px] font-black leading-[1.04] tracking-[-0.05em] text-[var(--ink-900)]">
          Это займёт 30 секунд
        </h1>
        <p className="mt-3.5 text-[16px] leading-relaxed text-[var(--ink-500)]">
          Через Google за пару кликов — или заполните форму ниже.
        </p>
      </div>
      <AuthCard next={next} defaultTab="register" onSuccess={() => router.push(next)} />
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
