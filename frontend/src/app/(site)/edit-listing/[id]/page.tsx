'use client';

/**
 * Редактирование объявления — использует тот же мастер, что и подача
 * (ListingWizard из add-listing), но в режиме edit: тянет объявление,
 * предзаполняет поля и делает PATCH вместо POST. Раньше здесь была отдельная
 * старая форма — из-за неё «Изменить» кидало на устаревший интерфейс.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ListingWizard, fmtPrice,
  type ListingWizardInit, type ExistingImage,
} from '../../add-listing/page';
import type { LatLng } from '../../add-listing/map-editor';

const VIDEO_RE = /\.(mp4|mov|webm|ogv|m4v)$/i

interface RawImage { image?: { id?: string | number; url?: string; mimeType?: string } }
interface RawListing {
  id?: string | number
  listingCategory?: string
  dealType?: 'sale' | 'rent'
  landType?: string; businessType?: string
  area?: number; buildingArea?: number; floor?: number
  price?: number; monthlyRevenue?: number
  location?: string; address?: string; cadastralNumber?: string
  hasElectricity?: boolean; hasGas?: boolean; hasWater?: boolean; hasSewer?: boolean; hasRoadAccess?: boolean
  hasStateAct?: boolean; isDivisible?: boolean; hasEncumbrances?: boolean; canChangePurpose?: boolean
  plotBoundary?: string; description?: unknown
  lat?: number; lng?: number
  sellerName?: string; sellerPhone?: string; sellerHasWhatsApp?: boolean
  images?: RawImage[]
  title?: string
}

function parseBoundary(raw?: string): LatLng[] | null {
  if (!raw) return null
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return null
    const ring = arr
      .map((p: { lat?: number; lng?: number }) => ({ lat: p.lat, lng: p.lng }))
      .filter((p): p is LatLng => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    return ring.length >= 3 ? ring : null
  } catch { return null }
}

function toInit(d: RawListing): ListingWizardInit {
  const entity: 'land' | 'business' = d.listingCategory === 'business' ? 'business' : 'land'
  const desc = typeof d.description === 'string' ? d.description : ''
  const images: ExistingImage[] = (d.images ?? [])
    .map(i => i.image)
    .filter((m): m is { id: string | number; url: string; mimeType?: string } => !!m?.id && !!m?.url)
    .map(m => ({ id: String(m.id), url: m.url as string, video: m.mimeType?.startsWith('video/') || VIDEO_RE.test(m.url as string) }))

  const marker = d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : null

  if (entity === 'business') {
    return {
      entity, marker, images,
      bd: {
        category: d.businessType ?? '', name: d.title ?? '',
        location: d.location ?? '', address: d.address ?? '',
        buildingArea: d.buildingArea ? String(d.buildingArea) : '',
        floor: d.floor != null ? String(d.floor) : '',
        revenue: d.monthlyRevenue ? fmtPrice(String(d.monthlyRevenue)) : '',
        price: d.price ? fmtPrice(String(d.price)) : '',
        description: desc,
        name2: d.sellerName ?? '', phone: d.sellerPhone ?? '', wantWhatsApp: !!d.sellerHasWhatsApp,
      },
    }
  }
  return {
    entity, marker, images,
    boundary: parseBoundary(d.plotBoundary),
    fd: {
      dealType: d.dealType ?? 'sale',
      landType: d.landType ?? '',
      area: d.area != null ? String(d.area) : '',
      price: d.price ? fmtPrice(String(d.price)) : '',
      location: d.location ?? '', address: d.address ?? '',
      cadastralNumber: d.cadastralNumber ?? '',
      hasStateAct: !!d.hasStateAct,
      hasElectricity: !!d.hasElectricity, hasWater: !!d.hasWater, hasGas: !!d.hasGas,
      hasSewer: !!d.hasSewer, hasRoadAccess: !!d.hasRoadAccess,
      isDivisible: !!d.isDivisible,
      noEncumbrances: !d.hasEncumbrances,
      canChangePurpose: !!d.canChangePurpose,
      description: desc,
      name: d.sellerName ?? '', phone: d.sellerPhone ?? '', wantWhatsApp: !!d.sellerHasWhatsApp,
    },
  }
}

export default function EditListingPage() {
  const params = useParams()
  const id = String(params.id)
  const [init, setInit] = useState<ListingWizardInit | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    let alive = true
    fetch(`/api/listings/${id}?depth=1`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((d: RawListing | null) => {
        if (!alive) return
        if (!d?.id) { setState('notfound'); return }
        setInit(toInit(d)); setState('ready')
      })
      .catch(() => { if (alive) setState('notfound') })
    return () => { alive = false }
  }, [id])

  if (state === 'loading') {
    return (
      <div className="submit-page flex min-h-[calc(100vh-140px)] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    )
  }
  if (state === 'notfound' || !init) {
    return (
      <div className="submit-page flex min-h-[calc(100vh-140px)] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-base font-bold text-ink-900">Объявление не найдено</p>
        <p className="text-[13px] text-ink-500">Возможно, оно удалено или у вас нет доступа.</p>
      </div>
    )
  }
  return <ListingWizard mode="edit" listingId={id} init={init} />
}
