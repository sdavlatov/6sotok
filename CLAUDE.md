# 6sotok Project — Claude Code Guidelines

## Stack
- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **shadcn/ui** components (добавлять через `npx shadcn@latest add <component>`)
- **Lucide React** for icons
- **Inter** font (primary), system-ui fallback

## Design Tokens (globals.css)
```
Primary:     #066F36  (dark green — brand)
Primary light: #2CA64E
Accent:      #A3D2F0  (sky blue — highlights)
Background:  #fafafa
Border:      #e4e4e7
Muted:       #a1a1aa
Card:        #ffffff
```

---

# UI/UX DESIGN SYSTEM

## Core Philosophy
**Every screen must feel like a premium product.** Reference design language: Linear, Vercel, Luma, Stripe, Airbnb. Clean, purposeful, with visual hierarchy that guides the eye without effort.

## Non-Negotiable Design Rules

### Typography
- Headlines: `font-bold tracking-tight` — use `-0.02em` to `-0.03em` letter-spacing for large text
- Body: `text-[15px] leading-relaxed text-zinc-700` — never raw black (#000) for body text
- Micro labels: `text-xs uppercase tracking-wider font-semibold text-zinc-400`
- Price/number displays: `font-black` with `tabular-nums`
- **Never** use more than 3 font sizes in a single screen section

### Color Usage
- Primary green only for: primary CTAs, active states, key stats
- Never fill large areas with primary green — use `primary-soft` (#f0fdf4) as background tint
- Accent blue (#A3D2F0) for secondary highlights, tags, badges
- Use `zinc-*` scale for neutrals — never gray-* for consistency
- Hover states: always slightly darker or with subtle background (`zinc-50`, `zinc-100`)

### Spacing & Layout
- Base unit: `4px`. Use Tailwind scale: `p-3`(12px), `p-4`(16px), `p-6`(24px), `p-8`(32px)
- Cards: `p-5` or `p-6` padding, `rounded-2xl`, subtle shadow
- Sections: min `py-12` on mobile, `py-16` on desktop
- Content max-width: `max-w-7xl` with `mx-auto px-4 sm:px-6 lg:px-8`
- Grid gaps: `gap-4` cards, `gap-6` sections, `gap-8` major layouts

### Cards & Surfaces
```tsx
// Standard card pattern
<div className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow p-5">
```
- Cards get `hover:shadow-md` and `transition-shadow duration-200`
- Featured/hero cards: `rounded-3xl` with `shadow-lg`
- Inner nested cards: `bg-zinc-50 rounded-xl`
- **Never** use `rounded-md` for content cards — minimum `rounded-xl`

### Buttons
```tsx
// Primary CTA
<button className="bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150">

// Secondary
<button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium px-5 py-2.5 rounded-xl transition-colors duration-150">

// Ghost/outline
<button className="border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium px-5 py-2.5 rounded-xl transition-all duration-150">
```
- Minimum button height: `py-2.5` (10px top/bottom)
- Icon buttons: `size-9` or `size-10`, always `rounded-xl`

### Badges & Tags
```tsx
// Category badge
<span className="bg-primary-soft text-primary text-xs font-semibold px-2.5 py-1 rounded-full">

// Neutral tag
<span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-2.5 py-1 rounded-full">
```

### Images & Media
- Property/listing images: always `aspect-[4/3]` or `aspect-video`, `object-cover`, `rounded-xl`
- Avatar/user images: `rounded-full`, fixed size
- All images: `loading="lazy"` except hero/LCP images
- Placeholder for missing images: gradient from `zinc-100` to `zinc-200`

### Icons
- Size in text context: `size-4` (16px)
- Size in buttons: `size-4` with `gap-2` from text
- Size in feature sections: `size-5` or `size-6`
- Hero/large icons: wrap in `bg-primary-soft p-3 rounded-2xl` container
- **Always** use Lucide icons — never mix icon libraries

### Transitions & Animation
- Default: `transition-all duration-200` or `transition-colors duration-150`
- Hover lifts: `hover:-translate-y-0.5 transition-transform duration-200`
- Skeleton loading: pulse animation with `bg-zinc-100 animate-pulse rounded-xl`
- Page transitions: none by default (performance > aesthetics for listings)

### Forms & Inputs
```tsx
<input className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-[15px] placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
```
- All inputs: `rounded-xl`, never `rounded-md`
- Focus ring: `ring-2 ring-primary/10` with `border-primary`
- Error state: `border-danger` + `ring-danger/10`
- Labels: `text-sm font-medium text-zinc-700 mb-1.5`

### Dividers & Separators
- Use `border-zinc-100` for subtle section dividers
- Avoid heavy horizontal rules — prefer whitespace or subtle background color changes

---

## Layout Patterns

### Listing/Catalog Cards
```tsx
<article className="group bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer">
  <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
  </div>
  <div className="p-4 space-y-2">
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-zinc-900 leading-snug line-clamp-2">...</h3>
      <span className="text-lg font-black text-primary whitespace-nowrap">...</span>
    </div>
    <p className="text-sm text-zinc-500 line-clamp-2">...</p>
    <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400">
      {/* meta info */}
    </div>
  </div>
</article>
```

### Section Headers
```tsx
<div className="flex items-end justify-between mb-6">
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Category</p>
    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Section Title</h2>
  </div>
  <a className="text-sm font-medium text-primary hover:underline">View all →</a>
</div>
```

### Stats/Numbers Display
```tsx
<div className="bg-primary-soft rounded-2xl p-5 text-center">
  <p className="text-3xl font-black text-primary tabular-nums">1,234</p>
  <p className="text-sm text-zinc-600 mt-1">Total listings</p>
</div>
```

### Filter/Navigation Pills
```tsx
// Active
<button className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full">

// Inactive
<button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-medium px-4 py-2 rounded-full transition-colors">
```

---

## Modern Design Trends to Follow (2025-2026)

1. **Bento grid layouts** for feature/stats sections — use asymmetric grid with `grid-cols-2` or `grid-cols-3` with varying `col-span`
2. **Subtle gradients** on hero sections: `bg-gradient-to-br from-zinc-50 via-white to-primary-soft/30`
3. **Glass-like cards** for overlays: `bg-white/80 backdrop-blur-md`
4. **Large, confident typography** — don't be afraid of `text-4xl` or `text-5xl` on heroes
5. **Floating labels** and micro-interactions on forms
6. **Sticky headers** with blur: `sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-zinc-100`

---

## Anti-Patterns — NEVER DO

- `rounded-md` on content cards or buttons (too corporate/dated)
- `text-black` or `color: black` for body text — use `text-zinc-900` or `text-zinc-700`
- `border-2` on cards — always `border` (1px) with `border-zinc-100`
- Generic `shadow` without hover state improvement
- `p-2` or less padding inside cards — minimum `p-4`
- All-caps text except for micro labels
- More than 2 primary CTA buttons on the same screen
- Tables for mobile layouts — use cards
- Centering body text paragraphs longer than 2 lines
- `text-green-*` classes — always use `text-primary` CSS variable

---

## Responsive Rules
- Mobile-first always: write base styles first, then `md:` / `lg:` overrides
- Cards: 1 col mobile → 2 cols tablet → 3-4 cols desktop
- Typography: scale down with `text-2xl md:text-3xl lg:text-4xl`
- Padding: `px-4 sm:px-6 lg:px-8` for page gutters
- Hide decorative elements on mobile: `hidden md:block`

---

## When Generating UI

Before writing any component:
1. Identify the hierarchy: what's the most important element?
2. Choose a layout: card grid, list, or hero + content?
3. Apply spacing first, style second
4. Add micro-interactions (hover states) to all interactive elements
5. Verify mobile looks good at 390px width
6. Check that primary green is used sparingly and purposefully

**Ask yourself: Would this look at home on Linear.app or Vercel.com?** If no — redesign.
