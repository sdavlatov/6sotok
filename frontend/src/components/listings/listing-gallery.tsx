'use client';
import { useState } from 'react';

interface ListingGalleryProps {
  title: string;
  images?: string[];
}

export function ListingGallery({ title, images }: ListingGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Главное фото */}
      <div className="aspect-[16/9] lg:aspect-[4/3] w-full overflow-hidden rounded-3xl bg-zinc-100 border border-zinc-200 shadow-sm relative group cursor-pointer">
        <img 
          src={images[activeIdx]} 
          alt={`${title} - Фото ${activeIdx + 1}`} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute bottom-4 right-4 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
          {activeIdx + 1} / {images.length}
        </div>
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {images.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveIdx(idx)}
              className={`relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-2xl border-2 transition-all focus:outline-none ${
                activeIdx === idx 
                  ? 'border-primary shadow-md opacity-100 scale-100 ring-2 ring-primary/20 ring-offset-2' 
                  : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]'
              }`}
            >
              <img src={img} alt={`Миниатюра ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
