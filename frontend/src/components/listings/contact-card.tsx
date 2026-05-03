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
  listingUrl?: string;
  createdAt?: string;
  views?: number;
}

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const VerifyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 2 2.4 1.7 2.9-.3 1 2.7 2.5 1.5-.7 2.8 1.4 2.6-2 2.1.1 2.9-2.7 1-1.5 2.5-2.8-.7L12 22l-2.6-1.4-2.8.7L5 18.8l-2.7-1 .1-2.9-2-2.1L1.8 10 1.1 7.2l2.5-1.5 1-2.7 2.9.3z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);


const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const WaIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
  </svg>
);

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'сегодня';
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дня назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function ContactCard({ price, pricePerSotka, seller, slug, title, listingUrl, createdAt, views }: ContactCardProps) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const formattedPrice = new Intl.NumberFormat('ru-RU').format(price);
  const formattedPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka);
  const cleanPhone = seller?.phone?.replace(/\D/g, '') ?? '';
  const url = listingUrl ?? `https://6sotok.kz/listing/${slug ?? ''}`;
  const waText = encodeURIComponent(`Здравствуйте! Интересует участок «${title ?? ''}» за ${formattedPrice} ₸.\n${url}`);
  const waHref = `https://wa.me/${cleanPhone}?text=${waText}`;

  return (
    <div className="flex flex-col gap-3">

      {/* Прайс-карточка */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

        {/* Цена */}
        <div className="px-6 pt-7 pb-6" style={{ borderBottom: '1px solid #f4f4f5' }}>
          <p className="text-[11px] font-medium text-zinc-400 mb-2">Стоимость участка</p>
          <p className="text-[46px] font-bold tracking-[-0.03em] text-zinc-900 leading-[1] tabular-nums">
            {formattedPrice} ₸
          </p>
          <p className="text-[13px] text-zinc-400 mt-2 tabular-nums">
            {formattedPerSotka} ₸ · за сотку
          </p>
        </div>

        {/* Кнопки */}
        <div className="px-6 py-5 flex gap-2">
          {cleanPhone ? (
            phoneVisible ? (
              <a
                href={`tel:${cleanPhone}`}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-[14px] font-semibold transition-colors duration-150 hover:bg-primary-hover active:scale-[0.98]"
              >
                <PhoneIcon /> {seller?.phone}
              </a>
            ) : (
              <button
                onClick={() => { pushDataLayer('phone_reveal', { source: 'contact_card', listing_slug: slug ?? null }); setPhoneVisible(true); }}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-[14px] font-semibold transition-colors duration-150 hover:bg-primary-hover active:scale-[0.98]"
              >
                <PhoneIcon /> Показать телефон
              </button>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center h-11 rounded-xl bg-zinc-50 text-zinc-400 text-sm border border-zinc-100">
              Контакт недоступен
            </div>
          )}

          {seller?.hasWhatsApp && cleanPhone && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => pushDataLayer('whatsapp_click', { listing_slug: slug ?? null })}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white transition-opacity duration-150 hover:opacity-90 active:scale-[0.96] shrink-0"
              style={{ background: '#25D366' }}
              title="Написать в WhatsApp"
            >
              <WaIcon />
            </a>
          )}
        </div>

        {/* Продавец */}
        {seller && (
          <div className="px-6 py-5" style={{ borderTop: '1px solid #f4f4f5' }}>
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-full flex items-center justify-center font-semibold text-white text-[15px] shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #82d4b6, #066F36)' }}
              >
                {seller.avatar
                  ? <img src={seller.avatar} className="size-10 object-cover" alt={seller.name} />
                  : seller.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-900 text-[14px] leading-snug">{seller.name}</span>
                  {seller.isAgency && <span className="text-primary shrink-0"><VerifyIcon /></span>}
                </div>
                <span className="text-[12px] text-zinc-400 font-normal">
                  {seller.isAgency ? 'Агентство' : 'Собственник'}
                </span>
              </div>
            </div>

            {(createdAt || views !== undefined) && (
              <div className="flex items-center gap-4 mt-4 text-[12px] text-zinc-400">
                {createdAt && (
                  <span className="flex items-center gap-1.5">
                    <ClockIcon /> {formatDate(createdAt)}
                  </span>
                )}
                {views !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <EyeIcon /> {views.toLocaleString('ru-RU')} просмотров
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Безопасная сделка */}
      <div className="rounded-2xl px-5 py-5" style={{ background: '#f6fdf8', border: '1px solid rgba(6,111,54,0.12)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#066F36' }}><ShieldIcon /></span>
          <span className="text-[13px] font-semibold" style={{ color: '#066F36' }}>Безопасная сделка</span>
        </div>
        <ul className="space-y-2">
          {[
            'Проверка документов на участок',
            'Сопровождение до ЦОН',
            'Юридическая защита покупателя',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span className="text-[13px] text-zinc-600 leading-snug">{item}</span>
            </li>
          ))}
        </ul>
        <a href="/safe-deal" className="inline-flex items-center gap-1 text-[12px] font-medium mt-4" style={{ color: '#066F36' }}>
          Подробнее →
        </a>
      </div>

    </div>
  );
}
