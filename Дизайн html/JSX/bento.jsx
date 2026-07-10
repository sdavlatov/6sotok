/* bento.jsx — Apple-style dark "marketing tile" grid for listing specs */

const Tile = ({ children, span = 1, rows = 1, dark = true, style }) => (
  <div style={{
    gridColumn: `span ${span}`,
    gridRow: `span ${rows}`,
    background: dark ? "#14160f" : "#fff",
    color: dark ? "#f4f3ef" : "var(--ink-900)",
    border: dark ? "1px solid #1f2218" : "1px solid var(--line)",
    borderRadius: 22,
    padding: 28,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 260,
    ...style,
  }}>
    {children}
  </div>
);

const TileEyebrow = ({ children, dark = true }) => (
  <div style={{
    fontSize: 13,
    color: dark ? "rgba(244,243,239,0.55)" : "var(--ink-500)",
    fontWeight: 500,
    lineHeight: 1.4,
    textWrap: "balance",
  }}>
    {children}
  </div>
);

const TileHero = ({ children, dark = true, size = 56 }) => (
  <div style={{
    font: `600 ${size}px/1 var(--font-display)`,
    letterSpacing: "-0.03em",
    color: dark ? "#fff" : "var(--ink-900)",
    textWrap: "balance",
    fontVariantNumeric: "tabular-nums",
  }}>
    {children}
  </div>
);

const TileSub = ({ children, dark = true }) => (
  <div style={{
    fontSize: 13.5,
    color: dark ? "rgba(244,243,239,0.55)" : "var(--ink-500)",
    lineHeight: 1.45,
    textWrap: "pretty",
  }}>
    {children}
  </div>
);

/* ── Visual: parcel rectangle 50×40 with dimension hints ── */
function ParcelDiagram() {
  return (
    <svg viewBox="0 0 240 180" style={{ width: "100%", height: "auto", display: "block" }}>
      {/* outer dimension lines */}
      <g stroke="rgba(244,243,239,0.35)" strokeWidth="1" fill="none">
        <path d="M30 30 L30 20 M210 30 L210 20 M30 25 L210 25"/>
        <path d="M210 30 L220 30 M210 150 L220 150 M215 30 L215 150"/>
      </g>
      <text x="120" y="16" textAnchor="middle" fontSize="10"
            fontFamily="var(--font-mono)" fill="rgba(244,243,239,0.65)" letterSpacing="0.5">50 м</text>
      <text x="225" y="94" fontSize="10"
            fontFamily="var(--font-mono)" fill="rgba(244,243,239,0.65)" letterSpacing="0.5">40 м</text>

      {/* parcel */}
      <rect x="30" y="30" width="180" height="120"
            fill="rgba(34,153,120,0.18)"
            stroke="#3fb892" strokeWidth="1.5"/>
      {/* corner markers */}
      {[[30,30],[210,30],[210,150],[30,150]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="3" fill="#14160f" stroke="#3fb892" strokeWidth="1.5"/>
      ))}

      {/* north arrow */}
      <g transform="translate(195,50)" opacity="0.7">
        <path d="M0 -8 L3 0 L0 8 L-3 0 Z" fill="#3fb892"/>
        <text y="-12" textAnchor="middle" fontSize="8"
              fontFamily="var(--font-mono)" fill="rgba(244,243,239,0.55)">N</text>
      </g>
    </svg>
  );
}

/* ── Visual: connection battery-style indicator ── */
function ConnectionBars({ items }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 99, flexShrink: 0,
            background: it.ok ? "#3fb892" : "rgba(244,243,239,0.18)",
            boxShadow: it.ok ? "0 0 12px rgba(63,184,146,0.55)" : "none",
          }}/>
          <span style={{
            fontSize: 14, fontWeight: 500,
            color: it.ok ? "#f4f3ef" : "rgba(244,243,239,0.45)",
            flex: 1,
          }}>{it.label}</span>
          <span style={{
            fontSize: 12, fontFamily: "var(--font-mono)",
            color: it.ok ? "rgba(244,243,239,0.6)" : "rgba(244,243,239,0.3)",
            letterSpacing: "0.04em",
          }}>{it.detail}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Visual: documents stack ── */
function DocsStack() {
  return (
    <div style={{ position: "relative", height: 110, marginTop: "auto" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          position: "absolute",
          left: `${i * 14}px`,
          top: `${i * 8}px`,
          width: 96, height: 120,
          background: i === 2 ? "#f4f3ef" : `rgba(244,243,239,${0.08 + i*0.06})`,
          border: "1px solid rgba(244,243,239,0.12)",
          borderRadius: 8,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: 10,
          transform: `rotate(${(i-1) * 3}deg)`,
        }}>
          {i === 2 && (
            <>
              <div style={{ height: 3, background: "#14160f", borderRadius: 2, marginBottom: 4, width: "70%" }}/>
              <div style={{ height: 2, background: "rgba(20,22,15,0.3)", borderRadius: 2, marginBottom: 3, width: "100%" }}/>
              <div style={{ height: 2, background: "rgba(20,22,15,0.3)", borderRadius: 2, marginBottom: 3, width: "85%" }}/>
              <div style={{ height: 2, background: "rgba(20,22,15,0.3)", borderRadius: 2, marginBottom: 8, width: "60%" }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 14, height: 14, borderRadius: 99, background: "#3fb892",
                                display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
                <div style={{ fontSize: 7, fontFamily: "var(--font-mono)", color: "#14160f", letterSpacing: "0.5" }}>VERIFIED</div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function BentoGrid() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 14,
    }}>
      {/* ROW 1 */}

      {/* 1. Площадь — крупный hero */}
      <Tile span={3}>
        <TileEyebrow>Площадь</TileEyebrow>
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <TileHero size={88}>200<span style={{ fontSize: 32, color: "rgba(244,243,239,0.55)", marginLeft: 8 }}>соток</span></TileHero>
          <div style={{ marginTop: 14, display: "flex", gap: 18, fontSize: 13,
                          color: "rgba(244,243,239,0.55)", fontFamily: "var(--font-mono)" }}>
            <span>≈ 2 га</span>
            <span>·</span>
            <span>20 000 м²</span>
          </div>
        </div>
        {/* decorative subtle gradient */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
                        background: "radial-gradient(circle at 80% 100%, rgba(34,153,120,0.18), transparent 55%)" }}/>
      </Tile>

      {/* 2. Размеры — диаграмма */}
      <Tile span={3}>
        <TileEyebrow>Размеры участка</TileEyebrow>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "16px 0", minHeight: 0 }}>
          <ParcelDiagram/>
        </div>
        <TileSub>Прямоугольник, ровный рельеф без&nbsp;перепадов</TileSub>
      </Tile>

      {/* ROW 2 */}

      {/* 3. Коммуникации — список с индикаторами */}
      <Tile span={3}>
        <TileEyebrow>Коммуникации</TileEyebrow>
        <div style={{ marginTop: 14 }}>
          <TileHero size={56}>
            3 <span style={{ color: "rgba(244,243,239,0.4)" }}>/ 4</span>
          </TileHero>
          <TileSub>Подведено по&nbsp;границе участка</TileSub>
        </div>
        <div style={{ marginTop: 18 }}>
          <ConnectionBars items={[
            { label: "Электричество", detail: "380 В",        ok: true },
            { label: "Вода",          detail: "центральная",  ok: true },
            { label: "Газ",           detail: "магистраль",   ok: true },
            { label: "Отопление",     detail: "—",            ok: false },
          ]}/>
        </div>
      </Tile>

      {/* 4. Подъезд */}
      <Tile span={3}>
        <TileEyebrow>Подъезд к&nbsp;участку</TileEyebrow>
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <TileHero size={64}>Асфальт</TileHero>
          <TileSub>Круглогодичный доступ. Первая&nbsp;линия от&nbsp;трассы Алматы&nbsp;— Талдыкорган</TileSub>
        </div>
        {/* road svg */}
        <svg viewBox="0 0 400 80" style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                                              width: "100%", height: 80, opacity: 0.7 }}>
          <defs>
            <linearGradient id="road-fade" x1="0" x2="1">
              <stop offset="0" stopColor="#14160f" stopOpacity="0"/>
              <stop offset="0.5" stopColor="#1f2218"/>
              <stop offset="1" stopColor="#14160f" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="400" height="80" fill="url(#road-fade)"/>
          <path d="M0 50 L400 30" stroke="rgba(244,243,239,0.08)" strokeWidth="1"/>
          <path d="M0 50 L400 30" stroke="#3fb892" strokeWidth="1.2"
                  strokeDasharray="14 12" opacity="0.7"/>
        </svg>
      </Tile>

      {/* ROW 3 */}

      {/* 5. Тип земли — крупная плашка */}
      <Tile span={2}>
        <TileEyebrow>Категория</TileEyebrow>
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <TileHero size={64}>МЖС</TileHero>
          <TileSub>Малоэтажная жилая застройка. Назначение&nbsp;— ИЖС</TileSub>
        </div>
      </Tile>

      {/* 6. Документы — стопка */}
      <Tile span={2}>
        <TileEyebrow>Документы</TileEyebrow>
        <div style={{ marginTop: 14 }}>
          <TileHero size={48}>В порядке</TileHero>
          <TileSub>Гос. акт оформлен. Без&nbsp;залога, обременений и&nbsp;красной&nbsp;линии</TileSub>
        </div>
        <DocsStack/>
      </Tile>

      {/* 7. Кадастр */}
      <Tile span={2}>
        <TileEyebrow>Кадастровый номер</TileEyebrow>
        <div style={{ marginTop: "auto", marginBottom: "auto" }}>
          <div style={{ font: "500 28px/1.2 var(--font-mono)",
                          letterSpacing: "0.02em", color: "#fff",
                          padding: "16px 18px",
                          background: "rgba(244,243,239,0.04)",
                          border: "1px solid rgba(244,243,239,0.08)",
                          borderRadius: 12,
                          display: "inline-block" }}>
            03-024-555
          </div>
        </div>
        <TileSub>Делимость: неделимый участок</TileSub>
      </Tile>
    </div>
  );
}

window.BentoGrid = BentoGrid;
