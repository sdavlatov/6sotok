'use client';

import { useState } from 'react';
import { ListingSeller } from '@/types/listing';
import { pushDataLayer } from '@/lib/analytics';

interface ContactCardProps {
  price: number;
  pricePerSotka: number;
  seller?: ListingSeller;
  slug?: string;
  title?: string;
  isNegotiable?: boolean;
}

export function ContactCard({ price, pricePerSotka, seller, slug, title, isNegotiable }: ContactCardProps) {
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(price);
  const formattedPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka);
  const cleanPhone = seller?.phone?.replace(/\D/g, '') ?? '';

  const waText = encodeURIComponent(
    `Здравствуйте! Интересует ваш участок «${title ?? ''}» за ${formattedPrice} ₸.\nhttps://6sotok.kz/listing/${slug ?? ''}`
  );
  const waHref = `https://wa.me/${cleanPhone}?text=${waText}`;

  return (
    <div className="rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-3xl xl:text-4xl font-black tracking-tight text-zinc-900">{formattedPrice} ₸</div>
        {isNegotiable && (
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">Торг</span>
        )}
      </div>
      <div className="mt-2 text-base font-bold text-zinc-400">{formattedPerSotka} ₸ / сотка</div>

      <div className="mt-8 space-y-3">
        {cleanPhone ? (
          <>
            {isPhoneVisible ? (
              <a
                href={`tel:${cleanPhone}`}
                className="w-full rounded-2xl bg-primary py-4 font-extrabold text-white transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                {seller?.phone}
              </a>
            ) : (
              <button
                onClick={() => {
                  pushDataLayer('phone_reveal', { source: 'contact_card', listing_slug: slug ?? null });
                  setIsPhoneVisible(true);
                }}
                className="w-full rounded-2xl bg-primary py-4 font-extrabold text-white transition-all hover:bg-primary-hover hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" /></svg>
                Показать телефон
              </button>
            )}
            {seller?.hasWhatsApp && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => pushDataLayer('whatsapp_click', { listing_slug: slug ?? null })}
                className="w-full rounded-2xl bg-[#25D366] py-4 font-extrabold text-white transition-all hover:bg-[#20BE5A] hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M16.666 4.9a10.518 10.518 0 0 0-7.464-3.15C3.398 1.75.12 6.55.12 12.35c0 1.912.496 3.766 1.439 5.4L.12 23.003l5.378-1.41a10.428 10.428 0 0 0 3.704.686h.005c5.803 0 10.526-4.8 10.526-10.603a10.524 10.524 0 0 0-3.067-7.427Zm-7.464 15.65h-.003a8.69 8.69 0 0 1-4.433-1.215l-.318-.188-3.295.864.88-3.212-.207-.329a8.683 8.683 0 0 1-1.328-4.62c0-4.823 3.926-8.75 8.75-8.75a8.704 8.704 0 0 1 6.182 2.569 8.707 8.707 0 0 1 2.564 6.185c0 4.824-3.926 8.75-8.748 8.75Zm4.81-6.57c-.264-.132-1.562-.77-1.803-.858-.242-.088-.418-.132-.594.133-.176.264-.683.858-.837 1.034-.154.175-.308.197-.573.065-.264-.131-1.115-.41-2.123-1.306-.784-.698-1.314-1.562-1.468-1.826-.154-.265-.016-.407.116-.539.12-.12.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.594-1.43-.814-1.958-.215-.516-.432-.446-.594-.455-.154-.007-.33-.008-.506-.008a.978.978 0 0 0-.704.33c-.242.264-.924.903-.924 2.202 0 1.298.946 2.552 1.078 2.728.132.176 1.86 2.837 4.5 3.976.629.27 1.12.433 1.503.555.631.2 1.205.172 1.657.104.506-.076 1.562-.638 1.782-1.254.22-.616.22-1.144.154-1.254-.066-.11-.242-.176-.506-.308Z" /></svg>
                Написать в WhatsApp
              </a>
            )}
          </>
        ) : (
          <div className="w-full rounded-2xl bg-zinc-100 py-4 font-extrabold text-zinc-400 flex items-center justify-center gap-2 text-sm">
            Контакт недоступен
          </div>
        )}
      </div>

      {seller && (
        <div className="mt-8 pt-8 border-t border-zinc-100 flex gap-5">
          <div className="h-14 w-14 rounded-full bg-primary-soft flex-shrink-0 flex items-center justify-center font-black text-primary text-xl relative shadow-inner">
            {seller.avatar ? <img src={seller.avatar} className="rounded-full h-full w-full object-cover" alt="avatar"/> : seller.name.charAt(0)}
            {seller.isAgency && (
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-zinc-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" /></svg>
              </span>
            )}
          </div>
          <div>
            <div className="font-extrabold text-zinc-900 text-lg">{seller.name}</div>
            <div className="text-sm font-bold text-zinc-500 mt-0.5">{seller.isAgency ? 'Агентство недвижимости' : 'Собственник'}</div>
            <div className="text-xs font-bold text-zinc-300 mt-1">На сайте с {seller.registerDate}</div>
          </div>
        </div>
      )}
    </div>
  );
}
