'use client'

import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { AuthCard } from '@/components/auth/auth-card'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-80px)] bg-zinc-50 flex items-center">
      <Container>
        <div className="mx-auto max-w-sm w-full py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-primary-soft p-3 rounded-2xl mb-4">
              <UserPlus className="size-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Добро пожаловать</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Войдите или создайте аккаунт</p>
          </div>
          <AuthCard defaultTab="register" onSuccess={() => router.push('/profile')} />
        </div>
      </Container>
    </div>
  )
}
