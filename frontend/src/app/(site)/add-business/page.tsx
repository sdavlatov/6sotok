'use client';

import { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const fmtPrice = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
};
const rawPrice = (v: string) => Number(v.replace(/\s/g, ''));

const BUSINESS_TYPES = [
  { value: 'cafe',        label: 'Кафе / Ресторан' },
  { value: 'shop',        label: 'Магазин / Торговля' },
  { value: 'office',      label: 'Офис' },
  { value: 'warehouse',   label: 'Склад' },
  { value: 'production',  label: 'Производство' },
  { value: 'service',     label: 'АЗС / Сервис' },
  { value: 'hotel',       label: 'Отель / Хостел' },
  { value: 'land',        label: 'Земля под бизнес' },
  { value: 'other',       label: 'Другое' },
] as const;

const KZ_CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Атырау', 'Павлодар', 'Семей',
  'Қарағанды', 'Тараз', 'Өскемен', 'Актау', 'Уральск', 'Петропавловск',
  'Талдыкорган', 'Кызылорда', 'Туркестан', 'Кокшетау', 'Темиртау',
  'Экибастуз', 'Рудный', 'Жанаозен', 'Конаев', 'Степногорск', 'Балхаш',
  'Каскелен', 'Талгар', 'Есик', 'Капшагай', 'Щучинск', 'Бурабай',
];

export default function AddBusinessPage() {
  const { user } = useAuth();
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [photos, setPhotos]             = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex]       = useState<number | null>(null);
  const [dragOver, setDragOver]         = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fd, setFd] = useState({
    businessType: '',
    price: '', buildingArea: '',
    location: '', address: '',
    description: '',
    name: '', phone: '', hasWhatsApp: false,
  });

  useEffect(() => {
    if (user) {
      setFd(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    return () => { photoPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  const set = (k: keyof typeof fd, v: string | boolean) =>
    setFd(prev => ({ ...prev, [k]: v }));
  const toggle = (k: keyof typeof fd) =>
    setFd(prev => ({ ...prev, [k]: !prev[k] }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, j) => j !== i));
    setPhotoPreviews(prev => { URL.revokeObjectURL(prev[i]); return prev.filter((_, j) => j !== i); });
  };

  const movePhoto = (from: number, to: number) => {
    if (from === to) return;
    const reorder = <T,>(arr: T[]) => {
      const next = [...arr];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    };
    setPhotos(prev => reorder(prev));
    setPhotoPreviews(prev => reorder(prev));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fd.businessType) e.businessType = 'Выберите тип';
    if (!fd.price || rawPrice(fd.price) <= 0) e.price = 'Укажите цену';
    if (!fd.location.trim()) e.location = 'Укажите город';
    if (!fd.phone.trim()) e.phone = 'Укажите телефон';
    if (photos.length === 0) e.photos = 'Добавьте хотя бы одно фото';
    return e;
  };

  const autoTitle = [
    BUSINESS_TYPES.find(t => t.value === fd.businessType)?.label || 'Бизнес',
    fd.buildingArea ? `${fd.buildingArea} м²` : '',
    fd.location,
  ].filter(Boolean).join(' · ');

  const submit = async (status: 'draft' | 'published') => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);
    try {
      const mediaIds: string[] = [];
      for (const file of photos) {
        const form = new FormData();
        form.append('file', file);
        const r = await fetch('/api/media', { method: 'POST', body: form });
        if (r.ok) { const d = await r.json(); mediaIds.push(d.doc.id); }
      }
      const body = {
        title: autoTitle,
        listingCategory: 'business',
        businessType: fd.businessType,
        price: rawPrice(fd.price),
        buildingArea: fd.buildingArea ? Number(fd.buildingArea) : undefined,
        location: fd.location,
        address: fd.address || undefined,
        description: fd.description || undefined,
        seller: user?.id || undefined,
        sellerName: fd.name, sellerPhone: fd.phone, sellerHasWhatsApp: fd.hasWhatsApp,
        sellerIsAgency: user?.isAgency ?? false,
        status,
        images: mediaIds.map(id => ({ image: id })),
        // Заглушки для required полей
        landType: 'Коммерция',
        area: 0,
      };
      const r = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.errors?.[0]?.message ?? 'Ошибка сервера');
      }
      setIsSubmitted(true);
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Ошибка при отправке' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm font-bold text-zinc-900 outline-none transition-colors focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 ${err ? 'border-red-400 focus:border-red-400' : 'border-zinc-200 focus:border-primary'}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-primary-soft">
      <div className="py-10 lg:py-16 pb-32">
        <Container>

          <div className="mb-8 max-w-3xl mx-auto">
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Назад в кабинет
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Добавить бизнес</h1>
            <p className="mt-3 text-lg font-medium text-zinc-500">Кафе, магазин, склад, офис или другой коммерческий объект.</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); submit('draft'); }} className="max-w-3xl mx-auto space-y-6">

            {/* ── 1. Тип и цена ──────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900">Основная информация</h2>
                {autoTitle && (
                  <p className="mt-2 text-[13px] font-medium text-zinc-400">
                    Заголовок: <span className="font-bold text-zinc-700">{autoTitle}</span>
                  </p>
                )}
              </div>

              {/* Тип бизнеса */}
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-3">Тип объекта <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => set('businessType', fd.businessType === value ? '' : value)}
                      className={`px-4 py-2.5 rounded-xl text-[13px] font-bold border transition-all active:scale-95 ${fd.businessType === value ? 'bg-primary border-primary text-white shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {errors.businessType && <p className="mt-2 text-sm font-medium text-red-500">{errors.businessType}</p>}
              </div>

              {/* Площадь + Цена */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Площадь, м²</label>
                  <div className="relative">
                    <input type="number" min="1" placeholder="Например: 120"
                      value={fd.buildingArea} onChange={e => set('buildingArea', e.target.value)}
                      className={inputCls()} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none">м²</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Цена <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" placeholder="50 000 000"
                      value={fd.price} onChange={e => set('price', fmtPrice(e.target.value))}
                      className={inputCls(errors.price)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none">₸</span>
                  </div>
                  {errors.price && <p className="mt-1 text-sm font-medium text-red-500">{errors.price}</p>}
                </div>
              </div>

            </section>

            {/* ── 2. Фото ────────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
              <h2 className="text-xl font-extrabold text-zinc-900">Фото объекта <span className="text-red-500">*</span></h2>

              {photoPreviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-zinc-400">Перетащите чтобы изменить порядок</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {photoPreviews.map((src, i) => (
                      <div key={i} draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                        onDrop={e => { e.preventDefault(); if (dragIndex !== null) movePhoto(dragIndex, i); setDragIndex(null); setDragOver(null); }}
                        onDragEnd={() => { setDragIndex(null); setDragOver(null); }}
                        className={`relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 group cursor-grab transition-all ${dragOver === i && dragIndex !== i ? 'ring-2 ring-primary scale-[1.02]' : ''} ${dragIndex === i ? 'opacity-40' : ''}`}>
                        {i === 0 && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="bg-zinc-900/80 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">Обложка</span>
                          </div>
                        )}
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className={`flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed bg-zinc-50 hover:bg-zinc-100 cursor-pointer transition-colors ${errors.photos ? 'border-red-400' : 'border-zinc-300 hover:border-primary/50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary mb-2"><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/></svg>
                <span className="text-sm font-bold text-zinc-700">{photos.length > 0 ? 'Добавить ещё' : 'Нажмите или перетащите фото'}</span>
                <span className="text-xs font-semibold text-zinc-400 mt-1">JPG · PNG · WEBP · до 50 МБ</span>
                <input ref={fileInputRef} type="file" className="hidden" multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange} />
              </label>
              {errors.photos && <p className="text-sm font-medium text-red-500">{errors.photos}</p>}
            </section>

            {/* ── 3. Расположение ────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
              <h2 className="text-xl font-extrabold text-zinc-900">Расположение</h2>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Город / Населённый пункт <span className="text-red-500">*</span></label>
                <input type="text" list="kz-cities-biz" placeholder="Например: Алматы"
                  value={fd.location} onChange={e => set('location', e.target.value)}
                  className={inputCls(errors.location)} />
                <datalist id="kz-cities-biz">
                  {KZ_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
                {errors.location && <p className="mt-1 text-sm font-medium text-red-500">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Адрес или ориентир</label>
                <input type="text" placeholder="Ул. Абая 10, 1-й этаж"
                  value={fd.address} onChange={e => set('address', e.target.value)}
                  className={inputCls()} />
              </div>
            </section>

            {/* ── 4. Описание ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-extrabold text-zinc-900">Описание</h2>
                <span className="text-xs font-bold text-zinc-400">{fd.description.length} / 2000</span>
              </div>
              <textarea rows={5} maxLength={2000}
                placeholder="Расскажите об объекте: состояние, оборудование, причина продажи, условия..."
                value={fd.description} onChange={e => set('description', e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:font-medium placeholder:text-zinc-400 resize-none" />
            </section>

            {/* ── 5. Контакты ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
              <h2 className="text-xl font-extrabold text-zinc-900">Ваши контакты</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Имя</label>
                  <input type="text" placeholder="Иван"
                    value={fd.name} onChange={e => set('name', e.target.value)}
                    className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Телефон <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="+7 (___) ___ __ __"
                    value={fd.phone} onChange={e => set('phone', e.target.value)}
                    className={inputCls(errors.phone)} />
                  {errors.phone && <p className="mt-1 text-sm font-medium text-red-500">{errors.phone}</p>}
                  <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none w-fit">
                    <div onClick={() => toggle('hasWhatsApp')}
                      className={`relative w-10 h-6 rounded-full transition-colors ${fd.hasWhatsApp ? 'bg-[#25D366]' : 'bg-zinc-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${fd.hasWhatsApp ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm font-bold text-zinc-600">Есть WhatsApp на этом номере</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ── Кнопки ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-2 border-t border-zinc-200">
              {errors.submit && <p className="w-full text-sm font-medium text-red-500 text-center">{errors.submit}</p>}
              {isSubmitted ? (
                <div className="w-full rounded-2xl bg-primary-soft border border-primary/20 px-8 py-5 text-center">
                  <p className="font-extrabold text-primary">Объявление отправлено на проверку</p>
                  <p className="text-sm font-medium text-primary/70 mt-1">Мы свяжемся с вами в течение 24 часов</p>
                  <Link href="/profile" className="inline-block mt-3 text-sm font-bold text-primary hover:underline">
                    Вернуться в кабинет →
                  </Link>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => submit('draft')} disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-2xl border border-zinc-200 px-8 py-4 text-sm font-extrabold text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50">
                    Сохранить черновик
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full sm:w-auto rounded-2xl bg-primary px-10 py-4 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none">
                    {isSubmitting ? 'Отправка...' : 'Опубликовать'}
                  </button>
                </>
              )}
            </div>

          </form>
        </Container>
      </div>
    </div>
  );
}
