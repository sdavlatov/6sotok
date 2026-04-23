'use client'
import { useState, useEffect, useRef } from 'react'

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0])

export function ListingGallery({ title, images }: { title: string; images?: string[] }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [mounted, setMounted] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!lightbox) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox, idx])

  if (!images?.length) return null

  const total = images.length
  const url = images[idx]
  const isVid = mounted && isVideo(url)

  const go = (dir: number) => setIdx(i => (i + dir + total) % total)

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const diff = touchX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1)
    touchX.current = null
  }

  return (
    <>
      <div className="space-y-2.5">
        {/* Главный просмотрщик */}
        <div
          className="relative w-full h-[280px] sm:h-[400px] lg:h-[480px] overflow-hidden rounded-2xl bg-zinc-950 group"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={() => !isVid && setLightbox(true)}
          style={{ cursor: isVid ? 'default' : 'zoom-in' }}
        >
          {isVid ? (
            <video
              key={url}
              src={url}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={url}
              alt={`${title} — фото ${idx + 1}`}
              className="h-full w-full object-contain"
            />
          )}

          {/* Стрелки */}
          {total > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); go(-1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); go(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}

          {/* Счётчик */}
          <div className="absolute bottom-3 right-3 z-20 rounded-lg bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
            {idx + 1} / {total}
          </div>

          {/* Иконка увеличения */}
          {!isVid && (
            <div className="absolute top-3 right-3 z-20 rounded-lg bg-black/40 backdrop-blur-sm p-1.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </div>
          )}
        </div>

        {/* Миниатюры */}
        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            {images.map((u, i) => {
              const vt = isVideo(u)
              return (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`relative h-16 w-[88px] shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all focus:outline-none ${
                    idx === i
                      ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  {vt ? (
                    <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  ) : (
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Лайтбокс */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/96 flex flex-col"
          onClick={() => setLightbox(false)}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
            <span className="text-white/50 text-sm font-semibold">{idx + 1} / {total}</span>
            <button
              onClick={() => setLightbox(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Фото */}
          <div
            className="flex-1 flex items-center justify-center relative min-h-0"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={images[idx]}
              alt={title}
              className="max-h-full max-w-full object-contain select-none"
            />
            {total > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); go(-1) }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); go(1) }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </>
            )}
          </div>

          {/* Миниатюры в лайтбоксе */}
          {total > 1 && (
            <div
              className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none justify-center"
              onClick={e => e.stopPropagation()}
            >
              {images.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === idx ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                  }`}
                >
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
