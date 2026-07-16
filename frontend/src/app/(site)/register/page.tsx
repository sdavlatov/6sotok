import { Suspense } from 'react'
import { AuthView } from '@/components/auth/auth-view'

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthView initialMode="register" />
    </Suspense>
  )
}
