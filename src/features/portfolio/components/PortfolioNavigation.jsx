import { PORTFOLIO_NAV_LINKS } from "../theme";

export function PortfolioNavigation({
  isDark,
  activeNav,
  onNavSelect,
  onThemeToggle,
  colors,
}) {
  return (
    <nav
      aria-label={"Navegaci\u00F3n principal"}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        height: 52,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        padding: "0 var(--nav-pad-x,24px)",
        animation: "pfade .4s ease",
        background: isDark ? "#1d1d1f" : colors.nav,
        backdropFilter: !isDark ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: !isDark ? "blur(20px) saturate(180%)" : "none",
        borderBottom: `1px solid ${colors.navBorder}`,
        transition: "background .25s,border-color .25s",
      }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-.04em",
            color: isDark ? "#f5f5f7" : "#1d1d1f",
          }}>
          {"Manuel Garc\u00EDa Llera"}
        </span>
      </div>

      <div
        className="hide-m"
        style={{
          display: "flex",
          alignItems: "stretch",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          height: "100%",
        }}>
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

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          {isDark ? "\u2600\uFE0F Claro" : "\uD83C\uDF19 Oscuro"}
        </button>
      </div>
    </nav>
  );
}
