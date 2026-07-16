import { Suspense } from 'react'
import { AuthView } from '@/components/auth/auth-view'

export default function LoginPage() {
  return (
    <Suspense>
      <AuthView initialMode="login" />
    </Suspense>
  )
}
