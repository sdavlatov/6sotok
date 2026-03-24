import { Container } from '../layout/container';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-[-30%] opacity-30 pointer-events-none">
        <div className="h-[600px] w-[900px] rounded-full bg-gradient-to-tr from-primary-soft via-emerald-50 to-accent blur-[100px]" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/50 px-4 py-1.5 text-[11px] uppercase tracking-widest font-bold text-primary backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Маркетплейс земли №1 в Казахстане
          </div>

          <h1 className="text-5xl font-black tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl leading-[1.05]">
            Найдите идеальный{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              участок для жизни и бизнеса
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg text-zinc-500 font-normal leading-relaxed">
            Напрямую от собственников. Точные цены за сотку, сразу видны коммуникации,
            целевое назначение и расположение на карте.
          </p>

        </div>
      </Container>
    </section>
  );
}
