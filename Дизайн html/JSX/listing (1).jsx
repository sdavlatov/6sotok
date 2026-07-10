/* listing.jsx — final listing page: base = Modern Marketplace, +mosaic gallery from C, +description from B, +WhatsApp, no duplicate IDs */

const Lst = {
  type: "МЖС",
  title: "МЖС Сейфулино · 200 соток",
  city: "Конаев",
  region: "Алматинская обл.",
  id: "MZS-0061",
};

/* Mosaic gallery (split-view borrowed from variant C, cleaner) */
function Gallery() {
  const [active, setActive] = React.useState(0);
  const [showAll, setShowAll] = React.useState(false);
  return (
    <>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden",
                    display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 4, height: 460,
                    background: "var(--paper-2)" }}>
        {/* main */}
        <div style={{ position: "relative" }}>
          <Photo label={PHOTOS[active].label} tone={PHOTOS[active].tone}
                 style={{ width: "100%", height: "100%" }} rounded={0}/>
          {/* top-left badges */}
          <div style={{ position: "absolute", left: 16, top: 16, display: "flex", gap: 6 }}>
            <span className="chip chip-emerald" style={{ background: "rgba(255,255,255,0.95)", borderColor: "transparent", height: 30 }}>
              <Icon name="verify" size={13} color="var(--emerald-700)"/> Проверено
            </span>
            <span className="chip" style={{ background: "rgba(20,22,15,0.55)", color: "#fff", borderColor: "transparent", backdropFilter: "blur(8px)", height: 30 }}>
              {active + 1} / {PHOTOS.length}
            </span>
          </div>
          {/* nav */}
          <button onClick={() => setActive((a) => (a - 1 + PHOTOS.length) % PHOTOS.length)}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                           width: 40, height: 40, borderRadius: "50%", border: 0, background: "rgba(255,255,255,.92)",
                           cursor: "pointer", boxShadow: "var(--sh-1)" }}>
            <Icon name="arrow-l" size={18}/>
          </button>
          <button onClick={() => setActive((a) => (a + 1) % PHOTOS.length)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                           width: 40, height: 40, borderRadius: "50%", border: 0, background: "rgba(255,255,255,.92)",
                           cursor: "pointer", boxShadow: "var(--sh-1)" }}>
            <Icon name="arrow-r" size={18}/>
          </button>
        </div>
        {/* mosaic side */}
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[1,2].map(i => (
              <button key={i} onClick={() => setActive(i)}
                      style={{ border: 0, padding: 0, cursor: "pointer", position: "relative" }}>
                <Photo label={PHOTOS[i].label} tone={PHOTOS[i].tone}
                       style={{ width: "100%", height: "100%" }} rounded={0}/>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, position: "relative" }}>
            {[3,4].map(i => (
              <button key={i} onClick={() => setActive(i)}
                      style={{ border: 0, padding: 0, cursor: "pointer", position: "relative" }}>
                <Photo label={PHOTOS[i].label} tone={PHOTOS[i].tone}
                       style={{ width: "100%", height: "100%" }} rounded={0}/>
              </button>
            ))}
            <button onClick={() => setShowAll(true)} className="btn"
                    style={{ position: "absolute", right: 14, bottom: 14, height: 36,
                             background: "rgba(255,255,255,0.95)", fontSize: 13 }}>
              <Icon name="grid" size={14}/> Все фото · {PHOTOS.length}
            </button>
          </div>
        </div>
        {/* tools (top right) */}
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
          <button className="btn btn-icon" style={{ width: 38, height: 38 }}><Icon name="heart" size={16}/></button>
          <button className="btn btn-icon" style={{ width: 38, height: 38 }}><Icon name="share" size={16}/></button>
        </div>
      </div>
    </>
  );
}

const Row = ({ icon, label, value, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)" }}>
      <Icon name={icon} size={17}/>
    </div>
    <div style={{ flex: 1, color: "var(--ink-500)", fontSize: 14 }}>{label}</div>
    <div style={{ fontWeight: 600, fontSize: 14.5, color: accent || "var(--ink-900)" }}>{value}</div>
  </div>
);

function PriceCard() {
  return (
    <div className="card" style={{ padding: 22, borderRadius: 18 }}>
      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div className="num" style={{ font: "600 32px/1 var(--font-display)", letterSpacing: "-0.025em" }}>
          100 000 000 ₸
        </div>
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, color: "var(--ink-500)" }}>
        <span className="num">500 000 ₸ / сотка</span>
        <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--ink-300)" }}/>
        <span style={{ color: "var(--emerald-700)", fontWeight: 500 }}>Торг уместен</span>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button className="btn btn-primary" style={{ flex: 1 }}>
          <Icon name="phone" size={16}/> Показать телефон
        </button>
        <button className="btn btn-ghost" style={{ width: 44, padding: 0 }} aria-label="Сообщение">
          <Icon name="msg" size={17}/>
        </button>
      </div>
      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
        </svg>
        WhatsApp
      </button>

      <hr className="hr-soft" style={{ margin: "18px 0" }}/>

      {/* Seller — minimal one row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--emerald-300), var(--emerald-600))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 600, fontSize: 14 }}>А</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
            Алибек Т.
            <Icon name="verify" size={13} color="var(--emerald-600)"/>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Собственник</div>
        </div>
        <a href="#" style={{ fontSize: 13, color: "var(--emerald-800)",
                                fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
          Все объявления →
        </a>
      </div>

      <hr className="hr-soft" style={{ margin: "18px 0" }}/>

      {/* Safe-deal hint — single, light line, no nested card */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-700)" }}>
        <Icon name="shield" size={15} color="var(--emerald-700)"/>
        <span>Сопровождение сделки до&nbsp;ЦОН.{" "}
          <a href="#" style={{ color: "var(--emerald-800)", textDecoration: "none", fontWeight: 500 }}>Узнать →</a>
        </span>
      </div>
    </div>
  );
}

function ListingPage() {
  return (
    <div style={{ background: "var(--paper)", color: "var(--ink-900)", minHeight: "100vh" }}>
      <TopBar/>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 28px 64px" }}>

        {/* Crumbs only — no duplicate tag row */}
        <div className="crumb" style={{ marginBottom: 18 }}>
          <a href="#">Главная</a><span className="sep">/</span>
          <a href="#">Каталог</a><span className="sep">/</span>
          <a href="#">МЖС</a><span className="sep">/</span>
          <a href="#">Алматинская обл.</a><span className="sep">/</span>
          <a href="#">Конаев</a><span className="sep">/</span>
          <span style={{ color: "var(--ink-700)" }}>Сейфулино · 200 соток</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ font: "600 38px/1.15 var(--font-display)",
                          letterSpacing: "-0.022em", color: "var(--ink-900)", margin: 0,
                          textWrap: "balance" }}>
            Участок 200 соток в&nbsp;Сейфулино, Конаев
          </h1>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10,
                          fontSize: 14, color: "var(--ink-500)" }}>
            <Icon name="pin" size={14} color="var(--ink-400)"/>
            <span>мкр. Сейфулино, Конаев</span>
            <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--ink-300)" }}/>
            <span>Алматинская обл.</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
          <div>
            <Gallery/>

            {/* SPECS — Apple-style bento grid: dark marketing tiles */}
            <section style={{ marginTop: 32 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ font: "600 28px/1.1 var(--font-display)", letterSpacing: "-0.022em",
                                margin: 0, color: "var(--ink-900)", textWrap: "balance" }}>
                  Что вы получаете на&nbsp;этом участке
                </h2>
                <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-500)" }}>
                  Несколько причин, почему этот лот выделяется
                </div>
              </div>

              <BentoGrid/>
            </section>

            {/* DESCRIPTION */}
            <section style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ font: "600 20px/1 var(--font-display)", letterSpacing: "-0.015em",
                                margin: 0, color: "var(--ink-900)" }}>Описание</h2>
              </div>
              <p style={{ font: "400 16px/1.7 var(--font-sans)",
                            color: "var(--ink-800)", margin: 0, maxWidth: 680, textWrap: "pretty",
                            letterSpacing: "-0.003em" }}>
                Просторный участок в&nbsp;развивающемся пригороде Конаева, на&nbsp;первой линии от&nbsp;трассы
                Алматы&nbsp;— Талдыкорган. По&nbsp;границе подведены электричество, вода и&nbsp;газ;
                отопление автономное. Ровный рельеф позволяет начать строительство без выравнивания —
                редкое сочетание для участков такой площади в&nbsp;этой локации.
              </p>
            </section>

            {/* LOCATION */}
            <section style={{ marginTop: 28 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ font: "600 20px/1 var(--font-display)", letterSpacing: "-0.015em",
                                margin: 0, color: "var(--ink-900)" }}>Расположение</h2>
                <span style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  43.85°N, 77.07°E
                </span>
              </div>
              <div className="card" style={{ padding: 0, borderRadius: 18, overflow: "hidden" }}>
                <div className="minimap" style={{ height: 320, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex",
                                  alignItems: "center", justifyContent: "center" }}>
                    <ParcelSketch size={320}/>
                  </div>
                  {[
                    { x: "20%", y: "20%", t: "Акимат · 2.4 км" },
                    { x: "78%", y: "30%", t: "ЖД · 4.1 км" },
                    { x: "30%", y: "80%", t: "Алматы — Талдыкорган · 12 км" },
                  ].map((p, i) => (
                    <div key={i} style={{ position: "absolute", left: p.x, top: p.y,
                                            display: "flex", alignItems: "center", gap: 6,
                                            background: "#fff", padding: "6px 10px", borderRadius: 99,
                                            border: "1px solid var(--line)", fontSize: 12, color: "var(--ink-700)",
                                            boxShadow: "var(--sh-1)" }}>
                      <span className="dot"/> {p.t}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT RAIL — slim, no clutter */}
          <aside style={{ position: "sticky", top: 84 }}>
            <PriceCard/>
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-400)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "0 4px" }}>
              <span>ID {Lst.id}</span>
              <span>Опубл. 26 апреля</span>
            </div>
          </aside>
        </div>

        {/* SIMILAR */}
        <div style={{ marginTop: 56 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ font: "600 24px/1 var(--font-display)", letterSpacing: "-0.018em",
                            margin: 0, color: "var(--ink-900)" }}>Похожие участки</h2>
            <a href="#" style={{ color: "var(--emerald-800)", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
              Все в Конаеве →
            </a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            <CatalogCard tone="a" type="Коммерция" area="105 сот."
                         title="Коммерция · 105 соток · Боралдай"
                         price="1 000 001 ₸" perS="200 000 ₸/сот."
                         city="Боралдай, Алматинская обл."
                         meta="на трассе"
                         utils={["light","gas","act"]}/>
            <CatalogCard tone="b" type="МЖС" area="200 сот."
                         title="МЖС · 200 соток · Сейфулино"
                         price="100 000 000 ₸" perS="500 000 ₸/сот."
                         city="Конаев, Алматинская обл."
                         meta="12 км до трассы"
                         utils={["light","gas","water","act"]}/>
            <CatalogCard tone="c" type="ИЖС" area="10 сот."
                         title="ИЖС · 10 соток · Алтынсарина"
                         price="1 000 000 ₸" perS="100 000 ₸/сот."
                         city="с. Ыбырая, Акмолинская обл."
                         meta="у озера"
                         utils={["light","act"]}/>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ListingPage = ListingPage;
