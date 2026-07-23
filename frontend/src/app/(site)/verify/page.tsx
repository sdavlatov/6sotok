'use client'

/**
 * Подтверждение email по ссылке из письма (?token=…). Дёргает встроенный
 * эндпоинт Payload POST /api/users/verify/:token и показывает результат.
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading')

  useEffect(() => {
    if (!token) { setState('fail'); return }
    let alive = true
    fetch(`/api/users/verify/${token}`, { method: 'POST' })
      .then(r => { if (alive) setState(r.ok ? 'ok' : 'fail') })
      .catch(() => { if (alive) setState('fail') })
    return () => { alive = false }
  }, [token])

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-sm">
        {state === 'loading' && (
          <>
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-[14px] text-zinc-500">Подтверждаем email…</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h1 className="text-lg font-black tracking-tight text-zinc-900">Email подтверждён</h1>
            <p className="mt-1.5 text-[13.5px] text-zinc-500">Теперь вы можете войти в аккаунт.</p>
            <button onClick={() => router.push('/login')} className="mt-5 h-11 rounded-xl bg-primary px-6 text-[14px] font-semibold text-white">Войти</button>
          </>
        )}
        {state === 'fail' && (
          <>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
            <h1 className="text-lg font-black tracking-tight text-zinc-900">Ссылка недействительна</h1>
            <p className="mt-1.5 text-[13.5px] text-zinc-500">Возможно, email уже подтверждён или ссылка устарела.</p>
            <Link href="/login" className="mt-5 inline-flex h-11 items-center rounded-xl bg-zinc-900 px-6 text-[14px] font-semibold text-white">Перейти ко входу</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return <Suspense><VerifyInner /></Suspense>
}
