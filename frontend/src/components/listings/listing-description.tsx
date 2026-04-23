'use client'
import { useState } from 'react'

export function ListingDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = text.split('\n').filter(Boolean)
  const isLong = lines.length > 4 || text.length > 300

  const displayed = (!isLong || expanded) ? text : lines.slice(0, 4).join('\n')

  return (
    <div>
      <div className="text-[15px] text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
        {displayed}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-primary hover:text-primary-hover transition-colors"
        >
          {expanded ? 'Свернуть' : 'Читать полностью'}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      )}
    </div>
  )
}
