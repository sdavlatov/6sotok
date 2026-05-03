'use client';

import { useState, useEffect, useRef } from 'react';
import { Grid2x2 } from 'lucide-react';

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0]);

interface PhotoGridProps {
  images: string[];
  title: string;
}

export function PhotoGrid({ images, title }: PhotoGridProps) {
  const [lightbox, setLightbox] = useState(false);
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const total = images.length;

  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + total) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightbox, total]);

  const open = (i: number) => { setIdx(i); setLightbox(true); };

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) setIdx(i => diff > 0 ? (i + 1) % total : (i - 1 + total) % total);
    touchX.current = null;
  };

  if (!images.length) return null;

  const shown = images.slice(0, 5);

  return (
    <>
      {/* Мобайл: слайдер */}
      <div className="sm:hidden relative overflow-hidden rounded-2xl bg-zinc-100" style={{ aspectRatio: '4/3' }}>
        {isVideo(images[idx]) ? (
          <video src={images[idx]} controls playsInline className="w-full h-full object-contain bg-black" onClick={() => open(idx)} />
        ) : (
          <img src={images[idx]} alt={title} className="w-full h-full object-cover" onClick={() => open(idx)} />
        )}
        {total > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + total) % total)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => setIdx(i => (i + 1) % total)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {idx + 1}/{total}
            </div>
          </>
        )}
      </div>

      {/* Десктоп: сетка */}
      {total === 1 ? (
        isVideo(shown[0]) ? (
          /* Вертикальное видео 9:16 — центрируем, не растягиваем */
          <div className="hidden sm:flex justify-center rounded-2xl overflow-hidden bg-zinc-900 cursor-zoom-in" style={{ height: 500 }} onClick={() => open(0)}>
            <video src={shown[0]} className="h-full object-contain" style={{ maxWidth: '100%', aspectRatio: '9/16' }} muted playsInline />
          </div>
        ) : (
          <div className="hidden sm:block rounded-2xl overflow-hidden bg-zinc-100 cursor-zoom-in" style={{ aspectRatio: '16/9', maxHeight: 440 }} onClick={() => open(0)}>
            <img src={shown[0]} alt={title} className="w-full h-full object-cover hover:brightness-95 transition-all duration-300" />
          </div>
        )
      ) : total === 2 ? (
        <div className="hidden sm:grid grid-cols-2 gap-2 rounded-2xl overflow-hidden" style={{ height: '440px' }}>
          {shown.slice(0, 2).map((src, i) => (
            <div key={i} className="relative cursor-zoom-in group overflow-hidden" onClick={() => open(i)}>
              {isVideo(src) ? <video src={src} className="w-full h-full object-cover" muted playsInline /> : <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="hidden sm:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden" style={{ height: '440px' }}>
          {/* Большое фото — занимает 2 строки */}
          <div className="col-span-2 row-span-2 relative cursor-zoom-in group" onClick={() => open(0)}>
            {isVideo(shown[0]) ? (
              <video src={shown[0]} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={shown[0]} alt={title} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300" />
            )}
          </div>

          {/* до 4 маленьких фото — только реальные */}
          {[1, 2, 3, 4].map(i => shown[i] ? (
            <div key={i} className="relative cursor-zoom-in group overflow-hidden" onClick={() => open(i)}>
              {isVideo(shown[i]) ? (
                <video src={shown[i]} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={shown[i]} alt={`${title} ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-300" />
              )}
              {i === 4 && total > 5 && (
                <button
                  onClick={e => { e.stopPropagation(); open(0); }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-2 text-white font-semibold text-sm hover:bg-black/50 transition-colors"
                >
                  <Grid2x2 className="size-4" />
                  Все фото · {total}
                </button>
              )}
            </div>
          ) : null)}
        </div>
      )}

      {/* Лайтбокс */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/96 flex flex-col" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-white/50 text-sm font-semibold">{idx + 1} / {total}</span>
            <button onClick={() => setLightbox(false)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center relative min-h-0"
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            onClick={e => e.stopPropagation()}
          >
            {isVideo(images[idx]) ? (
              <video src={images[idx]} controls autoPlay playsInline className="max-h-full max-w-full" />
            ) : (
              <img src={images[idx]} alt={title} className="max-h-full max-w-full object-contain select-none" />
            )}
            {total > 1 && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + total) % total)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button onClick={() => setIdx(i => (i + 1) % total)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>

          <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none justify-center" onClick={e => e.stopPropagation()}>
            {images.map((u, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'}`}>
                <img src={u} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
