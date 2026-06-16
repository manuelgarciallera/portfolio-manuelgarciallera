import { useState } from "react";

import { PORTFOLIO_NAV_LINKS } from "../theme";

export function PortfolioNavigation({
  isDark,
  activeNav,
  onNavSelect,
  onBrandClick,
  onThemeToggle,
  colors,
  isAtTop = true,
  isVisible = true,
}) {
  const compactBrand = !isAtTop;
  const [mobileOpen, setMobileOpen] = useState(false);

  const iconColor = isDark ? "#f5f5f7" : "#1d1d1f";

  const handleMobileSelect = (link) => {
    onNavSelect(link);
    setMobileOpen(false);
  };

  return (
    <nav
      aria-label={"Navegacion principal"}
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
          width: "min(var(--nav-max-w,1540px),100%)",
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
            onClick={onBrandClick}
            aria-label={"Volver al hero"}
            className="pf-nav-brand"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
              background: "transparent",
              border: "none",
            }}>
            <span className={`pf-nav-brand-full${compactBrand ? " is-hidden" : ""}`}>
              {"Manuel Garc\u00eda-Llera A\u00f1\u00f3n"}
            </span>
            <span
              className={`pf-nav-brand-pill${compactBrand ? " is-shown" : ""}`}
              style={{
                color: isDark ? "#f5f5f7" : "#1d1d1f",
                borderColor: isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.14)",
                background: isDark ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.48)",
              }}>
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

          <div
            className="pf-theme-switch"
            role="group"
            aria-label={"Tema de color"}
            style={{
              borderColor: isDark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.12)",
              background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.035)",
            }}>
            <span
              className="pf-theme-knob"
              style={{
                transform: isDark ? "translateX(0)" : "translateX(100%)",
                background: isDark ? "rgba(255,255,255,.13)" : "#fff",
                boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,.14)",
              }}
            />
            <button
              type="button"
              onClick={() => { if (!isDark) onThemeToggle(); }}
              aria-pressed={isDark}
              className={`pf-theme-opt${isDark ? " is-active" : ""}`}
              style={{ color: isDark ? colors.text : colors.textSec }}>
              <svg className="pf-theme-ico-sw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              {"Oscuro"}
            </button>
            <button
              type="button"
              onClick={() => { if (isDark) onThemeToggle(); }}
              aria-pressed={!isDark}
              className={`pf-theme-opt${!isDark ? " is-active" : ""}`}
              style={{ color: !isDark ? colors.text : colors.textSec }}>
              <svg className="pf-theme-ico-sw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
              {"Claro"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Cerrar men\u00fa" : "Abrir men\u00fa"}
            aria-expanded={mobileOpen}
            aria-controls="pf-mobile-menu"
            className="pf-burger show-m"
            style={{ color: iconColor }}>
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="pf-mobile-menu"
          className="pf-mobile-menu show-m"
          style={{
            background: isDark ? "rgba(20,20,24,.97)" : "rgba(250,250,252,.98)",
            borderBottom: `1px solid ${colors.navBorder}`,
          }}>
          {PORTFOLIO_NAV_LINKS.map((link) => (
            <button
              key={link}
              type="button"
              onClick={() => handleMobileSelect(link)}
              aria-current={activeNav === link ? "page" : undefined}
              className={`pf-mobile-link${activeNav === link ? " active" : ""}`}
              style={{ color: iconColor }}>
              {link}
            </button>
          ))}
          <div
            className="pf-mobile-available"
            style={{
              color: colors.teal,
              borderColor: `${colors.teal}55`,
              background: `${colors.teal}12`,
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
            {"Disponible para nuevos proyectos"}
          </div>
        </div>
      )}
    </nav>
  );
}
