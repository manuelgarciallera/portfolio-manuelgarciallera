import { PORTFOLIO_NAV_LINKS } from "../theme";

export function PortfolioNavigation({
  isDark,
  activeNav,
  onNavSelect,
  onThemeToggle,
  colors,
  isAtTop = true,
  isVisible = true,
}) {
  const compactBrand = !isAtTop;

  return (
    <nav
      aria-label={"Navegación principal"}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        height: 52,
        animation: "pfade .4s ease",
        background: isDark ? "rgba(24,24,28,.78)" : "rgba(250,250,252,.8)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        borderBottom: `1px solid ${colors.navBorder}`,
        transform: isVisible ? "translateY(0)" : "translateY(calc(-100% - 8px))",
        transition: "background .25s,border-color .25s,transform .42s cubic-bezier(.22,.61,.36,1)",
      }}>
      <div
        style={{
          width: "min(1540px,100%)",
          height: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "stretch",
          gap: 12,
          padding: "0 var(--nav-pad-x,24px)",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifySelf: "start", minWidth: 0 }}>
          <button
            type="button"
            onClick={() => onNavSelect("Trabajo")}
            aria-label={"Volver al inicio"}
            className="pf-nav-brand"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
              background: "transparent",
              border: "none",
            }}>
            <span className={`pf-nav-brand-full${compactBrand ? " is-hidden" : ""}`}>
              {"Manuel García-Llera Añón"}
            </span>
            <span
              className={`pf-nav-brand-pill${compactBrand ? " is-shown" : ""}`}
              style={{
                color: isDark ? "#f5f5f7" : "#1d1d1f",
                borderColor: isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.14)",
                background: isDark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.48)",
              }}>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                className="pf-nav-brand-mark"
                style={{ color: "currentColor" }}>
                <path
                  d="M4 16V8l3.4 4.4L10.8 8V16M13 16V8l4.8 8V8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontWeight: 650, letterSpacing: ".02em" }}>{"MGLA"}</span>
            </span>
          </button>
        </div>

        <div className="hide-m" style={{ display: "flex", alignItems: "stretch", justifySelf: "center", height: "100%" }}>
          {PORTFOLIO_NAV_LINKS.map((link) => (
            <button
              key={link}
              type="button"
              onClick={() => onNavSelect(link)}
              aria-current={activeNav === link ? "page" : undefined}
              className={`nl ${isDark ? "nl-dk" : "nl-lt"}${activeNav === link ? " active" : ""}`}
              style={{ background: "transparent", border: "none" }}>
              {link}
              <span className="nl-bar" style={{ background: isDark ? "#fff" : "#1d1d1f" }} />
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "end" }}>
          <div
            className="hide-m"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 980,
              border: `1px solid ${colors.teal}55`,
              background: `${colors.teal}12`,
              fontSize: 12,
              color: colors.teal,
              fontWeight: 500,
              letterSpacing: "-.01em",
            }}>
            <span
              style={{
                width: 5.5,
                height: 5.5,
                borderRadius: "50%",
                background: colors.teal,
                display: "inline-block",
                animation: "ppulse 2.2s infinite",
              }}
            />
            {"Disponible"}
          </div>

          <button
            type="button"
            onClick={onThemeToggle}
            aria-pressed={!isDark}
            aria-label={"Cambiar tema de color"}
            className={isDark ? "btn-dk" : "btn-lt"}
            style={{ fontSize: 12.5, padding: "6px 14px" }}>
            {isDark ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
        </div>
      </div>
    </nav>
  );
}
