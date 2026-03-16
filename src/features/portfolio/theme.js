export const PORTFOLIO_NAV_LINKS = ["Trabajo", "3D", "Sobre m\u00ed", "Contacto"];

export function getPortfolioThemeColors(isDark) {
  if (isDark) {
    return {
      bg: "#000",
      bgSec: "#0a0a0b",
      bgAlt: "#111114",
      card: "#1c1c1e",
      border: "rgba(255,255,255,0.07)",
      text: "#f5f5f7",
      textSec: "#86868b",
      nav: "#1d1d1f",
      navBorder: "rgba(255,255,255,0.1)",
      teal: "#5ec4c8",
      ctaBg: "#f5f5f7",
      ctaText: "#1d1d1f",
      ctaTextSec: "#6e6e73",
      statBg: "#1c1c1e",
      divider: "rgba(255,255,255,0.07)",
    };
  }

  return {
    bg: "#fff",
    bgSec: "#f5f5f7",
    bgAlt: "#fff",
    card: "#fff",
    border: "rgba(0,0,0,0.0)",
    text: "#1d1d1f",
    textSec: "#6e6e73",
    nav: "rgba(255,255,255,0.94)",
    navBorder: "rgba(0,0,0,0.1)",
    teal: "#0e6b6b",
    ctaBg: "#1d1d1f",
    ctaText: "#f5f5f7",
    ctaTextSec: "#86868b",
    statBg: "#fff",
    divider: "rgba(0,0,0,0.07)",
  };
}
