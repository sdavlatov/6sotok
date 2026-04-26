'use client'

import { useState, useRef } from 'react'

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0])

interface CardMediaSliderProps {
  images: string[]
  title: string
}

export function CardMediaSlider({ images, title }: CardMediaSliderProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const total = images.length
  const current = images[index] ?? ''
  const currentIsVideo = current && isVideo(current)

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIndex(i => (i - 1 + total) % total)
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIndex(i => (i + 1) % total)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      setIndex(i => diff > 0 ? (i + 1) % total : (i - 1 + total) % total)
    }
    touchStartX.current = null
  }

  if (!current) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-100">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-zinc-300">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
        </svg>
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {currentIsVideo ? (
        /*
          Видео (9:16 и любое другое):
          Тёмный фон + object-contain — чистые тёмные полосы.
          Выглядит как Instagram/YouTube, а не как баг с блюром.
        */
        <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
          <video
            key={current}
            src={current}
            className="h-full w-full object-contain"
            muted playsInline loop autoPlay
          />
        </div>
      ) : (
        /*
          Фото любого формата:
          object-cover заполняет контейнер без блюра.
          Квадрат, вертикаль, горизонталь — всё выглядит чисто.
        */
        <img
          key={current}
          src={current}
          alt={title}
          className="h-full w-full object-cover"
        />
      )}

      {/* Стрелки */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Предыдущее фото"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Следующее фото"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Точки */}
      {total > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.preventDefault(); e.stopPropagation(); setIndex(i) }}
              className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
