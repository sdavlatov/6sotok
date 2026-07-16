/* =========================================================================
   Центр знаний · уровень 1 — хаб (/journal)
   1:1 порт макета «Дизайн html/Журнал знаний/journal.html»
   ========================================================================= */

import type { Metadata } from 'next';
import './journal.css';
import { JournalBreadcrumbBar, JournalCta, SecLabel, JLink, ArticleCard } from './journal-ui';
import { JournalSearch } from './journal-search';
import { TOPICS, TOPIC_ICONS, POPULAR_ARTICLES, RECENT, SERIES, QUESTIONS, CALCS, DOCS_SOON } from './journal-data';

export const metadata: Metadata = {
  title: 'Центр знаний о земельных участках — 6sotok.kz',
  description: 'Статьи, инструкции, разборы законодательства, советы по покупке, продаже и оформлению земельных участков.',
};

export default function JournalHubPage() {
  return (
    <div className="journal">
      <JournalBreadcrumbBar trail={[{ label: 'Центр знаний' }]} />

      {/* ============================== HERO + SEARCH ============================== */}
      <section className="bg-white border-b border-paper-3 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-14 sm:pb-20">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[12px] font-semibold tracking-tight">База знаний 6sotok</span>
              <h1 className="mt-5 font-black tracking-tightest text-[34px] leading-[1.02] sm:text-[48px] sm:leading-[0.98] text-ink-900">
                Центр знаний<br className="hidden sm:block" /> о земельных участках
              </h1>
              <p className="mt-4 text-[16px] sm:text-[17.5px] text-ink-600 leading-relaxed max-w-md">
                Статьи, инструкции, разборы законодательства, советы по покупке, продаже и оформлению земельных участков.
              </p>
              <JournalSearch />
            </div>

            <div className="illu-wrap hidden sm:block max-w-md mx-auto w-full">
              <div className="illu-card map-mini w-[78%] aspect-[4/3] top-[6%] left-0 p-4 flex items-end">
                <span className="mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">карта участка</span>
              </div>
              <div className="illu-card bg-white border border-paper-3 w-[62%] aspect-[4/5] bottom-[2%] right-0 p-6 illu-lines flex flex-col justify-center gap-3">
                <span className="mono text-[10px] uppercase tracking-[0.1em] text-ink-400 mb-1">документ</span>
                <span style={{ width: '80%' }} /><span style={{ width: '60%' }} /><span style={{ width: '70%' }} /><span style={{ width: '45%' }} />
              </div>
              <div className="illu-card bg-brand-600 text-white w-[124px] h-[124px] rounded-full top-[40%] left-[46%] flex flex-col items-center justify-center gap-1 shadow-[0_20px_50px_-16px_rgba(6,111,54,.6)]">
                <span className="mono text-[9px] uppercase tracking-[0.1em] opacity-80">кадастр</span>
                <span className="font-black text-[13px] tracking-tight">03-042-118</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== 01 · ТЕМЫ ============================== */}
      <section id="temy" className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="01" name="Темы" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {TOPICS.map(t => (
              <JLink key={t.title} href={t.href} className="j-tile topic-tile hover:border-brand-300 transition">
                <span className="topic-ic">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: TOPIC_ICONS[t.ic] }} />
                </span>
                <span className="font-bold text-[14.5px] text-ink-900 tracking-tight leading-snug">{t.title}</span>
              </JLink>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 02 · ПОПУЛЯРНЫЕ СТАТЬИ ============================== */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="02" name="Популярные статьи" />
          <div className="scroll-row no-sb grid-cols-3 gap-5">
            {POPULAR_ARTICLES.map(a => <ArticleCard key={a.title} a={a} mobileW="w-[280px] md:w-auto" />)}
          </div>
        </div>
      </section>

      {/* ============================== 03 · ПОСЛЕДНИЕ ПУБЛИКАЦИИ ============================== */}
      <section className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="03" name="Последние публикации" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RECENT.map(a => (
              <JLink key={a.title} href={a.href} className="j-tile j-card overflow-hidden flex flex-col hover:border-brand-300 transition">
                <div className={`${a.tone} aspect-[16/9] relative`}>
                  <span className="absolute bottom-3 left-3 mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">{a.cat}</span>
                </div>
                <div className="p-5">
                  <div className="font-bold text-[16px] text-ink-900 tracking-tight leading-snug">{a.title}</div>
                  <div className="mt-3 pt-3 border-t border-paper-3 flex gap-x-3 mono text-[10.5px] text-ink-400 uppercase tracking-[0.05em]"><span>{a.time}</span><span>·</span><span>{a.date}</span></div>
                </div>
              </JLink>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 04 · СЕРИИ СТАТЕЙ ============================== */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="04" name="Серии статей" />
          <div className="grid lg:grid-cols-2 gap-5">
            {SERIES.map(s => (
              <div key={s.title} className="j-card p-7 sm:p-8">
                <div className="mono text-[10.5px] uppercase tracking-[0.1em] text-brand-600">Пошаговое руководство · {s.steps.length} частей</div>
                <div className="mt-2.5 font-black tracking-tight text-[22px] sm:text-[25px] text-ink-900 leading-snug">{s.title}</div>
                <p className="mt-2 text-[14px] text-ink-500 leading-snug max-w-sm">{s.desc}</p>
                <div className="mt-5 flex flex-col gap-1">
                  {s.steps.map((st, i) => (
                    <a key={st} href="#" className="j-tile group flex items-center gap-3.5 py-2.5 px-2 rounded-xl hover:bg-paper-2 transition">
                      <span className="mono w-6 h-6 rounded-full bg-paper-2 text-ink-500 flex items-center justify-center text-[11px] font-bold shrink-0 group-hover:bg-brand-600 group-hover:text-white transition">{i + 1}</span>
                      <span className="text-[14.5px] font-medium text-ink-700 group-hover:text-ink-900 transition">{st}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 05 · ПОПУЛЯРНЫЕ ВОПРОСЫ ============================== */}
      <section className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="05" name="Популярные вопросы" className="mb-7" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUESTIONS.map(q => (
              <JLink key={q.q} href={q.href} className="j-tile q-card hover:border-brand-300 transition">
                <div className="font-bold text-[17px] text-ink-900 tracking-tight leading-snug">{q.q}</div>
                <span className="text-[13.5px] font-semibold text-brand-600 inline-flex items-center gap-1.5">Читать <span>→</span></span>
              </JLink>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 06 · КАЛЬКУЛЯТОРЫ ============================== */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="06" name="Калькуляторы" />
          <div className="scroll-row no-sb grid-cols-5 gap-3.5">
            {CALCS.map(c => (
              <div key={c} className="muted-tile w-[150px] md:w-auto flex flex-col gap-3">
                <div className="font-bold text-[14px] text-ink-700">{c}</div>
                <span className="mono text-[9.5px] uppercase tracking-[0.1em] text-ink-400">Скоро</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 07 · ДОКУМЕНТЫ ============================== */}
      <section id="dokumenty" className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="07" name="Документы" />
          <div className="scroll-row no-sb grid-cols-3 gap-3.5">
            {DOCS_SOON.map(d => (
              <div key={d} className="muted-tile w-[190px] md:w-auto flex items-center justify-between gap-3">
                <div className="font-bold text-[14px] text-ink-700">{d}</div>
                <span className="mono text-[9.5px] uppercase tracking-[0.1em] text-ink-400">Скоро</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <JournalCta />
    </div>
  );
}
