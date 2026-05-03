import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Правила размещения — 6sotok.kz',
  description: 'Правила публикации объявлений на платформе 6sotok.kz.',
};

const rules = [
  {
    n: '1',
    title: 'Достоверность информации',
    items: [
      'Указывайте реальную площадь, цену и расположение участка.',
      'Фотографии должны соответствовать реальному объекту.',
      'Не допускается публикация чужих фото без разрешения.',
      'Цена в объявлении должна совпадать с ценой при продаже.',
    ],
  },
  {
    n: '2',
    title: 'Что запрещено размещать',
    items: [
      'Объявления на объекты, которые не принадлежат вам или вашему агентству.',
      'Дублирующиеся объявления на один и тот же объект.',
      'Объекты с судебными спорами или арестом без указания этого факта.',
      'Рекламу услуг, не связанных с продажей земли или бизнеса.',
      'Контактные данные в тексте описания (используйте поля для контактов).',
    ],
  },
  {
    n: '3',
    title: 'Требования к фото и видео',
    items: [
      'Минимум одно фото реального объекта обязательно.',
      'Запрещены фото с явными водяными знаками других платформ.',
      'Видео принимается в форматах MP4, MOV. Вертикальное видео 9:16 приветствуется.',
      'Фото должны быть чёткими и сделаны при хорошем освещении.',
    ],
  },
  {
    n: '4',
    title: 'Ценообразование',
    items: [
      'Цена указывается в тенге (₸), включая НДС если применимо.',
      'При указании "Торг уместен" реальные переговоры по цене обязательны.',
      'Запрещено указывать цену значительно ниже рынка для привлечения трафика.',
    ],
  },
  {
    n: '5',
    title: 'Агентства и риелторы',
    items: [
      'Агентства должны иметь верифицированный аккаунт.',
      'Указывайте, что продаёте как агент, а не от собственника.',
      'Нельзя публиковать одно и то же объявление от имени нескольких риелторов.',
    ],
  },
  {
    n: '6',
    title: 'Модерация и удаление',
    items: [
      'Все объявления проходят модерацию в течение 24 часов.',
      'Нарушающие правила объявления удаляются без предупреждения.',
      'При систематических нарушениях аккаунт блокируется.',
      'Оспорить удаление можно написав на info@6sotok.kz.',
    ],
  },
];

export default function RulesPage() {
  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Документы</p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-3">Правила размещения</h1>
        <p className="text-[15px] text-zinc-400 mb-12">Последнее обновление: май 2025</p>

        <div className="space-y-8">
          {rules.map(r => (
            <div key={r.n} className="bg-white rounded-2xl p-7" style={{ border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start gap-4 mb-5">
                <span className="text-[28px] font-black text-zinc-100 leading-none shrink-0">{r.n}</span>
                <h2 className="text-[17px] font-semibold text-zinc-900 pt-1">{r.title}</h2>
              </div>
              <ul className="space-y-2.5">
                {r.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-zinc-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl" style={{ background: '#f0fdf4', border: '1px solid rgba(6,111,54,0.15)' }}>
          <p className="text-[14px] text-zinc-600 leading-relaxed">
            Размещая объявление, вы соглашаетесь с настоящими правилами и{' '}
            <a href="/terms" className="text-primary hover:underline font-medium">пользовательским соглашением</a>.
            По вопросам обращайтесь на{' '}
            <a href="mailto:info@6sotok.kz" className="text-primary hover:underline font-medium">info@6sotok.kz</a>.
          </p>
        </div>

      </div>
    </div>
  );
}
