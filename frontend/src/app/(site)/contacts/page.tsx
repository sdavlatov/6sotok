import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты — 6sotok.kz',
  description: 'Свяжитесь с командой 6sotok.kz.',
};

export default function ContactsPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="max-w-xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Контакты</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">Свяжитесь с нами</h1>
          <p className="text-[16px] text-zinc-500 leading-relaxed">
            Если у вас есть вопросы по размещению объявлений, сотрудничеству или работе платформы — напишите нам.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              ),
              label: 'WhatsApp',
              value: '+7 700 000 00 00',
              href: 'https://wa.me/77000000000',
              note: 'Пн–Пт, 9:00–18:00',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/>
                </svg>
              ),
              label: 'Email',
              value: 'info@6sotok.kz',
              href: 'mailto:info@6sotok.kz',
              note: 'Ответим в течение дня',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#066F36" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              ),
              label: 'Instagram',
              value: '@6sotok.kz',
              href: 'https://instagram.com/6sotok.kz',
              note: 'Новости и объявления',
            },
          ].map(c => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 flex flex-col gap-3 hover:-translate-y-0.5 transition-all duration-200"
              style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="w-10 h-10 bg-primary-soft rounded-xl flex items-center justify-center">
                {c.icon}
              </div>
              <div>
                <p className="text-[12px] font-medium text-zinc-400 mb-0.5">{c.label}</p>
                <p className="text-[15px] font-semibold text-zinc-900">{c.value}</p>
                <p className="text-[12px] text-zinc-400 mt-0.5">{c.note}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Для агентств */}
        <div className="bg-white rounded-2xl p-8 max-w-2xl" style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 className="text-[18px] font-bold text-zinc-900 mb-2">Для агентств и партнёров</h2>
          <p className="text-[14px] text-zinc-500 leading-relaxed mb-5">
            Если вы агентство недвижимости или бизнес-брокер и хотите сотрудничать — напишите на почту или в WhatsApp. Расскажем об условиях размещения и совместных проектах.
          </p>
          <p className="text-[13px] text-zinc-400">
            📍 Алматы, Казахстан
          </p>
        </div>

      </div>
    </div>
  );
}
