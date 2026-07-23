'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AccountType, getMe, login, logout, register, updateMe, uploadMedia, User, UserPatch } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: { name: string; email: string; password: string; phone?: string; city?: string; accountType?: AccountType }) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (fields: UserPatch) => Promise<void>
  /** Загружает файл и ставит его аватаром текущего пользователя. */
  updateAvatar: (file: File) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getMe().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = async (email: string, password: string) => {
    const u = await login(email, password)
    setUser(u)
  }

  const signUp = async (data: { name: string; email: string; password: string; phone?: string; city?: string; accountType?: AccountType }) => {
    await register(data)
    const u = await login(data.email, data.password)
    setUser(u)
  }

  const signOut = async () => {
    await logout()
    setUser(null)
    router.push('/')
  }

  const refreshUser = async () => {
    const u = await getMe()
    setUser(u)
  }

  const updateUser = async (fields: UserPatch) => {
    if (!user) return
    const updated = await updateMe(user.id, fields)
    setUser(updated)
  }

  const updateAvatar = async (file: File) => {
    if (!user) return
    const { id, url } = await uploadMedia(file)
    await updateMe(user.id, { avatar: id })
    // url уже известен из загрузки — ставим сразу, не дожидаясь refetch
    setUser({ ...user, avatar: url })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, updateUser, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
