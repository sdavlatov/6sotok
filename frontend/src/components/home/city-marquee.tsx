const CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Актобе', 'Қарағанды', 'Тараз',
  'Павлодар', 'Семей', 'Атырау', 'Костанай', 'Орал', 'Актау',
  'Петропавл', 'Өскемен', 'Кокшетау', 'Талдықорған', 'Туркестан',
  'Экібастұз', 'Рудный', 'Жезқазған',
];

const DOUBLED = [...CITIES, ...CITIES];

export function CityMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-zinc-100 bg-white py-2.5">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div
        className="flex items-center whitespace-nowrap pointer-events-none select-none"
        style={{ animation: 'marquee 40s linear infinite', width: 'max-content' }}
      >
        {DOUBLED.map((city, i) => (
          <span key={i} className="flex items-center">
            <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 px-5">
              {city}
            </span>
            <span className="text-zinc-200 text-[10px]">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
