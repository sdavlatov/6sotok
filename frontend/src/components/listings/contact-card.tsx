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
  hasStateAct?: boolean | null;
  hasEncumbrances?: boolean | null;
  isPledged?: boolean | null;
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const WaIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const VerifyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 2 2.4 1.7 2.9-.3 1 2.7 2.5 1.5-.7 2.8 1.4 2.6-2 2.1.1 2.9-2.7 1-1.5 2.5-2.8-.7L12 22l-2.6-1.4-2.8.7L5 18.8l-2.7-1 .1-2.9-2-2.1L1.8 10 1.1 7.2l2.5-1.5 1-2.7 2.9.3z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
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

function formatPriceMln(price: number) {
  const mln = price / 1_000_000;
  if (mln >= 1) return { main: (Math.round(mln * 10) / 10).toLocaleString('ru-RU'), unit: 'млн ₸' };
  return { main: new Intl.NumberFormat('ru-RU').format(price), unit: '₸' };
}

function maskPhone(phone: string): string {
  const c = phone.replace(/\D/g, '');
  return c.length >= 10 ? `+7 (${c.slice(-7, -4)}) ··· ····` : '+7 (···) ···-··-··';
}

const QUICK_DATES = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1);
  return {
    label: i === 0 ? 'Завтра' : i === 1 ? 'Послезавтра' : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    value: d.toISOString().split('T')[0],
  };
});
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

/* ── Форма просмотра ─────────────────────────────────────────────────────── */
function ViewingForm({ slug, onClose }: { slug?: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div className="py-5 text-center">
      <div className="w-11 h-11 rounded-full bg-[#f0fdf4] border border-[rgba(6,111,54,0.2)] flex items-center justify-center mx-auto mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <p className="text-[14px] font-semibold text-[var(--ink-900)] mb-1">Заявка отправлена</p>
      <p className="text-[12px] text-[var(--ink-400)]">Продавец свяжется для подтверждения</p>
      <button onClick={onClose} className="mt-3 text-[12px] text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors">Закрыть</button>
    </div>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); pushDataLayer('viewing_request', { date, time, listing_slug: slug ?? null }); setSent(true); }} className="pt-4 space-y-3">
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" required
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--line)] text-[13px] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" required
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--line)] text-[13px] placeholder:text-[var(--ink-400)] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
      <div>
        <p className="text-[11px] font-medium text-[var(--ink-400)] mb-1.5">Дата</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DATES.map(d => (
            <button key={d.value} type="button" onClick={() => setDate(d.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${date === d.value ? 'bg-primary text-white' : 'bg-[var(--paper-2)] text-[var(--ink-500)] hover:bg-[var(--paper-3)]'}`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium text-[var(--ink-400)] mb-1.5">Время</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TIME_SLOTS.map(t => (
            <button key={t} type="button" onClick={() => setTime(t)}
              className={`py-1.5 rounded-lg text-[12px] font-medium transition-colors ${time === t ? 'bg-primary text-white' : 'bg-[var(--paper-2)] text-[var(--ink-500)] hover:bg-[var(--paper-3)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={!name || !phone || !date || !time}
        className="w-full h-10 rounded-xl text-[13px] font-semibold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        Записаться
      </button>
    </form>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export function ContactCard({
  price, pricePerSotka, seller, slug, title, listingUrl, createdAt, views,
  hasStateAct, hasEncumbrances, isPledged,
}: ContactCardProps) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);

  const { main: priceMln, unit: priceUnit } = formatPriceMln(price);
  const fmtPerSotka = new Intl.NumberFormat('ru-RU').format(pricePerSotka);
  const cleanPhone = seller?.phone?.replace(/\D/g, '') ?? '';
  const url = listingUrl ?? `https://6sotok.kz/listing/${slug ?? ''}`;
  const waText = encodeURIComponent(`Здравствуйте! Интересует участок «${title ?? ''}» за ${priceMln} ${priceUnit}.\n${url}`);
  const waHref = `https://wa.me/${cleanPhone}?text=${waText}`;

  /* Ипотека Халык Банк 7%, 25 лет, ПВ 30% */
  const monthly = Math.round(
    (price * 0.7) * (0.07 / 12) * Math.pow(1 + 0.07 / 12, 300) /
    (Math.pow(1 + 0.07 / 12, 300) - 1)
  );

  /* Безопасная сделка */
  const safeItems = [
    { label: 'Кадастр проверен по базе НПП «Атамекен», обременений нет', done: hasStateAct !== false && hasStateAct != null },
    { label: 'Личность хозяина подтверждена через ЭЦП', done: !!seller?.isAgency },
    { label: 'Без обременений и залогов', done: !isPledged && !hasEncumbrances },
  ];
  const allSafe = safeItems.every(i => i.done);

  return (
    <div className="flex flex-col gap-3">

      {/* ── Цена + контакты ── */}
      <div className="bg-white rounded-3xl border border-[var(--line)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_30px_-10px_rgba(0,0,0,0.08)]">

        {/* Цена */}
        <div className="flex items-baseline gap-3">
          <span className="font-black text-[44px] leading-none tracking-tight text-[var(--ink-900)] tabular-nums">
            {priceMln}
          </span>
          <span className="font-black text-[26px] leading-none tracking-tight text-[var(--ink-400)]">{priceUnit}</span>
        </div>
        <div className="mt-2 text-[12px] text-[var(--ink-400)] tabular-nums">
          {fmtPerSotka} ₸ / сотку
        </div>

        {/* Продавец */}
        {seller && (
          <div className="mt-5 pt-5 border-t border-[var(--line-soft)] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-[14px] text-white shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #82d4b6, #066F36)' }}>
              {seller.avatar
                ? <img src={seller.avatar} className="w-full h-full object-cover" alt={seller.name} />
                : seller.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-[var(--ink-900)] leading-tight">{seller.name}</span>
                {seller.isAgency && <span className="text-primary shrink-0"><VerifyIcon /></span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px] text-[var(--ink-400)] flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-[#f0fdf4] text-primary font-semibold text-[10px]">
                  {seller.isAgency ? 'Агентство' : 'Хозяин'}
                </span>
                {createdAt && <><span>·</span><span>на 6сотoк с {new Date(createdAt).getFullYear()}</span></>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-400)]">отвечает</div>
              <div className="text-[12px] font-bold text-primary">~ 12 мин</div>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="mt-5 grid gap-2">
          {/* Телефон */}
          {cleanPhone ? (
            phoneVisible ? (
              <a href={`tel:${cleanPhone}`}
                className="h-12 rounded-xl bg-zinc-900 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                <PhoneIcon /> {seller?.phone}
              </a>
            ) : (
              <button onClick={() => { pushDataLayer('phone_reveal', { source: 'contact_card', listing_slug: slug ?? null }); setPhoneVisible(true); }}
                className="h-12 rounded-xl bg-zinc-900 text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                <PhoneIcon />
                Показать телефон
                <span className="font-mono text-[12px] opacity-60">{maskPhone(seller?.phone ?? '')}</span>
              </button>
            )
          ) : (
            <div className="h-12 rounded-xl bg-[var(--paper-2)] border border-[var(--line-soft)] text-[var(--ink-400)] text-[13px] font-medium flex items-center justify-center">
              Контакт недоступен
            </div>
          )}

          {/* Сообщение + WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <button className="h-11 rounded-xl border border-[var(--line)] bg-white text-[13px] font-semibold text-[var(--ink-900)] hover:border-zinc-400 transition-colors">
              Сообщение
            </button>
            {seller?.hasWhatsApp && cleanPhone ? (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                onClick={() => pushDataLayer('whatsapp_click', { listing_slug: slug ?? null })}
                className="h-11 rounded-xl text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: '#25D366' }}>
                <WaIcon /> WhatsApp
              </a>
            ) : (
              <button className="h-11 rounded-xl border border-[var(--line)] bg-white text-[13px] font-semibold text-[var(--ink-900)] hover:border-zinc-400 transition-colors">
                WhatsApp
              </button>
            )}
          </div>

          {/* Записаться на просмотр */}
          <button onClick={() => setViewingOpen(v => !v)}
            className={`h-10 rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              viewingOpen
                ? 'text-primary bg-[#f0fdf4] border-[rgba(6,111,54,0.2)]'
                : 'text-zinc-600 hover:text-primary hover:bg-[#f0fdf4] border-transparent'
            }`}>
            <CalendarIcon /> Записаться на просмотр
          </button>

          {viewingOpen && <ViewingForm slug={slug} onClose={() => setViewingOpen(false)} />}
        </div>

        {/* Онлайн */}
        <div className="mt-4 pt-4 border-t border-[var(--line-soft)] flex items-center gap-2 text-[11.5px] text-[var(--ink-400)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          Был онлайн только что
        </div>
      </div>

      {/* ── Безопасная сделка ── */}
      <div className={`rounded-3xl border p-5 ${allSafe ? 'bg-[#f6fdf8] border-[rgba(6,111,54,0.15)]' : 'bg-white border-[var(--line)]'}`}>
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-primary mb-3">
          → безопасная сделка
        </div>
        <ul className="space-y-2.5">
          {safeItems.map(item => (
            <li key={item.label} className="flex items-start gap-2.5 text-[13px]">
              <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                item.done ? 'bg-[#f0fdf4] border-[rgba(6,111,54,0.25)]' : 'bg-zinc-50 border-[var(--line)]'
              }`}>
                {item.done
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  : <span className="w-[5px] h-[5px] rounded-full bg-zinc-300 block" />}
              </span>
              <span className={item.done ? 'text-[var(--ink-700)]' : 'text-[var(--ink-400)]'}>{item.label}</span>
            </li>
          ))}
        </ul>
        <a href="/safe-deal"
          className="mt-4 w-full h-10 rounded-xl border border-[var(--line)] flex items-center justify-center text-[12.5px] font-semibold text-[var(--ink-700)] hover:border-primary hover:text-primary transition-colors">
          Узнать подробнее
        </a>
      </div>

      {/* ── Юрист онлайн ── */}
      <div className="bg-white rounded-3xl border border-[var(--line)] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
              <path d="M7 21h10"/><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 7h2c2 0 4.5-1 7-1s5 1 7 1h2"/>
            </svg>
            <span className="text-[13px] font-semibold text-[var(--ink-700)]">Юрист онлайн</span>
          </div>
          <span className="text-[11px] text-[var(--ink-400)]">доп. услуга</span>
        </div>
        <ul className="space-y-1.5 mb-4">
          {['Проверка документов и истории участка', 'Составление договора купли-продажи', 'Сопровождение сделки в ЦОН'].map(item => (
            <li key={item} className="flex items-center gap-2 text-[12px] text-[var(--ink-400)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              {item}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-3 border-t border-[var(--line-soft)]">
          <div>
            <span className="text-[20px] font-bold text-[var(--ink-900)] tabular-nums">35 000 ₸</span>
            <span className="text-[11px] text-[var(--ink-400)] ml-1.5">единоразово</span>
          </div>
          <button className="px-4 h-9 rounded-xl bg-zinc-900 text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity">
            Подключить
          </button>
        </div>
      </div>

      {/* ── Ипотека Халык Банк ── */}
      <div className="rounded-3xl p-5 overflow-hidden relative bg-zinc-900">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(44,166,78,0.3) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-primary-light mb-2">→ ипотека</div>
          <div className="font-black text-[22px] leading-tight tracking-tight text-white tabular-nums">
            от {new Intl.NumberFormat('ru-RU').format(monthly)} ₸
            <span className="text-white/40 text-[14px] font-bold"> / мес</span>
          </div>
          <div className="text-[12px] text-white/60 mt-1 mb-3">Халык Банк · 7%, 25 лет, ПВ 30%</div>
          <button className="px-3 h-8 rounded-lg bg-white text-[var(--ink-900)] text-[11.5px] font-bold hover:bg-primary-light hover:text-white transition-colors">
            Рассчитать →
          </button>
        </div>
      </div>

    </div>
  );
}
