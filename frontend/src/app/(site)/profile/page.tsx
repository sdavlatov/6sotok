'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Phone, Mail, Building2, LogOut, Edit3, Check, X,
  Plus, Eye, Trash2, TreePine, Briefcase, Clock, CheckCircle2, Tag,
} from 'lucide-react'
import { Container } from '@/components/layout/container'
import { useAuth } from '@/context/auth-context'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликовано',
  sold: 'Продано',
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-500',
  published: 'bg-emerald-50 text-emerald-700',
  sold: 'bg-amber-50 text-amber-700',
}

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  cafe: 'Кафе / Ресторан', shop: 'Магазин', office: 'Офис',
  warehouse: 'Склад', production: 'Производство', service: 'АЗС / Сервис',
  hotel: 'Отель / Хостел', land: 'Земля под бизнес', other: 'Другое',
}

interface MyListing {
  id: string
  title: string
  price: number
  area?: number
  buildingArea?: number
  location: string
  status: string
  views?: number
  createdAt: string
  listingCategory?: string
  businessType?: string
  landType?: string
  images?: { image?: { url?: string } }[]
}

function fmt(n: number) {
  return n.toLocaleString('ru-KZ') + ' ₸'
}

function ListingCard({ listing, onDelete, onStatusChange }: {
  listing: MyListing
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const thumb = listing.images?.[0]?.image?.url

  const handleDelete = async () => {
    if (!confirm('Удалить объявление?')) return
    setDeleting(true)
    try {
      await fetch(`/api/listings/${listing.id}`, { method: 'DELETE', credentials: 'include' })
      onDelete(listing.id)
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setChangingStatus(true)
    try {
      const r = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (r.ok) onStatusChange(listing.id, status)
    } finally {
      setChangingStatus(false)
    }
  }

  const handleRemind = async () => {
    setReminding(true)
    await fetch('/api/listings/bulk-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: [listing.id] }),
    }).catch(() => {})
    setTimeout(() => setReminding(false), 2000)
  }

  const isBusiness = listing.listingCategory === 'business'
  const area = isBusiness
    ? (listing.buildingArea ? `${listing.buildingArea} м²` : null)
    : (listing.area ? `${listing.area} сот.` : null)

  const isDraft = listing.status === 'draft'
  const isSold = listing.status === 'sold'
  const createdMs = new Date(listing.createdAt).getTime()
  const elapsedHours = (Date.now() - createdMs) / 3_600_000
  const hoursLeft = Math.max(0, 24 - elapsedHours)
  const isExpired = isDraft && elapsedHours >= 24
  const editHref = isBusiness ? `/edit-business/${listing.id}` : `/edit-listing/${listing.id}`

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        {thumb ? (
          /\.(mp4|mov|webm)$/i.test(thumb) ? (
            <video src={thumb} className="w-full h-full object-cover" muted playsInline />
          ) : (
            <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isBusiness
              ? <Briefcase className="size-8 text-zinc-300" />
              : <TreePine className="size-8 text-zinc-300" />
            }
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[listing.status] ?? STATUS_CLASS.draft}`}>
          {STATUS_LABEL[listing.status] ?? listing.status}
        </span>
        {/* Edit button overlay */}
        <Link href={editHref}
          className="absolute top-2 right-2 size-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors">
          <Edit3 className="size-3.5 text-zinc-600" />
        </Link>
      </div>

      {/* Info */}
      <div className="p-4 space-y-1.5">
        <p className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2">{listing.title}</p>
        <p className="text-base font-bold text-zinc-900">{fmt(listing.price)}</p>
        <div className="flex items-center gap-3 text-xs text-zinc-400 pt-0.5">
          {area && <span>{area}</span>}
          {listing.views != null && (
            <span className="flex items-center gap-1"><Eye className="size-3" />{listing.views}</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(listing.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* 24h статус для черновиков */}
        {isDraft && !isExpired && (
          <div className="flex items-center gap-1.5 pt-1">
            <div className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-amber-400" />
            </div>
            <span className="text-[10px] font-semibold text-amber-600">
              На проверке — осталось {Math.ceil(hoursLeft)} ч
            </span>
          </div>
        )}
        {isExpired && (
          <button onClick={handleRemind} disabled={reminding}
            className="mt-1 w-full flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-bold py-1.5 rounded-xl transition-colors disabled:opacity-60">
            {reminding ? '✓ Напоминание отправлено' : '⏰ Напомнить модератору'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-3 border-t border-zinc-50 pt-3">
        {!isSold && (
          <button onClick={() => handleStatusChange('sold')} disabled={changingStatus}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-amber-600 transition-colors disabled:opacity-40">
            <Tag className="size-3.5" />
            Продано
          </button>
        )}
        {isSold && (
          <button onClick={() => handleStatusChange('draft')} disabled={changingStatus}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-primary transition-colors disabled:opacity-40">
            <CheckCircle2 className="size-3.5" />
            Снять с продажи
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-40">
          <Trash2 className="size-3.5" />
          Удалить
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, signOut, updateUser } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<'land' | 'business'>('land')
  const [listings, setListings] = useState<MyListing[]>([])
  const [listingsLoading, setListingsLoading] = useState(false)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!user) return
    setListingsLoading(true)
    fetch(`/api/listings?where[seller][equals]=${user.id}&depth=1&limit=50`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setListings(data.docs ?? []))
      .catch(() => {})
      .finally(() => setListingsLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-zinc-50 flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.replace('/login?next=/profile')
    return null
  }

  const landListings = listings.filter(l => !l.listingCategory || l.listingCategory === 'land')
  const bizListings = listings.filter(l => l.listingCategory === 'business')

  const startEdit = () => { setName(user.name); setPhone(user.phone || ''); setSaveError(''); setEditing(true) }
  const cancelEdit = () => { setEditing(false); setSaveError('') }
  const save = async (e: FormEvent) => {
    e.preventDefault(); setSaveError(''); setSaving(true)
    try { await updateUser({ name, phone: phone || undefined }); setEditing(false) }
    catch { setSaveError('Не удалось сохранить') }
    finally { setSaving(false) }
  }

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-[calc(100vh-80px)] bg-zinc-50">
      <Container>
        <div className="max-w-4xl mx-auto py-8 space-y-5">

          {/* ── Профиль ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="bg-gradient-to-br from-primary-soft via-white to-white px-6 pt-6 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-zinc-900 truncate">{user.name}</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${user.isAgency ? 'bg-sky-50 text-sky-700' : 'bg-primary-soft text-primary'}`}>
                      {user.isAgency ? 'Агентство' : 'Частное лицо'}
                    </span>
                    {user.role === 'admin' && (
                      <span className="bg-zinc-900 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                </div>
                {!editing && (
                  <button onClick={startEdit} className="size-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors shrink-0">
                    <Edit3 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <form onSubmit={save} className="p-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Имя</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Телефон</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 777 000 00 00"
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                  </div>
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                    <Check className="size-4" />{saving ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                  <button type="button" onClick={cancelEdit}
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium px-4 py-2 rounded-xl text-sm transition-colors">
                    <X className="size-4" />Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-4 flex flex-wrap gap-x-8 gap-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Mail className="size-4 text-zinc-400" />{user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Phone className="size-4 text-zinc-400" />{user.phone}
                  </div>
                )}
                {user.isAgency && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Building2 className="size-4 text-zinc-400" />Агентство недвижимости
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Статистика ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Всего', value: listings.length },
              { label: 'Земля', value: landListings.length },
              { label: 'Бизнес', value: bizListings.length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 text-center">
                <p className="text-2xl font-black text-zinc-900">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Объявления ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Табы */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
              <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
                <button onClick={() => setTab('land')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'land' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  <TreePine className="size-4" />
                  Земля
                  {landListings.length > 0 && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'land' ? 'bg-primary-soft text-primary' : 'bg-zinc-200 text-zinc-500'}`}>
                      {landListings.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setTab('business')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'business' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  <Briefcase className="size-4" />
                  Бизнес
                  {bizListings.length > 0 && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${tab === 'business' ? 'bg-primary-soft text-primary' : 'bg-zinc-200 text-zinc-500'}`}>
                      {bizListings.length}
                    </span>
                  )}
                </button>
              </div>

              <Link
                href={tab === 'land' ? '/add-listing' : '/add-business'}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="size-4" />
                Добавить
              </Link>
            </div>

            {/* Контент таба */}
            <div className="p-5">
              {listingsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl bg-zinc-100 animate-pulse aspect-[3/4]" />
                  ))}
                </div>
              ) : tab === 'land' ? (
                landListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-zinc-100 p-4 rounded-2xl mb-3">
                      <TreePine className="size-8 text-zinc-400" />
                    </div>
                    <p className="text-base font-semibold text-zinc-700 mb-1">Нет объявлений по земле</p>
                    <p className="text-sm text-zinc-400 mb-4">Разместите первый участок прямо сейчас</p>
                    <Link href="/add-listing"
                      className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                      <Plus className="size-4" />Добавить участок
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {landListings.map(l => (
                      <ListingCard key={l.id} listing={l}
                        onDelete={id => setListings(prev => prev.filter(x => x.id !== id))}
                        onStatusChange={(id, status) => setListings(prev => prev.map(x => x.id === id ? { ...x, status } : x))} />
                    ))}
                  </div>
                )
              ) : (
                bizListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-zinc-100 p-4 rounded-2xl mb-3">
                      <Briefcase className="size-8 text-zinc-400" />
                    </div>
                    <p className="text-base font-semibold text-zinc-700 mb-1">Нет бизнес-объявлений</p>
                    <p className="text-sm text-zinc-400 mb-4">Разместите кафе, магазин, склад или другой объект</p>
                    <Link href="/add-business"
                      className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                      <Plus className="size-4" />Добавить бизнес
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {bizListings.map(l => (
                      <ListingCard key={l.id} listing={l}
                        onDelete={id => setListings(prev => prev.filter(x => x.id !== id))}
                        onStatusChange={(id, status) => setListings(prev => prev.map(x => x.id === id ? { ...x, status } : x))} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Легенда статусов ───────────────────────────────────────────── */}
          <div className="flex items-center gap-4 px-1">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[key]}`}>{label}</span>
              </div>
            ))}
            <p className="text-xs text-zinc-400 ml-auto">Объявления видны после публикации</p>
          </div>

          {/* ── Выход ──────────────────────────────────────────────────────── */}
          <button onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 border border-zinc-100 hover:border-red-100 font-medium px-5 py-3 rounded-2xl transition-all text-sm">
            <LogOut className="size-4" />Выйти из аккаунта
          </button>

        </div>
      </Container>
    </div>
  )
}
