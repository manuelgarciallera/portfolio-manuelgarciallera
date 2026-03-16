'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import { PROJECTS } from "./content";
import { IcoGH, IcoLI } from "./icons";
import { computePortfolioLayout } from "./layout";
import { PortfolioNavigation } from "./components/PortfolioNavigation";
import { usePortfolioReveal } from "./hooks/usePortfolioReveal";
import { usePortfolioViewport } from "./hooks/usePortfolioViewport";
import { useLenisScroller } from "./hooks/useLenisScroller";
import { ArchSection } from "./sections/ArchSection";
import { CloseLookSection } from "./sections/CloseLookSection";
import { ComparisonSection } from "./sections/ComparisonSection";
import { DeviceSection } from "./sections/DeviceSection";
import { FeaturedSection } from "./sections/FeaturedSection";
import { FullStackSection } from "./sections/FullStackSection";
import { HeroGallerySection } from "./sections/HeroGallerySection";
import { HeroSection } from "./sections/HeroSection";
import { MiniProjectsSection } from "./sections/MiniProjectsSection";
import { UXSection } from "./sections/UXSection";
import { getPortfolioThemeColors } from "./theme";

export default function PortfolioPage() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const storedTheme = localStorage.getItem("theme");
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
  });
  const [activeNav, setActiveNav] = useState("Trabajo");
  const wrapRef = useRef(null);
  const heroSectionRef = useRef(null);
  const prefRM = useRef(false);
  const lenisEnabled = process.env.NEXT_PUBLIC_ENABLE_LENIS === "true";

  const vp = usePortfolioViewport();
  usePortfolioReveal(wrapRef);
  useLenisScroller({ wrapRef, enabled: lenisEnabled });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { prefRM.current = media.matches; };
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const { rootVars, closeLookAlignLeft } = useMemo(() => computePortfolioLayout(vp), [vp]);

  const isDark = theme === "dark";
  const colors = useMemo(() => getPortfolioThemeColors(isDark), [isDark]);

  return (
    <div
      ref={wrapRef}
      className="p"
      style={{
        height: "100vh",
        overflowY: "scroll",
        overflowX: "hidden",
        background: colors.bg,
        color: colors.text,
        transition: "background .5s,color .35s",
        scrollbarWidth: "thin",
        ...rootVars,
      }}>
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>

      <PortfolioNavigation
        isDark={isDark}
        activeNav={activeNav}
        onNavSelect={setActiveNav}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        colors={colors}
      />

      <main id="main-content">
        <HeroSection wrapRef={wrapRef} heroSectionRef={heroSectionRef} prefRM={prefRM} />

        <HeroGallerySection isDark={isDark} prefRM={prefRM} wrapRef={wrapRef} />
        <CloseLookSection isDark={isDark} prefRM={prefRM} alignLeft={closeLookAlignLeft} />

        <FeaturedSection isDark={isDark} C={colors} />
        <ArchSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />

        <MiniProjectsSection isDark={isDark} C={colors} projects={[PROJECTS[0], PROJECTS[1], PROJECTS[2]]} />

        <UXSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />

        <MiniProjectsSection isDark={isDark} C={colors} projects={[PROJECTS[3], PROJECTS[0], PROJECTS[1]]} alt />

        <FullStackSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />
        <DeviceSection isDark={isDark} C={colors} wrapRef={wrapRef} prefRM={prefRM} />
        <ComparisonSection isDark={isDark} C={colors} />

        <section
          style={{
            padding: "var(--sec-pad-y-lg,150px) var(--page-pad-x,28px)",
            textAlign: "center",
            background: colors.ctaBg,
            transition: "background .5s",
          }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <p
              className="rv"
              style={{
                fontSize: 12,
                color: colors.ctaTextSec,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: 22,
              }}>
              Contacto
            </p>
            <h2
              className="rv ttl-rv"
              style={{
                transitionDelay: ".14s",
                fontSize: "clamp(34px,6vw,68px)",
                fontWeight: 700,
                letterSpacing: "-.046em",
                lineHeight: 1.02,
                marginBottom: 20,
                color: colors.ctaText,
              }}>
              Construyamos algo <span className={isDark ? "acc-lt" : "acc-dk"}>extraordinario.</span>
            </h2>
            <p
              className="rv"
              style={{
                transitionDelay: ".26s",
                fontSize: 17,
                lineHeight: 1.65,
                marginBottom: 44,
                fontWeight: 400,
                color: colors.ctaTextSec,
              }}>
              Disponible para proyectos de dise\u00f1o, producto y 3D arquitect\u00f3nico.
            </p>
            <div
              className="rv"
              style={{
                transitionDelay: ".38s",
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "center",
              }}>
              <button className="btn-blue" style={{ padding: "13px 28px" }}>Contactar \u2192</button>
              <button className={`btn-social${isDark ? " btn-social-lt" : ""}`}>
                <IcoLI c={isDark ? "#1d1d1f" : "#f5f5f7"} /> LinkedIn
              </button>
              <button className={`btn-social${isDark ? " btn-social-lt" : ""}`}>
                <IcoGH c={isDark ? "#1d1d1f" : "#f5f5f7"} /> GitHub
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
