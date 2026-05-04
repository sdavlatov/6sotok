'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Phone, Mail, Building2, LogOut, Edit3, Check, X, Plus, ChevronRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { useAuth } from '@/context/auth-context'

export default function ProfilePage() {
  const { user, loading, signOut, updateUser } = useAuth()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.replace('/login?next=/profile')
    return null
  }

  const startEdit = () => {
    setName(user.name)
    setPhone(user.phone || '')
    setSaveError('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setSaveError('')
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      await updateUser({ name, phone: phone || undefined })
      setEditing(false)
    } catch {
      setSaveError('Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-[calc(100vh-80px)] bg-zinc-50">
      <Container>
        <div className="max-w-xl mx-auto py-10 space-y-4">

          {/* Карточка профиля */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">

            {/* Шапка */}
            <div className="bg-gradient-to-br from-primary-soft via-white to-white px-6 pt-8 pb-6 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-zinc-900 leading-tight truncate">{user.name}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.isAgency ? (
                      <span className="bg-accent/20 text-sky-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Агентство
                      </span>
                    ) : (
                      <span className="bg-primary-soft text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Частное лицо
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="bg-zinc-900 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="size-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors duration-150 shrink-0"
                    title="Редактировать"
                  >
                    <Edit3 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Контактная информация */}
            {editing ? (
              <form onSubmit={save} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 777 000 00 00"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
                  />
                </div>
                {saveError && (
                  <p className="text-sm text-red-600">{saveError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 disabled:opacity-50"
                  >
                    <Check className="size-4" />
                    {saving ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium px-5 py-2.5 rounded-xl transition-colors duration-150"
                  >
                    <X className="size-4" />
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 py-2">
                  <div className="size-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Email</p>
                    <p className="text-[15px] font-medium text-zinc-800">{user.email}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-100" />

                <div className="flex items-center gap-3 py-2">
                  <div className="size-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Phone className="size-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Телефон</p>
                    <p className="text-[15px] font-medium text-zinc-800">
                      {user.phone || <span className="text-zinc-400">Не указан</span>}
                    </p>
                  </div>
                </div>

                {user.isAgency && (
                  <>
                    <div className="border-t border-zinc-100" />
                    <div className="flex items-center gap-3 py-2">
                      <div className="size-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                        <Building2 className="size-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-medium">Тип</p>
                        <p className="text-[15px] font-medium text-zinc-800">Агентство недвижимости</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Мои объявления */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900">Мои объявления</h2>
              <Link
                href="/add-listing"
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Plus className="size-4" />
                Добавить
              </Link>
            </div>
            <Link
              href="/catalog"
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
                  <User className="size-4 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-700">Перейти в каталог</p>
              </div>
              <ChevronRight className="size-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </Link>
          </div>

          {/* Выход */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 border border-zinc-100 hover:border-red-100 font-medium px-5 py-3 rounded-2xl transition-all duration-150"
          >
            <LogOut className="size-4" />
            Выйти из аккаунта
          </button>

        </div>
      </Container>
    </div>
  )
}
