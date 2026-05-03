'use client'
import { useState } from 'react'
import { pushDataLayer } from '@/lib/analytics'
import type { ListingSeller } from '@/types/listing'

interface MobileContactBarProps {
  price: number
  pricePerSotka: number
  seller?: ListingSeller
  slug?: string
  title?: string
  listingUrl?: string
}

const PhoneSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const WaSvg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
  </svg>
)

export function MobileContactBar({ price, pricePerSotka, seller, slug, title, listingUrl }: MobileContactBarProps) {
  const [phoneVisible, setPhoneVisible] = useState(false)
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(price)
  const formattedPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka)
  const cleanPhone = seller?.phone?.replace(/\D/g, '') ?? ''
  const url = listingUrl ?? `https://6sotok.kz/listing/${slug ?? ''}`
  const waText = encodeURIComponent(`Здравствуйте! Интересует участок «${title ?? ''}» за ${formattedPrice} ₸.\n${url}`)
  const hasWa = seller?.hasWhatsApp && cleanPhone

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 w-full z-40 border-t border-zinc-200"
      style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}
    >
      {/* Строка цены */}
      <div className="flex items-baseline gap-2 px-4 pt-3 pb-2">
        <span className="text-[24px] font-bold tracking-tight text-zinc-900 tabular-nums leading-none">
          {formattedPrice} ₸
        </span>
        <span className="text-[12px] text-zinc-400 tabular-nums">{formattedPerSotka} ₸/сот.</span>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 px-4 pb-4">
        {/* WhatsApp */}
        {hasWa && (
          <a
            href={`https://wa.me/${cleanPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => pushDataLayer('whatsapp_click', { listing_slug: slug ?? null })}
            className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
            style={{ background: '#25D366' }}
            aria-label="WhatsApp"
          >
            <WaSvg />
          </a>
        )}

        {/* Телефон */}
        {cleanPhone ? (
          phoneVisible ? (
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 h-12 rounded-xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: '#066F36' }}
            >
              <PhoneSvg />
              {seller?.phone}
            </a>
          ) : (
            <button
              onClick={() => { pushDataLayer('phone_reveal', { source: 'mobile_bar', listing_slug: slug ?? null }); setPhoneVisible(true) }}
              className="flex-1 h-12 rounded-xl font-semibold text-[15px] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: '#066F36' }}
            >
              <PhoneSvg />
              Позвонить
            </button>
          )
        ) : (
          <div className="flex-1 h-12 rounded-xl bg-zinc-100 text-zinc-400 text-[13px] font-medium flex items-center justify-center">
            Нет номера
          </div>
        )}
      </div>
    </div>
  )
}
