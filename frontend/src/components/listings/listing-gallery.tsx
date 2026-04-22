'use client';
import { useState, useEffect } from 'react';

const isVideo = (url: string) => /\.(mp4|mov|webm|ogv|m4v)$/i.test(url.split('?')[0]);

interface ListingGalleryProps {
  title: string;
  images?: string[];
}

export function ListingGallery({ title, images }: ListingGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!images || images.length === 0) return null;

  const activeUrl = images[activeIdx];
  const activeIsVideo = mounted && isVideo(activeUrl);

  return (
    <div className="space-y-3">
      {/* Главный просмотрщик */}
      <div className={`w-full overflow-hidden rounded-3xl bg-zinc-100 border border-zinc-200 shadow-sm relative ${activeIsVideo ? 'aspect-[9/16] max-w-sm mx-auto' : 'aspect-[16/9] lg:aspect-[4/3]'}`}>
        {activeIsVideo ? (
          <video
            key={activeUrl}
            src={activeUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={activeUrl}
            alt={`${title} — фото ${activeIdx + 1}`}
            className="h-full w-full object-cover"
          />
        )}
        {!activeIsVideo && images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {images.map((url, idx) => {
            const vt = isVideo(url);
            return (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all focus:outline-none ${
                  activeIdx === idx
                    ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {vt ? (
                  <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <img src={url} alt={`Фото ${idx + 1}`} className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
