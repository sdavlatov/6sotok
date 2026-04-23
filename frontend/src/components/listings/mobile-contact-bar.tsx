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
  isNegotiable?: boolean
}

export function MobileContactBar({ price, pricePerSotka, seller, slug, title, isNegotiable }: MobileContactBarProps) {
  const [phoneVisible, setPhoneVisible] = useState(false)
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(price)
  const formattedPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka)
  const cleanPhone = seller?.phone?.replace(/\D/g, '') ?? ''
  const waText = encodeURIComponent(`Здравствуйте! Интересует ваш участок «${title ?? ''}» за ${formattedPrice} ₸.\nhttps://6sotok.kz/listing/${slug ?? ''}`)

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-3 pb-safe shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-black tracking-tight text-zinc-900 leading-none">{formattedPrice} ₸</span>
            {isNegotiable && (
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">Торг</span>
            )}
          </div>
          <div className="text-[11px] font-bold text-primary mt-0.5">{formattedPerSotka} ₸/сот.</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {seller?.hasWhatsApp && cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pushDataLayer('whatsapp_click', { listing_slug: slug ?? null })}
              className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/20 active:scale-95 transition-transform"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16.666 4.9a10.518 10.518 0 0 0-7.464-3.15C3.398 1.75.12 6.55.12 12.35c0 1.912.496 3.766 1.439 5.4L.12 23.003l5.378-1.41a10.428 10.428 0 0 0 3.704.686h.005c5.803 0 10.526-4.8 10.526-10.603a10.524 10.524 0 0 0-3.067-7.427Zm-7.464 15.65h-.003a8.69 8.69 0 0 1-4.433-1.215l-.318-.188-3.295.864.88-3.212-.207-.329a8.683 8.683 0 0 1-1.328-4.62c0-4.823 3.926-8.75 8.75-8.75a8.704 8.704 0 0 1 6.182 2.569 8.707 8.707 0 0 1 2.564 6.185c0 4.824-3.926 8.75-8.748 8.75Zm4.81-6.57c-.264-.132-1.562-.77-1.803-.858-.242-.088-.418-.132-.594.133-.176.264-.683.858-.837 1.034-.154.175-.308.197-.573.065-.264-.131-1.115-.41-2.123-1.306-.784-.698-1.314-1.562-1.468-1.826-.154-.265-.016-.407.116-.539.12-.12.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.594-1.43-.814-1.958-.215-.516-.432-.446-.594-.455-.154-.007-.33-.008-.506-.008a.978.978 0 0 0-.704.33c-.242.264-.924.903-.924 2.202 0 1.298.946 2.552 1.078 2.728.132.176 1.86 2.837 4.5 3.976.629.27 1.12.433 1.503.555.631.2 1.205.172 1.657.104.506-.076 1.562-.638 1.782-1.254.22-.616.22-1.144.154-1.254-.066-.11-.242-.176-.506-.308Z"/></svg>
            </a>
          )}
          {cleanPhone ? (
            phoneVisible ? (
              <a
                href={`tel:${cleanPhone}`}
                className="h-12 px-5 rounded-2xl bg-primary text-white font-black text-[13px] flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd"/></svg>
                {seller?.phone}
              </a>
            ) : (
              <button
                onClick={() => { pushDataLayer('phone_reveal', { source: 'mobile_bar', listing_slug: slug ?? null }); setPhoneVisible(true) }}
                className="h-12 px-5 rounded-2xl bg-primary text-white font-black text-[13px] flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd"/></svg>
                Позвонить
              </button>
            )
          ) : (
            <div className="h-12 px-5 rounded-2xl bg-zinc-100 text-zinc-400 font-black text-[13px] flex items-center">Нет номера</div>
          )}
        </div>
      </div>
    </div>
  )
}
