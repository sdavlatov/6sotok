/* =========================================================================
   Центр знаний — демо-данные из макетов «Дизайн html/Журнал знаний».
   На бою заменяются данными из CMS (см. README пакета).
   ========================================================================= */

export type Tone = 'map-mini' | 'map-water' | 'plot-amber';

/* ---------- иконки тем (инлайн-SVG path из макета) ---------- */
export const TOPIC_ICONS: Record<string, string> = {
  buy: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  sell: '<path d="M4 19V6M4 19h16M8 15l4-5 3 3 4-6"/>',
  docs: '<path d="M8 3h6l4 4v14H8z"/><path d="M14 3v4h4"/><path d="M10 12h4M10 16h4"/>',
  izhs: '<path d="M4 11 12 4l8 7M6 10v9h12v-9"/>',
  biz: '<path d="M3 16V6h11v10M14 9h4l3 3v4h-7M3 16h1a2 2 0 0 0 4 0h6a2 2 0 0 0 4 0h1"/>',
  farm: '<path d="M3 21V10l4-3 4 3v11M13 21v-8l4-3 4 3v8M3 21h18"/>',
  tax: '<path d="M4 4h16v16H4z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  cad: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  build: '<path d="M4 21V9l8-6 8 6v12M9 21v-6h6v6"/>',
  invest: '<path d="M4 19V6M4 19h16M8 15l4-5 3 3 4-6"/>',
};

/* ---------- уровень 1 · хаб ---------- */

export interface Topic { title: string; ic: keyof typeof TOPIC_ICONS; href: string }
export const TOPICS: Topic[] = [
  { title: 'Покупка', ic: 'buy', href: '#' },
  { title: 'Продажа', ic: 'sell', href: '#' },
  { title: 'Документы', ic: 'docs', href: '/journal/docs' },
  { title: 'ИЖС', ic: 'izhs', href: '#' },
  { title: 'Коммерция', ic: 'biz', href: '#' },
  { title: 'Фермерские земли', ic: 'farm', href: '#' },
  { title: 'Налоги', ic: 'tax', href: '#' },
  { title: 'Кадастр', ic: 'cad', href: '#' },
  { title: 'Строительство', ic: 'build', href: '#' },
  { title: 'Инвестиции', ic: 'invest', href: '#' },
];

export interface HubArticle {
  cat: string; time: string; date: string; views?: string;
  tone: Tone; title: string; desc?: string; href: string;
}
export const POPULAR_ARTICLES: HubArticle[] = [
  { cat: 'Проверка', time: '6 минут', date: '28 июня 2026', views: '2 480', tone: 'map-mini', title: '5 документов, которые стоит проверить перед покупкой', desc: 'Какие документы подтверждают, что участок можно купить без риска.', href: '/journal/docs/5-dokumentov-pered-pokupkoy' },
  { cat: 'Право', time: '5 минут', date: '21 июня 2026', views: '2 110', tone: 'plot-amber', title: 'ИЖС или ЛПХ: чем отличаются и что можно строить', desc: 'Категория земли решает, что и как можно возвести на участке.', href: '#' },
  { cat: 'Кадастр', time: '3 минуты', date: '14 июня 2026', views: '1 870', tone: 'map-water', title: 'Как проверить кадастровый номер за 2 минуты', desc: 'Пошаговая инструкция для покупателей без юридического опыта.', href: '#' },
];

export const RECENT: HubArticle[] = [
  { cat: 'Налоги', time: '4 минуты', date: '2 июля 2026', tone: 'map-mini', title: 'Как считается земельный налог для физлиц', href: '#' },
  { cat: 'Инвестиции', time: '5 минут', date: '30 июня 2026', tone: 'plot-amber', title: 'Земля вдоль трасс: почему она дорожает быстрее остальных', href: '#' },
  { cat: 'Стройка', time: '4 минуты', date: '26 июня 2026', tone: 'map-water', title: 'Что такое красная линия и как она ограничивает стройку', href: '#' },
  { cat: 'Документы', time: '3 минуты', date: '19 июня 2026', tone: 'map-mini', title: 'Перевод земли под коммерцию: сколько стоит и сколько ждать', href: '#' },
  { cat: 'ИЖС', time: '6 минут', date: '11 июня 2026', tone: 'plot-amber', title: 'Можно ли строить дом на землях ЛПХ', href: '#' },
  { cat: 'Коммерция', time: '5 минут', date: '4 июня 2026', tone: 'map-water', title: 'Готовый бизнес на земле: как считать окупаемость', href: '#' },
];

export interface Series { title: string; desc: string; steps: string[] }
export const SERIES: Series[] = [
  { title: 'Как купить участок', desc: 'Пошаговое руководство от поиска до регистрации права.', steps: ['Определить бюджет и цель', 'Найти и сравнить варианты', 'Проверить документы', 'Оформить задаток', 'Зарегистрировать сделку'] },
  { title: 'Как продать участок быстро', desc: 'Что подготовить и как оформить объявление, чтобы найти покупателя за недели, а не месяцы.', steps: ['Подготовить документы', 'Оценить рынок района', 'Собрать объявление', 'Провести показ и торг'] },
];

export interface Question { q: string; href: string }
export const QUESTIONS: Question[] = [
  { q: 'Можно ли строить на ЛПХ?', href: '#' },
  { q: 'Что такое ИЖС?', href: '#' },
  { q: 'Как проверить участок?', href: '#' },
  { q: 'Как узнать кадастровый номер?', href: '/journal/docs/5-dokumentov-pered-pokupkoy' },
  { q: 'Нужен ли нотариус при покупке?', href: '#' },
  { q: 'Что делать, если участок в залоге?', href: '#' },
];

export const CALCS = ['Налог', 'Стоимость', 'Площадь', 'Ипотека', 'Размер участка'];
export const DOCS_SOON = ['Образцы договоров', 'Заявления', 'Документы'];

/* ---------- уровень 2 · тема «Документы» ---------- */

export interface TopicArticle {
  slug: string; cat: string; time: string; date: string; sortDate: string;
  views: number; tone: Tone; title: string; desc: string;
}
export const TOPIC_ARTICLES: TopicArticle[] = [
  { slug: '5-dokumentov-pered-pokupkoy', cat: 'Проверка', time: '6 минут', date: '28 июня 2026', sortDate: '2026-06-28', views: 2480, tone: 'map-mini', title: '5 документов, которые стоит проверить перед покупкой', desc: 'Какие бумаги подтверждают, что участок можно купить без риска.' },
  { slug: '', cat: 'Документы', time: '4 минуты', date: '19 июня 2026', sortDate: '2026-06-19', views: 1430, tone: 'plot-amber', title: 'Перевод земли под коммерцию: сколько стоит и сколько ждать', desc: 'Что нужно изменить в статусе участка перед стройкой бизнеса.' },
  { slug: '', cat: 'Документы', time: '5 минут', date: '9 июня 2026', sortDate: '2026-06-09', views: 1260, tone: 'map-water', title: 'Госакт и кадастровый паспорт: в чём разница', desc: 'Два похожих документа отвечают на разные вопросы о земле.' },
  { slug: '', cat: 'Документы', time: '3 минуты', date: '2 июня 2026', sortDate: '2026-06-02', views: 980, tone: 'map-mini', title: 'Доверенность на продажу земли: что обязательно проверить', desc: 'Как не купить участок у человека без права его продавать.' },
  { slug: '', cat: 'Документы', time: '4 минуты', date: '27 мая 2026', sortDate: '2026-05-27', views: 860, tone: 'plot-amber', title: 'Как оформить куплю-продажу участка: список документов', desc: 'Полный список бумаг для сделки — от задатка до регистрации.' },
  { slug: '', cat: 'Документы', time: '3 минуты', date: '20 мая 2026', sortDate: '2026-05-20', views: 710, tone: 'map-water', title: 'Справка об отсутствии обременений: где и как получить', desc: 'Один визит, который снимает риск купить участок в залоге.' },
];

/* ---------- уровень 3 · статья ---------- */

export const ARTICLE_SECTIONS = [
  { id: 's1', label: 'Государственный акт' },
  { id: 's2', label: 'Кадастровый номер' },
  { id: 's3', label: 'Категория земель' },
  { id: 's4', label: 'Технические условия' },
  { id: 's5', label: 'Обременения и споры' },
  { id: 's6', label: 'Чек-лист проверки' },
];

export interface RelatedArticle { cat: string; time: string; tone: Tone; title: string }
export const RELATED: RelatedArticle[] = [
  { cat: 'Право', time: '5 минут', tone: 'map-mini', title: 'ИЖС или ЛПХ: чем отличаются и что можно строить' },
  { cat: 'Стройка', time: '4 минуты', tone: 'plot-amber', title: 'Что такое красная линия и как она ограничивает стройку' },
  { cat: 'Кадастр', time: '3 минуты', tone: 'map-water', title: 'Как проверить кадастровый номер за 2 минуты' },
];

export interface RelatedListing { tone: Tone; price: string; per: string; city: string; area: string }
export const LISTS: RelatedListing[] = [
  { tone: 'map-mini', price: '12 500 000 ₸', per: '1 250 000 ₸/сот.', city: 'Каскелен, ИЖС', area: '10 сот.' },
  { tone: 'plot-amber', price: '9 800 000 ₸', per: '1 225 000 ₸/сот.', city: 'Иссык, дача', area: '8 сот.' },
  { tone: 'map-water', price: '27 900 000 ₸', per: '1 550 000 ₸/сот.', city: 'Талгар, ИЖС', area: '18 сот.' },
  { tone: 'map-mini', price: '18 400 000 ₸', per: '1 840 000 ₸/сот.', city: 'Бесагаш, ИЖС', area: '10 сот.' },
];

export interface PopularMaterial { cat: string; title: string; views: string }
export const POPULAR_MATERIALS: PopularMaterial[] = [
  { cat: 'Проверка', title: '5 документов, которые стоит проверить перед покупкой', views: '2 480' },
  { cat: 'Стройка', title: 'Можно ли строить дом на землях ЛПХ', views: '1 960' },
  { cat: 'Налоги', title: 'Как считается земельный налог для физлиц', views: '1 540' },
  { cat: 'Инвестиции', title: 'Земля вдоль трасс: почему она дорожает быстрее остальных', views: '1 210' },
];

/* ---------- поисковый индекс хаба ---------- */
export interface SearchItem { title: string; href: string; cat: string }
export const SEARCH_INDEX: SearchItem[] = [
  ...POPULAR_ARTICLES.map(a => ({ title: a.title, href: a.href, cat: a.cat })),
  ...RECENT.map(a => ({ title: a.title, href: a.href, cat: a.cat })),
  ...QUESTIONS.map(q => ({ title: q.q, href: q.href, cat: 'Вопрос' })),
];
