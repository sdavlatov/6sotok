'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export interface BreadcrumbNode {
  label: string
  href?: string
}

const ORIGIN = 'https://6sotok.kz'
const MAX_VISIBLE = 5 // Главная + до 5 узлов, дальше сворачиваем середину

function absUrl(href: string) {
  if (/^https?:\/\//i.test(href)) return href
  return ORIGIN + (href.startsWith('/') ? href : `/${href}`)
}

/**
 * Единый компонент хлебных крошек: навигация для пользователя + BreadcrumbList
 * для Google (JSON-LD — полный путь передаётся независимо от визуального сворачивания).
 * «Главная» подставляется автоматически, в `trail` её включать не нужно.
 * Последний узел `trail` — текущая страница (без href).
 */
export function Breadcrumbs({ trail, home = 'Главная', className = '' }: {
  trail: BreadcrumbNode[]
  home?: string
  className?: string
}) {
  const nodes: BreadcrumbNode[] = [{ label: home, href: '/' }, ...trail]
  const last = nodes.length - 1
  const collapse = nodes.length > MAX_VISIBLE + 1
  const hideFrom = 1
  const hideTo = last - 2
  const [expanded, setExpanded] = useState(!collapse)
  const scrollerRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [expanded])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: nodes.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: n.label,
      ...(i !== last && n.href ? { item: absUrl(n.href) } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Хлебные крошки" className={className}>
        <ol
          ref={scrollerRef}
          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pr-2 text-[13px] text-zinc-400
            [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
            [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]
            lg:[mask-image:none] lg:overflow-visible"
        >
          {nodes.map((n, i) => {
            const isLast = i === last
            const hidden = collapse && !expanded && i >= hideFrom && i <= hideTo
            if (hidden) return null
            const isLink = !isLast && !!n.href

            return (
              <li key={i} className="flex shrink-0 items-center gap-1.5">
                {i > 0 && <span className="text-zinc-300" aria-hidden="true">/</span>}
                {isLink ? (
                  <Link href={n.href!} className="transition-colors hover:text-zinc-700">
                    {n.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={isLast ? 'font-semibold text-zinc-900' : 'text-zinc-400'}
                  >
                    {n.label}
                  </span>
                )}
                {collapse && !expanded && i === 0 && (
                  <>
                    <span className="text-zinc-300" aria-hidden="true">/</span>
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      aria-label="Показать весь путь"
                      className="transition-colors hover:text-zinc-700"
                    >
                      …
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
