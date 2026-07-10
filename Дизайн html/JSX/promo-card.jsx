/* promo-card.jsx — catalog card w/ promotion & status system + spec reference blocks
   Desktop + Mobile. Uses 6sotok design code (styles.css tokens).
   Save mark = bookmark (закладка), NOT heart — per design system. */

/* ── Custom crisp icons (24 viewBox, stroke 1.8) ── */
const PIC = {
  // save mark — закладка (не сердце)
  bookmark: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 16} height={p.size || 16} fill={p.fill || "none"}
         stroke={p.stroke || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10a1 1 0 0 1 1 1v15.2a.5.5 0 0 1-.77.42L12 17.4l-5.23 3.22A.5.5 0 0 1 6 20.2V5a1 1 0 0 1 1-1z"/>
    </svg>
  ),
  // Срочно — options
  bolt: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill={p.fill || "currentColor"} stroke="none">
      <path d="M13.5 2.2 5.6 12.6a.6.6 0 0 0 .48.96H10l-1.4 7.9a.4.4 0 0 0 .72.3l8-10.5a.6.6 0 0 0-.48-.96H12.7l1.5-7.6a.4.4 0 0 0-.7-.5z"/>
    </svg>
  ),
  clock: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>
    </svg>
  ),
  flame: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill={p.fill || "currentColor"} stroke="none">
      <path d="M12.5 2c.6 3-1.3 4.2-2.6 5.6C8.4 9.2 7 10.8 7 13.5A5 5 0 0 0 17 14c0-1.7-.6-3-1.4-4 .1 1-.5 1.9-1.4 2.2.6-2.2-.2-4.6-1.7-6.2C11.3 4.9 11.9 3.3 12.5 2z"/>
    </svg>
  ),
  // Готов к стройке — options
  checkSeal: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="m8.3 12.2 2.5 2.5 4.9-5.4"/>
    </svg>
  ),
  shieldCheck: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6 5 5.2v6.1c0 4.4 3 7.3 7 8.9 4-1.6 7-4.5 7-8.9V5.2L12 2.6z"/><path d="m9 11.6 2.2 2.2L15 10"/>
    </svg>
  ),
  key: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="4.2"/><path d="m11 11 8 8M16 16l2-2M18.5 18.5l1.5-1.5"/>
    </svg>
  ),
  x: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 12} height={p.size || 12} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 7 7 17M7 7l10 10"/>
    </svg>
  ),
  check: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 17.5 19 7"/>
    </svg>
  ),
  pin: (p = {}) => (
    <svg viewBox="0 0 24 24" width={p.size || 13} height={p.size || 13} fill="none"
         stroke={p.stroke || "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.6"/>
    </svg>
  ),
};

/* which icon variants are "active" (chosen). Change these to swap. */
const URGENT_ICON = "bolt";       // bolt | clock | flame
const READY_ICON  = "checkSeal";  // checkSeal | shieldCheck | key

/* ── Promo chips (photo overlay) — compact so they don't cover the photo ── */
// «Реклама» — обязательная, тихая. Компактная серая матовая метка.
function AdChip({ mini }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: mini ? 19 : 21, padding: "0 8px",
      borderRadius: 6,
      background: "rgba(250,250,247,0.78)", backdropFilter: "blur(6px)",
      color: "var(--ink-500)",
      font: `500 ${mini ? 8.5 : 9.5}px/1 var(--font-mono)`, letterSpacing: "0.08em", textTransform: "uppercase",
      border: "1px solid rgba(20,22,15,0.05)",
    }}>Реклама</span>
  );
}

// «Срочно» — единственный кричащий элемент. Красный, платный, компактный.
function UrgentChip({ mini }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, height: mini ? 20 : 22, padding: `0 ${mini ? 8 : 9}px 0 ${mini ? 6 : 7}px`,
      borderRadius: 6, background: "var(--danger)", color: "#fff",
      font: `700 ${mini ? 10.5 : 11.5}px/1 var(--font-sans)`, letterSpacing: "-0.005em",
      boxShadow: "0 2px 8px -2px rgba(176,68,56,.5)",
    }}>
      {PIC[URGENT_ICON]({ size: mini ? 11 : 12, fill: "#fff", stroke: "#fff" })} Срочно
    </span>
  );
}

// save — закладка (control, not a chip)
function SaveBtn({ mini }) {
  const [on, setOn] = React.useState(false);
  const sz = mini ? 26 : 28;
  return (
    <button onClick={(e) => { e.stopPropagation(); setOn(!on); }}
            aria-label="Сохранить" title="Сохранить"
            style={{
              width: sz, height: sz, borderRadius: 8, cursor: "pointer",
              background: "rgba(250,250,247,0.82)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(20,22,15,0.06)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: on ? "var(--emerald-700)" : "var(--ink-500)",
            }}>
      {PIC.bookmark({ size: mini ? 13 : 14, fill: on ? "var(--emerald-600)" : "none", stroke: on ? "var(--emerald-700)" : "currentColor" })}
    </button>
  );
}

/* ── «Готов к стройке» — бесплатный статус, сигнал качества (не реклама) ── */
function BuildReadyChip({ mini }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: mini ? 24 : 26, padding: `0 ${mini ? 9 : 10}px 0 ${mini ? 8 : 9}px`,
      borderRadius: 7,
      background: "color-mix(in oklab, var(--emerald-600) 9%, #fff)",
      color: "var(--emerald-700)",
      font: `600 ${mini ? 11.5 : 12.5}px/1 var(--font-sans)`, letterSpacing: "-0.01em",
      border: "1px solid color-mix(in oklab, var(--emerald-600) 22%, transparent)",
    }}>
      {PIC[READY_ICON]({ size: mini ? 12 : 13, stroke: "var(--emerald-600)" })} Готов к стройке
    </span>
  );
}

/* ── Price block ── */
function PriceBlock({ price, perS, oldPrice, discount, torg, big }) {
  const size = big ? 20 : 22;
  return (
    <div>
      {oldPrice && (
        <div style={{ marginBottom: 2 }}>
          <span className="num" style={{
            textDecoration: "line-through", textDecorationColor: "var(--ink-300)",
            color: "var(--ink-400)", font: "500 13px/1 var(--font-sans)", letterSpacing: "-0.01em",
          }}>{oldPrice}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span className="num" style={{
          font: `700 ${size}px/1.05 var(--font-sans)`, letterSpacing: "-0.025em", color: "var(--emerald-700)",
        }}>{price}</span>
        {oldPrice && (
          <span style={{
            display: "inline-flex", alignItems: "center", height: 20, padding: "0 7px",
            borderRadius: 6, background: "color-mix(in oklab, var(--danger) 12%, #fff)",
            color: "var(--danger)", font: "700 11.5px/1 var(--font-sans)", letterSpacing: "-0.01em",
          }}>−{discount}%</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 3 }}>
        <span className="num" style={{ fontSize: 12, color: "var(--ink-400)" }}>{perS}</span>
        {torg && <span style={{ fontSize: 12, color: "var(--ink-400)", fontStyle: "italic" }}>торг</span>}
      </div>
    </div>
  );
}

/* ── DESKTOP card ── */
function PromoCard({
  empty = false, promo = false, urgent = false, buildReady = true, torg = false,
  tone = "a", photoLabel = PHOTOS[0].label,
  type = "МЖС", area = "10 соток",
  price = "9 500 000 ₸", perS = "950 000 ₸/сот.", oldPrice = null, discount = 14,
  city = "Талгар, Алматинская обл.", meta = "3 км до трассы",
  utils = ["light", "gas", "water", "act"],
}) {
  const [hover, setHover] = React.useState(false);
  const UTIL = {
    light: { color: "#F4B400", label: "Свет" }, gas: { color: "#E97B27", label: "Газ" },
    water: { color: "#2196F3", label: "Вода" }, act: { color: "var(--emerald-600)", label: "Госакт" },
  };
  const shell = {
    background: "#fff", borderRadius: 14, border: "1px solid var(--line)", overflow: "hidden",
    display: "flex", flexDirection: "column",
    transition: "transform .25s, box-shadow .25s, border-color .2s",
    transform: hover && !empty ? "translateY(-2px)" : "translateY(0)",
    boxShadow: hover && !empty ? "var(--sh-3)" : "var(--sh-1)",
    borderColor: hover && !empty ? "var(--ink-300)" : "var(--line)",
    cursor: empty ? "default" : "pointer",
  };
  const bar = (w, h = 12, mt = 0) => (
    <div style={{ width: w, height: h, marginTop: mt, borderRadius: 5, background: "var(--paper-3)" }} />
  );

  if (empty) {
    return (
      <div style={shell}>
        <div style={{
          position: "relative", aspectRatio: "16/10", background: "var(--paper-2)",
          backgroundImage: "repeating-linear-gradient(45deg, rgba(20,22,15,0.035) 0, rgba(20,22,15,0.035) 1px, transparent 1px, transparent 9px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ font: "500 10px/1 var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-300)" }}>нет фото</span>
        </div>
        <div style={{ padding: "14px 16px 18px" }}>
          {bar("42%", 11)}{bar("64%", 20, 12)}{bar("38%", 11, 8)}
          <div style={{ height: 1, background: "var(--line-soft)", margin: "16px 0 0" }} />
          {bar("54%", 11, 14)}
        </div>
      </div>
    );
  }

  return (
    <div style={shell} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ position: "relative", aspectRatio: "16/10" }}>
        <Photo label={photoLabel} tone={tone} style={{ width: "100%", height: "100%" }} rounded={0}/>
        {promo && <div style={{ position: "absolute", left: 8, top: 8 }}><AdChip /></div>}
        {urgent && <div style={{ position: "absolute", right: 8, top: 8 }}><UrgentChip /></div>}
        <div style={{ position: "absolute", right: 8, bottom: 8 }}><SaveBtn /></div>
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500, letterSpacing: "-0.005em" }}>{type} · {area}</div>
        <div style={{ marginTop: 6 }}>
          <PriceBlock price={price} perS={perS} oldPrice={oldPrice} discount={discount} torg={torg}/>
        </div>
        {buildReady && <div style={{ marginTop: 10 }}><BuildReadyChip /></div>}
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--ink-700)", fontSize: 13, marginTop: 12, fontWeight: 500 }}>
          {PIC.pin({ size: 13, stroke: "var(--ink-500)" })} {city}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 3, paddingLeft: 18 }}>{meta}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
          {utils.map((u, i) => {
            const cfg = UTIL[u]; if (!cfg) return null;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-700)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: cfg.color }}/>{cfg.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── MOBILE card (vertical, full-width feel ~340px) ── */
function PromoCardMobile({
  empty = false, promo = false, urgent = false, buildReady = true, torg = false,
  type = "МЖС · Талгар", title = "Ровный участок 10 соток, 2-я линия",
  price = "9 500 000 ₸", perS = "950 000 ₸/сот.", oldPrice = null, discount = 14,
  utils = ["light", "gas", "act"],
}) {
  const UTIL = {
    light: { color: "#F4B400", label: "Свет" }, gas: { color: "#E97B27", label: "Газ" },
    water: { color: "#2196F3", label: "Вода" }, act: { color: "var(--emerald-600)", label: "Госакт" },
  };
  const shell = {
    width: "100%", background: "#fff", borderRadius: 16, border: "1px solid var(--line)",
    overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sh-1)",
  };
  const bar = (w, h = 12, mt = 0) => (<div style={{ width: w, height: h, marginTop: mt, borderRadius: 5, background: "var(--paper-3)" }} />);

  if (empty) {
    return (
      <div style={shell}>
        <div style={{
          position: "relative", height: 150, background: "var(--paper-2)",
          backgroundImage: "repeating-linear-gradient(45deg, rgba(20,22,15,0.035) 0, rgba(20,22,15,0.035) 1px, transparent 1px, transparent 9px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ font: "500 10px/1 var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-300)" }}>нет фото</span>
        </div>
        <div style={{ padding: "14px 16px 18px" }}>
          {bar("40%", 11)}{bar("78%", 16, 10)}{bar("60%", 22, 12)}
          <div style={{ height: 1, background: "var(--line-soft)", margin: "16px 0 0" }} />
          {bar("50%", 11, 14)}
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ position: "relative", height: 172 }}>
        <Photo label={PHOTOS[0].label} tone="a" style={{ width: "100%", height: "100%" }} rounded={0}/>
        {promo && <div style={{ position: "absolute", left: 10, top: 10 }}><AdChip mini /></div>}
        {urgent && <div style={{ position: "absolute", right: 10, top: 10 }}><UrgentChip mini /></div>}
        <div style={{ position: "absolute", right: 10, bottom: 10 }}><SaveBtn mini /></div>
      </div>
      <div style={{ padding: "12px 16px 16px" }}>
        <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{type}</div>
        <div style={{ marginTop: 4, fontWeight: 800, fontSize: 15.5, lineHeight: 1.25, letterSpacing: "-0.03em", color: "var(--ink-900)",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
        <div style={{ marginTop: 10 }}>
          <PriceBlock price={price} perS={perS} oldPrice={oldPrice} discount={discount} torg={torg} big/>
        </div>
        {buildReady && <div style={{ marginTop: 10 }}><BuildReadyChip mini /></div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
          {utils.map((u, i) => {
            const cfg = UTIL[u]; if (!cfg) return null;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-700)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: cfg.color }}/>{cfg.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Icon options strip (answers "предложи свой вариант") ── */
function IconOptions() {
  const urgent = [
    { key: "bolt", label: "Молния", note: "скорость · выбрано" },
    { key: "clock", label: "Часы", note: "срочность по времени" },
    { key: "flame", label: "Огонь", note: "горящее предложение" },
  ];
  const ready = [
    { key: "checkSeal", label: "Галочка в круге", note: "проверено · выбрано" },
    { key: "shieldCheck", label: "Щит с галочкой", note: "юридика в порядке" },
    { key: "key", label: "Ключ", note: "готов к владению" },
  ];
  const Grp = ({ title, items, active, color }) => (
    <div>
      <div style={{ font: "500 10px/1 var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {items.map((it) => {
          const on = it.key === active;
          return (
            <div key={it.key} style={{
              border: on ? `1.5px solid ${color}` : "1px solid var(--line)", borderRadius: 12,
              background: on ? "color-mix(in oklab, " + color + " 6%, #fff)" : "#fff",
              padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center",
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: on ? color : "var(--paper-2)",
                            display: "flex", alignItems: "center", justifyContent: "center" }}>
                {PIC[it.key]({ size: 17, stroke: on ? "#fff" : "var(--ink-500)", fill: (it.key === "bolt" || it.key === "flame") ? (on ? "#fff" : "var(--ink-500)") : "none" })}
              </div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--ink-900)", letterSpacing: "-0.015em" }}>{it.label}</div>
              <div style={{ font: "500 9.5px/1.3 var(--font-mono)", letterSpacing: "0.04em", color: on ? color : "var(--ink-400)", textTransform: "uppercase" }}>{it.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 18, background: "#fff", padding: "22px 24px",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <Grp title="Срочно — иконка" items={urgent} active={URGENT_ICON} color="var(--danger)" />
      <Grp title="Готов к стройке — иконка" items={ready} active={READY_ICON} color="var(--emerald-600)" />
    </div>
  );
}

/* ── Element reference table ── */
function ElementReference() {
  const rows = [
    { kind: "Платная", tone: "pay", name: "Реклама", where: "Фото · левый верх",
      desc: "Маркировка платного продвижения. Обязательна, но тихая — компактная метка, не заметнее контента.",
      demo: <AdChip />, demoBg: "photo" },
    { kind: "Платная", tone: "pay", name: "Срочно", where: "Фото · правый верх",
      desc: "Продавец привлекает внимание. Единственный по-настоящему кричащий элемент — намеренно.",
      demo: <UrgentChip />, demoBg: "photo" },
    { kind: "Платная", tone: "pay", name: "Снижение цены", where: "Блок цены",
      desc: "Не бейдж. Меняется сам блок цены: старая цена перечёркнута, новая — со скидкой в %.",
      demo: (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="num" style={{ textDecoration: "line-through", color: "var(--ink-400)", textDecorationColor: "var(--ink-300)", font: "500 13px/1 var(--font-sans)" }}>22 млн ₸</span>
          <span className="num" style={{ font: "700 18px/1 var(--font-sans)", letterSpacing: "-0.025em", color: "var(--emerald-700)" }}>19 млн ₸</span>
          <span style={{ display: "inline-flex", alignItems: "center", height: 19, padding: "0 6px", borderRadius: 6, background: "color-mix(in oklab, var(--danger) 12%, #fff)", color: "var(--danger)", font: "700 11px/1 var(--font-sans)" }}>−14%</span>
        </div>
      ), demoBg: "paper" },
    { kind: "Бесплатная", tone: "free", name: "Готов к стройке", where: "Блок цены · под ценой",
      desc: "Автоматический статус: коммуникации и юридика в порядке. Главный дифференциатор, сигнал качества.",
      demo: <BuildReadyChip />, demoBg: "paper" },
    { kind: "Бесплатная", tone: "free", name: "Торг", where: "Блок цены · у цены",
      desc: "Пометка, что цена обсуждается. Не чип и не бейдж — просто мелкий текст рядом с ценой.",
      demo: (
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span className="num" style={{ font: "700 18px/1 var(--font-sans)", letterSpacing: "-0.025em", color: "var(--emerald-700)" }}>9,5 млн ₸</span>
          <span style={{ fontSize: 13, color: "var(--ink-400)", fontStyle: "italic" }}>торг</span>
        </div>
      ), demoBg: "paper" },
    { kind: "Контрол", tone: "ctrl", name: "Сохранить", where: "Фото · правый низ",
      desc: "Закладка (не сердце), по бренду. Не платный чип — управляющий элемент, тихий, поверх фото.",
      demo: <div style={{ display: "flex", gap: 10, alignItems: "center" }}><SaveBtn /><span style={{ font: "500 10px/1 var(--font-mono)", color: "var(--ink-400)", letterSpacing: "0.06em" }}>tap →</span><SaveBtnOn /></div>, demoBg: "photo" },
  ];
  const photoBg = { background: "linear-gradient(135deg, #d4ddc7 0%, #b8c5a4 50%, #94a585 100%)" };
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden", background: "#fff" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "232px 1fr 168px", gap: 24, alignItems: "center", padding: "20px 24px", borderTop: i ? "1px solid var(--line)" : "none" }}>
          <div style={{ height: 88, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: 14, ...(r.demoBg === "photo" ? photoBg : { background: "var(--paper-2)" }) }}>{r.demo}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <b style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.025em", color: "var(--ink-900)" }}>{r.name}</b>
              <span style={{ font: "500 9.5px/1 var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 5,
                background: r.tone === "pay" ? "color-mix(in oklab, var(--danger) 10%, #fff)" : r.tone === "free" ? "color-mix(in oklab, var(--emerald-600) 10%, #fff)" : "var(--paper-2)",
                color: r.tone === "pay" ? "var(--danger)" : r.tone === "free" ? "var(--emerald-700)" : "var(--ink-500)" }}>{r.kind}</span>
            </div>
            <p style={{ margin: "7px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-500)", letterSpacing: "-0.005em", maxWidth: 460 }}>{r.desc}</p>
          </div>
          <div style={{ font: "500 10.5px/1.4 var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-400)", textAlign: "right" }}>{r.where}</div>
        </div>
      ))}
    </div>
  );
}
// saved (filled) preview for reference row
function SaveBtnOn() {
  return (
    <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(250,250,247,0.82)", backdropFilter: "blur(6px)", border: "1px solid rgba(20,22,15,0.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--emerald-700)" }}>
      {PIC.bookmark({ size: 14, fill: "var(--emerald-600)", stroke: "var(--emerald-700)" })}
    </span>
  );
}

/* ── Compatibility rules ── */
function CompatRules() {
  const yes = [
    ["Реклама", "Срочно", "Разные углы фото — не конфликтуют."],
    ["Срочно", "Снижение цены", "Один на фото, другой в блоке цены."],
    ["Готов к стройке", "любой платный", "Бесплатный статус живёт в теле карточки."],
  ];
  const no = [
    "На фото больше 2 чипов",
    "Два чипа в одном углу",
    "Снижение цены продублировано бейджем на фото",
    "«Реклама» заметнее контента",
    "Сердечко вместо закладки для «сохранить»",
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
      <div style={{ border: "1px solid var(--line)", borderRadius: 18, background: "#fff", padding: "6px 22px 12px" }}>
        {yes.map(([a, b, note], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderTop: i ? "1px dashed var(--line)" : "none" }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 99, background: "var(--emerald-600)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{PIC.check({ size: 13, stroke: "#fff" })}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 208 }}>
              <b style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", letterSpacing: "-0.015em" }}>{a}</b>
              <span style={{ color: "var(--ink-300)", fontSize: 13 }}>+</span>
              <b style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-900)", letterSpacing: "-0.015em" }}>{b}</b>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--ink-500)", letterSpacing: "-0.005em" }}>{note}</span>
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid color-mix(in oklab, var(--danger) 18%, transparent)", borderRadius: 18, background: "#fff", padding: "6px 22px 12px" }}>
        {no.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: i ? "1px dashed var(--line)" : "none" }}>
            <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 99, background: "color-mix(in oklab, var(--danger) 12%, #fff)", color: "var(--danger)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{PIC.x({ size: 12, stroke: "var(--danger)" })}</span>
            <span style={{ fontSize: 13.5, color: "var(--ink-700)", letterSpacing: "-0.01em" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PromoCard, PromoCardMobile, AdChip, UrgentChip, BuildReadyChip, SaveBtn, IconOptions, ElementReference, CompatRules, PIC });
