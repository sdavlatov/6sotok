/* catalog-card.jsx — reference-aligned catalog card (matches user's existing 6sotok grid) */

function CatalogCard({
  tone = "a",
  type = "МЖС",
  area = "200 сот.",
  title = "МЖС · 200 соток · Сейфулино",
  price = "100 000 000 ₸",
  perS = "500 000 ₸/сот.",
  city = "Конаев, Алматинская обл.",
  meta = "12 км до трассы",
  utils = ["light", "gas", "water", "act"],
}) {
  const [hover, setHover] = React.useState(false);

  // Цветные точки коммуникаций — как в исходном референсе
  const UTIL = {
    light: { color: "#F4B400", label: "Свет"     },
    gas:   { color: "#E97B27", label: "Газ"      },
    water: { color: "#2196F3", label: "Вода"     },
    road:  { color: "#9E9E9E", label: "Дорога"   },
    act:   { color: "var(--emerald-600)", label: "Госакт" },
  };

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
         style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--line)",
                  overflow: "hidden", transition: "transform .25s, box-shadow .25s, border-color .2s",
                  transform: hover ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: hover ? "var(--sh-3)" : "var(--sh-1)",
                  borderColor: hover ? "var(--ink-300)" : "var(--line)",
                  cursor: "pointer", display: "flex", flexDirection: "column" }}>
      {/* full-bleed photo, нет оверлея на тексте */}
      <div style={{ position: "relative", aspectRatio: "16/10" }}>
        <Photo label={PHOTOS[0].label} tone={tone} style={{ width: "100%", height: "100%" }} rounded={0}/>
        <button className="btn btn-icon"
                style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34 }}
                aria-label="В избранное">
          <Icon name="heart" size={14}/>
        </button>
        {/* площадь как тонкий чип, без стилистики «над фото» */}
        <span style={{ position: "absolute", left: 10, top: 10,
                         background: "rgba(20,22,15,0.62)", color: "#fff",
                         backdropFilter: "blur(8px)",
                         padding: "5px 10px", borderRadius: 99,
                         font: "500 11.5px/1 var(--font-sans)" }}>
          {area}
        </span>
      </div>

      {/* body — компактный, цена ЗЕЛЁНАЯ */}
      <div style={{ padding: "12px 14px 14px" }}>
        {/* type · area */}
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500, letterSpacing: "-0.005em" }}>
          {type} · {area}
        </div>

        {/* price */}
        <div className="num" style={{ font: "700 22px/1.1 var(--font-sans)",
                                        letterSpacing: "-0.02em",
                                        color: "var(--emerald-700)",
                                        marginTop: 4 }}>
          {price}
        </div>
        <div className="num" style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>
          {perS}
        </div>

        {/* location */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--ink-700)",
                        fontSize: 13, marginTop: 10, fontWeight: 500 }}>
          <Icon name="pin" size={13} color="var(--ink-500)"/> {city}
        </div>

        {/* meta — «12 км до трассы» */}
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 3, paddingLeft: 18 }}>
          {meta}
        </div>

        {/* utility dots — как в референсе пользователя */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginTop: 12,
                        paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
          {utils.map((u, i) => {
            const cfg = UTIL[u];
            if (!cfg) return null;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5,
                                       fontSize: 12, color: "var(--ink-700)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: cfg.color }}/>
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.CatalogCard = CatalogCard;
