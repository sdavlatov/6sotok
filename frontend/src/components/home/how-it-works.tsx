'use client';

import { useState } from 'react';
import { Search, MapPin, Phone, Handshake, Camera, FileText, Star, MessageSquare } from 'lucide-react';

const BUYER_STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Найдите участок',
    body: 'Фильтры по категории, площади и цене. Смотрите на карте или в списке — удобно на любом устройстве.',
  },
  {
    icon: MapPin,
    step: '02',
    title: 'Изучите детали',
    body: 'Коммуникации, юр-статус, схема участка. Всё что нужно для принятия решения — в одной карточке.',
  },
  {
    icon: Phone,
    step: '03',
    title: 'Свяжитесь напрямую',
    body: 'Позвоните или напишите в WhatsApp продавцу. Никаких посредников и скрытых комиссий.',
  },
  {
    icon: Handshake,
    step: '04',
    title: 'Оформите сделку',
    body: 'Воспользуйтесь безопасной сделкой через эскроу или договоритесь самостоятельно.',
  },
];

const SELLER_STEPS = [
  {
    icon: Camera,
    step: '01',
    title: 'Сфотографируйте участок',
    body: 'Фото и видео прямо с телефона. Укажите кадастровый номер — это повышает доверие покупателей.',
  },
  {
    icon: FileText,
    step: '02',
    title: 'Заполните карточку',
    body: 'Категория, площадь, цена, коммуникации. Система автоматически проставит статус «Готов к стройке».',
  },
  {
    icon: Star,
    step: '03',
    title: 'Опубликуйте бесплатно',
    body: 'Базовое размещение — бесплатно. Продвигайте объявление для максимального охвата покупателей.',
  },
  {
    icon: MessageSquare,
    step: '04',
    title: 'Принимайте заявки',
    body: 'Заявки приходят напрямую на телефон и в WhatsApp. Сами выбираете, с кем работать.',
  },
];

export function HowItWorks() {
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');
  const steps = tab === 'buyer' ? BUYER_STEPS : SELLER_STEPS;

  return (
    <section className="bg-zinc-50 border-t border-zinc-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">Как это работает</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-zinc-900">Просто и понятно</h2>
        </div>

        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex bg-white border border-zinc-200 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setTab('buyer')}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${tab === 'buyer' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
            >
              Покупателям
            </button>
            <button
              onClick={() => setTab('seller')}
              className={`px-5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${tab === 'seller' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50'}`}
            >
              Продавцам
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(({ icon: Icon, step, title, body }, i) => (
            <div key={step} className="relative bg-white rounded-2xl border border-zinc-100 p-5 sm:p-6">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-9 left-[calc(100%+1px)] w-4 border-t border-dashed border-zinc-200 z-10" />
              )}
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-primary-soft p-2.5 rounded-xl text-primary flex-shrink-0">
                  <Icon className="size-5" />
                </div>
                <span className="text-3xl font-black text-zinc-100 leading-none tabular-nums">{step}</span>
              </div>
              <h3 className="font-bold text-zinc-900 text-[15px] mb-2">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
