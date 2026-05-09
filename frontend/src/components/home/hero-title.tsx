'use client';

export function HeroTitle() {
  return (
    <h1 className="font-black leading-[0.94] text-zinc-900"
      style={{ fontSize: 'clamp(48px, 7vw, 84px)', letterSpacing: '-0.05em' }}>
      <span className="word" style={{ animationDelay: '0.05s' }}>Найдите</span>{' '}
      <span className="word" style={{ animationDelay: '0.15s' }}>идеальный</span>
      <br />
      <span className="word" style={{ animationDelay: '0.25s' }}>земельный участок</span>
      <br />
      <span className="word text-zinc-400" style={{ animationDelay: '0.35s' }}>для жизни</span>{' '}
      <span className="word text-zinc-400" style={{ animationDelay: '0.45s' }}>и бизнеса.</span>
    </h1>
  );
}
