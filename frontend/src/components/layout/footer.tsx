import Link from 'next/link';
import { Container } from './container';
import { MapPin, Phone, Mail, Instagram } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <Container>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4 lg:grid-cols-5">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="6sotok" className="h-10 w-auto" />
              <span className="text-xl font-black tracking-tight text-zinc-900">
                6sotok<span className="text-primary">.kz</span>
              </span>
            </Link>
            <p className="text-[14px] text-zinc-500 font-normal leading-relaxed max-w-xs">
              Специализированный маркетплейс земельных участков Казахстана. Продажа напрямую от собственников и агентств.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary transition-colors">
                <Instagram className="w-4 h-4" strokeWidth={2} />
              </a>
              <a href="https://wa.me/77000000000" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary transition-colors">
                <Phone className="w-4 h-4" strokeWidth={2} />
              </a>
              <a href="mailto:info@6sotok.kz" className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 text-zinc-400 hover:text-primary hover:border-primary transition-colors">
                <Mail className="w-4 h-4" strokeWidth={2} />
              </a>
            </div>
          </div>

          {/* Покупателям */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Покупателям</h3>
            <ul className="space-y-3">
              {[
                { label: 'Все участки', href: '/catalog' },
                { label: 'Поиск на карте', href: '/catalog' },
                { label: 'Под строительство', href: '/catalog?type=ИЖС' },
                { label: 'Под бизнес', href: '/catalog?type=Коммерция' },
                { label: 'Под фермерство', href: '/catalog?type=Сельхоз' },
              ].map(link => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-[14px] text-zinc-600 font-normal hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Продавцам */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Продавцам</h3>
            <ul className="space-y-3">
              {[
                { label: 'Подать объявление', href: '/add-listing' },
                { label: 'Для агентств', href: '/b2b' },
                { label: 'Для собственников', href: '/add-listing' },
                { label: 'Личный кабинет', href: '/profile' },
                { label: 'Правила размещения', href: '/rules' },
              ].map(link => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-[14px] text-zinc-600 font-normal hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Компания */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Компания</h3>
            <ul className="space-y-3">
              {[
                { label: 'О проекте', href: '/about' },
                { label: 'Контакты', href: '/contacts' },
                { label: 'Блог', href: '/blog' },
                { label: 'Конфиденциальность', href: '/privacy' },
                { label: 'Пользовательское соглашение', href: '/terms' },
              ].map(link => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-[14px] text-zinc-600 font-normal hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 py-6">
          <p className="text-[13px] text-zinc-400 font-normal">
            © {year} 6sotok.kz. Маркетплейс земли Казахстана.
          </p>
          <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
            <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
            Алматы, Казахстан
          </div>
        </div>

      </Container>
    </footer>
  );
}
