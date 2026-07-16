/* =========================================================================
   Центр знаний · уровень 3 — статья (/journal/docs/[slug])
   1:1 порт макета «Дизайн html/Журнал знаний/journal-article.html»
   Пока одна демо-статья; при интеграции CMS контент приходит с бэкенда.
   ========================================================================= */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import '../../journal.css';
import { JournalBreadcrumbBar, JournalCta, SecLabel } from '../../journal-ui';
import { ReadProgress, TocDesktop, TocMobile } from './article-toc';
import { RELATED, LISTS, POPULAR_MATERIALS } from '../../journal-data';

const ARTICLE_SLUG = '5-dokumentov-pered-pokupkoy';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== ARTICLE_SLUG) return {};
  return {
    title: '5 документов, которые стоит проверить перед покупкой участка — Центр знаний 6sotok',
    description: 'Разбираем, какие документы подтверждают, что участок действительно можно купить без риска — и что в них искать, прежде чем переводить задаток.',
  };
}

export function generateStaticParams() {
  return [{ slug: ARTICLE_SLUG }];
}

/* плейсхолдер изображения (замена <image-slot> из макета) */
function ImgSlot({ label }: { label?: string }) {
  return <span className="img-slot">{label && <span>{label}</span>}</span>;
}

function SectionH2({ id, num, children }: { id: string; num: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 mb-4 font-black tracking-tight text-[24px] sm:text-[28px] text-ink-900 flex items-baseline gap-3">
      <span className="mono text-[14px] text-brand-600 font-bold">{num}</span>{children}
    </h2>
  );
}

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== ARTICLE_SLUG) notFound();

  return (
    <div className="journal">
      <ReadProgress />

      <JournalBreadcrumbBar trail={[
        { label: 'Центр знаний', href: '/journal' },
        { label: 'Документы', href: '/journal/docs' },
        { label: '5 документов перед покупкой' },
      ]} />

      {/* ============================== ARTICLE HEADER ============================== */}
      <header className="bg-white border-b border-paper-3">
        <div className="max-w-[820px] mx-auto px-5 sm:px-6 pt-10 sm:pt-14 pb-8">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[12px] font-semibold tracking-tight">Документы</span>
            <span className="mono text-[11px] uppercase tracking-[0.1em] text-ink-400">Проверка перед покупкой</span>
          </div>
          <h1 className="mt-5 font-black tracking-tightest text-[32px] leading-[1.04] sm:text-[46px] sm:leading-[1.02] text-ink-900">
            5 документов, которые стоит проверить перед покупкой участка
          </h1>
          <p className="mt-4 text-[16px] sm:text-[18px] text-ink-600 leading-relaxed max-w-[680px]">
            Разбираем, какие документы подтверждают, что участок действительно можно купить без риска — и что в них искать, прежде чем переводить задаток.
          </p>

          <div className="mt-7 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-ink-900 text-white flex items-center justify-center font-bold text-[13px] tracking-tight shrink-0">Р</span>
              <div className="text-[13.5px] leading-tight">
                <div className="font-semibold text-ink-900">Редакция 6sotok</div>
                <div className="text-ink-400 mt-0.5">Центр знаний</div>
              </div>
            </div>
            <div className="flex items-center gap-4 mono text-[12px] text-ink-400 uppercase tracking-[0.06em]">
              <span>6 минут чтения</span>
              <span className="w-1 h-1 rounded-full bg-ink-300" />
              <span>28 июня 2026</span>
              <span className="w-1 h-1 rounded-full bg-ink-300" />
              <span className="num">2 480 просмотров</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1040px] mx-auto px-5 sm:px-6 pb-10 sm:pb-14">
          <div className="rounded-3xl overflow-hidden aspect-[16/8] sm:aspect-[16/6] relative">
            <ImgSlot label="Обложка статьи — документы и кадастровая карта" />
          </div>
        </div>
      </header>

      {/* ============================== BODY: TOC + CONTENT ============================== */}
      <section className="bg-white">
        <div className="max-w-[1040px] mx-auto px-5 sm:px-6 py-10 sm:py-14">

          <TocMobile />

          <div className="grid lg:grid-cols-[220px_1fr] gap-10 xl:gap-14 items-start">
            {/* desktop sidebar */}
            <aside className="hidden lg:block sticky top-[84px] self-start">
              <div className="mono text-[10.5px] uppercase tracking-[0.13em] text-ink-400 mb-2 px-2.5">Содержание</div>
              <TocDesktop />

              <div className="mt-8 pt-6 border-t border-paper-3 px-0.5">
                <div className="mono text-[10.5px] uppercase tracking-[0.13em] text-ink-400 mb-3">Из каталога</div>
                <div className="flex flex-col gap-3">
                  <Link href="/catalog?util=act" className="j-tile flex items-center gap-3 group">
                    <span className="map-mini w-14 h-14 rounded-xl shrink-0 relative overflow-hidden" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink-900 group-hover:text-brand-600 transition truncate">12,5 млн ₸</div>
                      <div className="text-[11.5px] text-ink-400 truncate">Каскелен · госакт</div>
                    </div>
                  </Link>
                  <Link href="/catalog?util=act" className="j-tile flex items-center gap-3 group">
                    <span className="plot-amber w-14 h-14 rounded-xl shrink-0 relative overflow-hidden" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink-900 group-hover:text-brand-600 transition truncate">9,8 млн ₸</div>
                      <div className="text-[11.5px] text-ink-400 truncate">Иссык · госакт</div>
                    </div>
                  </Link>
                </div>
                <Link href="/catalog?util=act" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700 transition">Все участки с госактом <span>→</span></Link>
              </div>
            </aside>

            {/* article content */}
            <div className="prose min-w-0 max-w-[680px]">
              <p className="text-[16px] sm:text-[17px] leading-relaxed">
                Покупка земли — это в первую очередь покупка бумаг, а не картинки на карте. Участок может выглядеть идеально и стоить дёшево, но без правильных документов сделку либо не зарегистрируют, либо она обернётся спором через пару лет. Разбираем пять документов, которые стоит увидеть своими глазами до того, как вы отдали задаток.
              </p>

              <SectionH2 id="s1" num="01">Государственный акт на землю</SectionH2>
              <p className="leading-relaxed mb-5">Это главный документ, подтверждающий право собственности. В госакте указаны кадастровый номер, точная площадь, категория земель и целевое назначение участка. Сверьте ФИО собственника в акте с паспортом продавца — если участок продаёт не сам собственник, попросите нотариальную доверенность с прямым правом на продажу.</p>
              <p className="leading-relaxed mb-5">Если вместо госакта продавец показывает только договор купли-продажи предыдущего владельца или расписку — это повод насторожиться. Право собственности переходит не по расписке, а по регистрации в реестре недвижимости.</p>

              <SectionH2 id="s2" num="02">Кадастровый номер и паспорт участка</SectionH2>
              <p className="leading-relaxed mb-5">Кадастровый номер — это уникальный идентификатор участка, по которому можно поднять всю его историю: границы, площадь, обременения, кадастровую стоимость. Попросите у продавца кадастровый номер и проверьте его самостоятельно, не полагаясь только на слова.</p>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>Совпадает ли площадь в кадастре с тем, что заявлено в объявлении</li>
                <li>Совпадают ли границы участка с тем, что показывают на месте</li>
                <li>Нет ли наложения границ на соседние участки</li>
              </ul>

              <div className="j-card p-6 sm:p-7 my-8 bg-brand-50/60 border-brand-100">
                <div className="mono text-[10.5px] uppercase tracking-[0.12em] text-brand-700 mb-2">Из каталога 6sotok</div>
                <div className="font-bold text-[18px] sm:text-[20px] text-ink-900 tracking-tight leading-snug">Участки с уже заполненными кадастровыми данными</div>
                <p className="mt-2 text-[14px] text-ink-600 leading-snug max-w-md">На 6sotok кадастровый номер, площадь и границы указаны в самом объявлении — сверять придётся меньше.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/catalog?util=act" className="j-tile flex items-center gap-2.5 bg-white rounded-xl border border-paper-3 pr-4 group">
                    <span className="map-mini w-12 h-12 rounded-l-xl shrink-0 relative overflow-hidden" />
                    <span className="text-[13px] font-bold text-ink-900 group-hover:text-brand-600 transition">18 400 000 ₸</span>
                  </Link>
                  <Link href="/catalog?util=act" className="j-tile flex items-center gap-2.5 bg-white rounded-xl border border-paper-3 pr-4 group">
                    <span className="map-water w-12 h-12 rounded-l-xl shrink-0 relative overflow-hidden" />
                    <span className="text-[13px] font-bold text-ink-900 group-hover:text-brand-600 transition">27 900 000 ₸</span>
                  </Link>
                </div>
                <Link href="/catalog?util=act" className="mt-5 inline-flex px-5 h-11 rounded-xl bg-brand-600 text-white font-semibold text-[14px] items-center gap-2 hover:bg-brand-700 transition">Смотреть участки <span>→</span></Link>
              </div>

              <SectionH2 id="s3" num="03">Категория земель и целевое назначение</SectionH2>
              <p className="leading-relaxed mb-5">От категории земли зависит, что на ней вообще можно строить. ИЖС и ЛПХ позволяют возвести жилой дом, но по-разному регулируют этажность и подключение коммуникаций. Сельхозземли строить дом не позволяют вовсе — перевод категории займёт месяцы и не гарантирован.</p>
              <p className="leading-relaxed mb-5">Спросите у продавца не только категорию, но и «целевое назначение» из акта — иногда участок числится как ИЖС, но с ограничением по разрешённому использованию, которое не видно на глаз.</p>

              <SectionH2 id="s4" num="04">Технические условия на коммуникации</SectionH2>
              <p className="leading-relaxed mb-5">Свет, газ и вода «по границе» — это не одно и то же, что подключение. Попросите технические условия (ТУ) от поставщика ресурса или хотя бы акт о наличии сетей рядом с участком. Иначе подключение может стоить в разы дороже, чем ожидалось, а иногда занять больше года.</p>

              <div className="j-card p-6 sm:p-7 my-8 bg-brand-50/60 border-brand-100">
                <div className="mono text-[10.5px] uppercase tracking-[0.12em] text-brand-700 mb-2">Из каталога 6sotok</div>
                <div className="font-bold text-[18px] sm:text-[20px] text-ink-900 tracking-tight leading-snug">Участки с уже подключёнными коммуникациями</div>
                <p className="mt-2 text-[14px] text-ink-600 leading-snug max-w-md">Свет, газ и вода отмечены прямо в карточке объявления — фильтр убирает участки без подключения.</p>
                <Link href="/catalog?util=light,gas,water" className="mt-5 inline-flex px-5 h-11 rounded-xl bg-brand-600 text-white font-semibold text-[14px] items-center gap-2 hover:bg-brand-700 transition">Смотреть участки <span>→</span></Link>
              </div>

              <SectionH2 id="s5" num="05">Отсутствие обременений и споров</SectionH2>
              <p className="leading-relaxed mb-5">Участок может быть в залоге у банка, под арестом или в судебном споре о границах — и продавец не обязан рассказывать об этом сам. Закажите свежую справку об отсутствии обременений перед сделкой: это займёт один визит, но снимет большую часть риска.</p>

              <SectionH2 id="s6" num="06">Чек-лист: проверка за 5 минут</SectionH2>
              <div className="grid sm:grid-cols-2 gap-4 not-prose mb-6">
                {[
                  { n: '01', t: 'Госакт на имя продавца', d: 'ФИО совпадает с паспортом или доверенностью' },
                  { n: '02', t: 'Кадастровый номер сверен', d: 'Площадь и границы совпадают с фактом' },
                  { n: '03', t: 'Категория подходит под цель', d: 'Можно строить то, что вы планируете' },
                  { n: '04', t: 'ТУ на коммуникации на руках', d: 'Не только «рядом», а подтверждено бумагой' },
                ].map(c => (
                  <div key={c.n} className="j-card p-5">
                    <div className="mono text-[12px] text-brand-600 mb-3">{c.n}</div>
                    <div className="font-bold text-[15px] text-ink-900 tracking-tight">{c.t}</div>
                    <p className="mt-1.5 text-[13px] text-ink-500 leading-snug">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-paper-3 flex flex-wrap items-center gap-x-6 gap-y-2 mono text-[11.5px] uppercase tracking-[0.08em] text-ink-400">
                <span>обновлено 28 июня 2026</span><span className="w-1 h-1 rounded-full bg-ink-300" /><span>Центр знаний 6sotok</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== 01 · СВЯЗАННЫЕ СТАТЬИ ============================== */}
      <section className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="01" name="Связанные статьи" className="mb-6" />
          <div className="scroll-row no-sb grid-cols-3 gap-5">
            {RELATED.map(r => (
              <a key={r.title} href="#" className="j-tile w-[260px] md:w-auto j-card overflow-hidden flex flex-col hover:border-brand-300 transition">
                <div className={`${r.tone} aspect-[16/9] relative`}>
                  <span className="absolute bottom-3 left-3 mono text-[10.5px] uppercase tracking-[0.08em] text-ink-600 bg-white/80 px-2.5 py-1 rounded">{r.cat}</span>
                </div>
                <div className="p-6">
                  <div className="mono text-[11px] uppercase tracking-[0.08em] text-brand-600">{r.cat} · {r.time}</div>
                  <div className="mt-2.5 font-bold text-[17px] text-ink-900 tracking-tight leading-snug">{r.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 02 · ПОДХОДЯЩИЕ ОБЪЯВЛЕНИЯ ============================== */}
      <section className="bg-white border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="02" name="Подходящие объявления" className="mb-6" />
          <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
            <h2 className="font-black tracking-tightest text-[24px] sm:text-[32px] leading-none text-ink-900 max-w-lg">Участки ИЖС с госактом и коммуникациями</h2>
            <Link href="/catalog?util=act" className="text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition flex items-center gap-1.5 mb-1">Все объявления <span>→</span></Link>
          </div>
          <div className="scroll-row no-sb grid-cols-2 lg:grid-cols-4 gap-4">
            {LISTS.map(l => (
              <Link key={l.price} href="/catalog" className="j-tile w-[240px] md:w-auto j-card overflow-hidden flex flex-col hover:border-brand-300 transition">
                <div className={`${l.tone} aspect-[16/10] relative`}>
                  <span className="absolute top-3 right-3 mono text-[11px] font-semibold text-ink-700 bg-white/85 backdrop-blur px-2 py-1 rounded-md">{l.area}</span>
                </div>
                <div className="p-5">
                  <div className="font-black text-[19px] tracking-tighter text-brand-600 num">{l.price}</div>
                  <div className="mono text-[11.5px] text-ink-400 num mt-0.5">{l.per}</div>
                  <div className="mt-3 pt-3 border-t border-paper-3 text-[13px] font-medium text-ink-700">{l.city}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== 03 · ПОПУЛЯРНЫЕ МАТЕРИАЛЫ ============================== */}
      <section className="bg-paper border-b border-paper-3">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
          <SecLabel num="03" name="Популярные материалы" className="mb-6" />
          <div className="flex flex-col divide-y divide-paper-3 border-y border-paper-3">
            {POPULAR_MATERIALS.map((p, i) => (
              <a key={p.title} href="#" className="j-tile group py-5 flex items-start gap-4 hover:pl-1 transition-all">
                <span className="mono text-[12px] text-ink-400 pt-1">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <div className="mono text-[10.5px] uppercase tracking-[0.08em] text-ink-500 mb-1.5">{p.cat}</div>
                  <div className="font-bold text-[16.5px] text-ink-900 tracking-tight leading-snug group-hover:text-brand-600 transition">{p.title}</div>
                </div>
                <span className="mono text-[11.5px] text-ink-400 num shrink-0 pt-1">{p.views} просм.</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <JournalCta note="с кадастром, коммуникациями и госактом в карточке" />

      {/* плавающая мобильная CTA */}
      <Link href="/catalog" className="lg:hidden fixed z-40 bottom-4 right-4 inline-flex items-center gap-2 px-5 h-13 py-3.5 rounded-full bg-brand-600 text-white font-semibold text-[14.5px] shadow-[0_14px_32px_-10px_rgba(6,111,54,.6)]">
        Каталог <span>→</span>
      </Link>
    </div>
  );
}
