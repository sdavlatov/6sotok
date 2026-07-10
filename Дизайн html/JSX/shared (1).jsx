/* shared.jsx — shared icons and primitives for all variants */

const Icon = ({ name, size = 18, color = "currentColor", style }) => {
  const s = { width: size, height: size, ...style };
  const stroke = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "heart":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"/></svg>;
    case "share":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>;
    case "compare": return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M9 3v18M15 3v18M3 8h6M15 8h6M3 16h6M15 16h6"/></svg>;
    case "phone":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case "msg":     return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
    case "pin":     return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle {...stroke} cx="12" cy="10" r="3"/></svg>;
    case "ruler":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M3 17 17 3l4 4L7 21z M7 13l2 2 M11 9l2 2 M15 5l2 2"/></svg>;
    case "tag":     return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle {...stroke} cx="7" cy="7" r="1"/></svg>;
    case "shield":  return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path {...stroke} d="m9 12 2 2 4-4"/></svg>;
    case "check":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M20 6 9 17l-5-5"/></svg>;
    case "x":       return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M18 6 6 18M6 6l12 12"/></svg>;
    case "minus":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M5 12h14"/></svg>;
    case "arrow-l": return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M19 12H5M12 19l-7-7 7-7"/></svg>;
    case "arrow-r": return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case "expand":  return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7"/></svg>;
    case "grid":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>;
    case "drop":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z"/></svg>;
    case "bolt":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>;
    case "flame":   return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-6-6-11-6-11z"/></svg>;
    case "road":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M4 22 8 2h8l4 20M12 6v3M12 13v3M12 20v0"/></svg>;
    case "tree":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 2 5 12h4l-3 6h12l-3-6h4z M12 18v4"/></svg>;
    case "doc":     return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6"/></svg>;
    case "eye":     return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle {...stroke} cx="12" cy="12" r="3"/></svg>;
    case "user":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle {...stroke} cx="12" cy="7" r="4"/></svg>;
    case "verify":  return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="m12 2 2.4 1.7 2.9-.3 1 2.7 2.5 1.5-.7 2.8 1.4 2.6-2 2.1.1 2.9-2.7 1-1.5 2.5-2.8-.7L12 22l-2.6-1.4-2.8.7L5 18.8l-2.7-1 .1-2.9-2-2.1L1.8 10 1.1 7.2l2.5-1.5 1-2.7 2.9.3z"/><path {...stroke} d="m9 12 2 2 4-4"/></svg>;
    case "calc":    return <svg viewBox="0 0 24 24" style={s}><rect {...stroke} x="4" y="2" width="16" height="20" rx="2"/><path {...stroke} d="M8 6h8 M8 11h.01 M12 11h.01 M16 11h.01 M8 15h.01 M12 15h.01 M16 15h.01 M8 19h.01 M12 19h.01 M16 19h.01"/></svg>;
    case "clock":   return <svg viewBox="0 0 24 24" style={s}><circle {...stroke} cx="12" cy="12" r="10"/><path {...stroke} d="M12 6v6l4 2"/></svg>;
    case "plus":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="M12 5v14M5 12h14"/></svg>;
    case "play":    return <svg viewBox="0 0 24 24" style={s}><path {...stroke} d="m5 3 14 9-14 9z"/></svg>;
    case "sun":     return <svg viewBox="0 0 24 24" style={s}><circle {...stroke} cx="12" cy="12" r="4"/><path {...stroke} d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41"/></svg>;
    default: return null;
  }
};

/* ─── Top navigation bar (modernized) ─── */
function TopBar({ compact }) {
  return (
    <div className="topbar" style={{ padding: compact ? "0 20px" : "0 28px" }}>
      <a className="brand" href="#">
        <span className="brand-mark">6</span>
        <span>6sotok<span className="dotg">.kz</span></span>
      </a>
      <nav className="nav-links" style={{ marginLeft: 8 }}>
        <a href="#">Каталог участков</a>
        <a href="#">Регионы</a>
        <a href="#">Агентствам</a>
        <a href="#">Калькулятор</a>
      </nav>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="btn btn-ghost" style={{ height: 40, padding: "0 14px" }}>
          <Icon name="heart" size={16}/> Избранное
        </button>
        <button className="btn btn-ghost" style={{ height: 40, padding: "0 14px" }}>
          <Icon name="user" size={16}/> Войти
        </button>
        <button className="btn btn-primary" style={{ height: 40 }}>
          <Icon name="plus" size={16}/> Подать объявление
        </button>
      </div>
    </div>
  );
}

/* ─── Image placeholders (no real photos — striped placeholders w/ labels) ─── */
const PHOTOS = [
  { label: "01 · обзор сверху", tone: "a" },
  { label: "02 · граница участка", tone: "b" },
  { label: "03 · подъезд", tone: "c" },
  { label: "04 · коммуникации", tone: "a" },
  { label: "05 · соседи", tone: "b" },
  { label: "06 · вид на горы", tone: "c" },
];

function Photo({ label, tone = "a", style, children, rounded = 14 }) {
  const tones = {
    a: "linear-gradient(135deg, #d4ddc7 0%, #b8c5a4 50%, #94a585 100%)",
    b: "linear-gradient(135deg, #e8dfc8 0%, #d4c39e 50%, #b09869 100%)",
    c: "linear-gradient(180deg, #cad6db 0%, #a8b9c2 50%, #7e95a3 100%)",
  };
  return (
    <div style={{
      position: "relative",
      background: tones[tone],
      borderRadius: rounded,
      overflow: "hidden",
      ...style
    }}>
      {/* topographic-ish pattern */}
      <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none"
           style={{ position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "multiply" }}>
        <defs>
          <pattern id={`topo-${tone}`} width="80" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 30 Q20 10 40 30 T80 30" stroke="#14160f" strokeWidth="0.6" fill="none"/>
            <path d="M0 50 Q20 30 40 50 T80 50" stroke="#14160f" strokeWidth="0.6" fill="none"/>
            <path d="M0 10 Q20 -10 40 10 T80 10" stroke="#14160f" strokeWidth="0.6" fill="none"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#topo-${tone})`}/>
      </svg>
      <div style={{
        position: "absolute", left: 12, bottom: 10,
        font: "500 10px/1 var(--font-mono)",
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.85)",
        background: "rgba(20,22,15,0.45)",
        padding: "5px 8px", borderRadius: 6,
        backdropFilter: "blur(6px)",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ─── Mini area sketch (replaces ugly yellow overlay) ─── */
function ParcelSketch({ size = 280, accent = "var(--emerald-600)" }) {
  return (
    <svg viewBox="0 0 300 220" style={{ width: size, maxWidth: "100%", height: "auto", display: "block" }}>
      {/* surrounding context: roads */}
      <g stroke="var(--ink-300)" strokeWidth="1" fill="none" opacity="0.7" strokeDasharray="3 3">
        <path d="M0 60 L300 80"/>
        <path d="M60 0 L80 220"/>
        <path d="M200 220 L240 0"/>
      </g>
      {/* parcel shape */}
      <path d="M70 70 L210 60 L240 110 L220 180 L100 190 L60 140 Z"
            fill={`color-mix(in oklab, ${accent} 12%, white)`}
            stroke={accent}
            strokeWidth="2"/>
      {/* corner markers */}
      {[[70,70],[210,60],[240,110],[220,180],[100,190],[60,140]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke={accent} strokeWidth="1.5"/>
      ))}
      {/* utility icons */}
      <g fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-700)" letterSpacing="0.5">
        <text x="150" y="135" textAnchor="middle" fontWeight="600">Сейфулино</text>
        <text x="150" y="148" textAnchor="middle" opacity="0.6">200 соток</text>
      </g>
      {/* compass */}
      <g transform="translate(265, 25)">
        <circle r="14" fill="#fff" stroke="var(--line)"/>
        <path d="M0 -8 L3 0 L0 8 L-3 0 Z" fill={accent}/>
        <text y="-18" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="var(--ink-500)">N</text>
      </g>
    </svg>
  );
}

Object.assign(window, { Icon, TopBar, Photo, PHOTOS, ParcelSketch });
