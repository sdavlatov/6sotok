import { Container } from '../layout/container';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-32">
      {/* Premium Background Mesh Glow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-[-20%] opacity-40 pointer-events-none">
        <div className="h-[600px] w-[1000px] rounded-full bg-gradient-to-tr from-primary-soft via-emerald-50 to-accent blur-3xl animate-pulse" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/50 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Маркетплейс земли №1 в Казахстане
          </div>

          <h1 className="text-5xl font-black tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl">
            Найдите идеальный <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              участок для жизни и бизнеса
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-500 font-medium">
            Свежие объявления от собственников. Понятные цены за сотку, сразу видны коммуникации, 
            целевое назначение и расположение на карте.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-semibold text-zinc-600">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 border border-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              Строгий отбор объявлений
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 border border-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              Точная цена за сотку
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2 border border-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              Вся правда о коммуникациях
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
