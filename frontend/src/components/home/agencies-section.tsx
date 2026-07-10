import Link from 'next/link';
import { TrendingUp, Users, BarChart3 } from 'lucide-react';

const PERKS = [
  {
    icon: TrendingUp,
    title: 'Платные витрины',
    body: 'Выделенная страница агентства с портфолио объектов и логотипом',
  },
  {
    icon: Users,
    title: 'Лиды от покупателей',
    body: 'CPA-модель — платите только за подтверждённый контакт',
  },
  {
    icon: BarChart3,
    title: 'Аналитика рынка',
    body: 'Данные по ценам и спросу в вашем регионе — закрытый доступ',
  },
];

export function AgenciesSection() {
  return (
    <section className="bg-[#021A0E] border-t border-white/5">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#2CA64E' }}>
              Агентствам
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-white mb-4 leading-tight">
              Специальные условия<br />для профессионалов
            </h2>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Агентства и риелторы получают расширенные инструменты: массовое размещение,
              аналитику рынка, выделенные витрины и приоритетный показ объявлений.
            </p>
            <Link
              href="/b2b"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-900 font-semibold text-[14px] hover:bg-zinc-100 transition-colors duration-150"
            >
              Узнать об условиях →
            </Link>
          </div>

          <div className="grid gap-3">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl p-5 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: 'rgba(44,166,78,0.15)', color: '#2CA64E' }}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-white text-[14px]">{title}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
