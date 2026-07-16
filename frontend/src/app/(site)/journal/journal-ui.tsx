/* =========================================================================
   Центр знаний — общие куски вёрстки трёх уровней (1:1 из макетов).
   ========================================================================= */

import Link from 'next/link';
import { Breadcrumbs, type BreadcrumbNode } from '@/components/layout/breadcrumbs';
import type { HubArticle } from './journal-data';

/* ссылка: реальный роут → Link, демо '#' → <a> */
export function JLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (href.startsWith('/')) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} className={className}>{children}</a>;
}

/* полоса крошек (белая, с нижней границей — как в макете) */
export function JournalBreadcrumbBar({ trail }: { trail: BreadcrumbNode[] }) {
  return (
    <div className="bg-white border-b border-paper-3">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-3.5">
        <Breadcrumbs trail={trail} />
      </div>
    </div>
  );
}

/* нумерованный лейбл секции: 01 · ТЕМЫ ———— */
export function SecLabel({ num, name, className = 'mb-7' }: { num: string; name: string; className?: string }) {
  return (
    <div className={`sec-label ${className}`}>
      <span className="sec-num">{num}</span>
      <span className="sec-name">{name}</span>
      <span className="sec-rule" />
    </div>
  );
}

/* CTA «Ищете земельный участок?» — одинаковый на всех трёх уровнях */
export function JournalCta({ note = 'от ИЖС до готового бизнеса' }: { note?: string }) {
  return (
    <section className="bg-brand-50 border-b border-brand-100">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="font-black tracking-tightest text-[26px] sm:text-[38px] leading-tight text-ink-900">Ищете земельный участок?</h2>
        <p className="mt-3 text-[15px] sm:text-[16px] text-ink-600 max-w-md mx-auto leading-snug">1 284 проверенных участка по всему Казахстану — {note}.</p>
        <Link href="/catalog" className="mt-7 inline-flex px-7 h-13 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-[15px] hover:bg-brand-700 transition items-center gap-2 shadow-[0_12px_32px_-12px_rgba(6,111,54,.55)]">
          Перейти в каталог <span>→</span>
        </Link>
      </div>
    </section>
  );
}

/* карточка статьи с описанием и метой (популярные / сетка темы) */
export function ArticleCard({ a, mobileW }: { a: HubArticle; mobileW?: string }) {
  return (
    <JLink href={a.href} className={`j-tile ${mobileW ?? ''} j-card overflow-hidden flex flex-col hover:border-brand-300 transition`}>
      <div className={`${a.tone} aspect-[16/9] relative`}>
        <span className="absolute bottom-3 left-3 mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">{a.cat}</span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="font-bold text-[18px] text-ink-900 tracking-tight leading-snug">{a.title}</div>
        {a.desc && <p className="mt-2 text-[13.5px] text-ink-500 leading-snug flex-1">{a.desc}</p>}
        <div className="mt-4 pt-4 border-t border-paper-3 flex flex-wrap gap-x-3 gap-y-1 mono text-[11px] text-ink-400 uppercase tracking-[0.05em]">
          <span>{a.time}</span><span>·</span><span>{a.date}</span>
          {a.views && <><span>·</span><span className="num">{a.views} просм.</span></>}
        </div>
      </div>
    </JLink>
  );
}
