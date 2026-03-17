'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PROJECTS } from "./content";
import { IcoGH, IcoLI } from "./icons";
import { computePortfolioLayout } from "./layout";
import { PortfolioNavigation } from "./components/PortfolioNavigation";
import { usePortfolioReveal } from "./hooks/usePortfolioReveal";
import { usePortfolioViewport } from "./hooks/usePortfolioViewport";
import { useLenisScroller } from "./hooks/useLenisScroller";
import { useReducedMotionRef } from "@/lib/motion/useReducedMotionRef";
import { PROFILE_LINKS, SITE_EMAIL } from "@/lib/site-config";
import { ArchSection } from "./sections/ArchSection";
import { CloseLookSection } from "./sections/CloseLookSection";
import { ComparisonSection } from "./sections/ComparisonSection";
import { DeviceSection } from "./sections/DeviceSection";
import { FeaturedSection } from "./sections/FeaturedSection";
import { FullStackSection } from "./sections/FullStackSection";
import { FooterSection } from "./sections/FooterSection";
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
  const [isNavAtTop, setIsNavAtTop] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const wrapRef = useRef(null);
  const heroSectionRef = useRef(null);
  const navAtTopRef = useRef(true);
  const navVisibleRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const prefRM = useReducedMotionRef();
  const lenisEnabled = process.env.NEXT_PUBLIC_ENABLE_LENIS === "true";

  const vp = usePortfolioViewport();
  usePortfolioReveal(wrapRef, prefRM);
  useLenisScroller({ wrapRef, enabled: lenisEnabled });

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const scroller = wrapRef.current;
    if (!scroller) return;

    const autoHideNav = vp.w >= 768;
    let rafId = 0;

    const applyNavTop = (next) => {
      if (navAtTopRef.current === next) return;
      navAtTopRef.current = next;
      setIsNavAtTop(next);
    };

    const applyNavVisible = (next) => {
      if (navVisibleRef.current === next) return;
      navVisibleRef.current = next;
      setIsNavVisible(next);
    };

    const onFrame = () => {
      rafId = 0;
      const currentY = scroller.scrollTop;
      const delta = currentY - lastScrollTopRef.current;
      const absDelta = Math.abs(delta);
      const atTop = currentY <= 8;

      applyNavTop(atTop);

      if (!autoHideNav) {
        applyNavVisible(true);
      } else if (atTop) {
        applyNavVisible(true);
      } else if (absDelta >= 3) {
        if (delta > 0 && currentY > 90) applyNavVisible(false);
        if (delta < 0) applyNavVisible(true);
      }

      lastScrollTopRef.current = currentY;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(onFrame);
    };

    lastScrollTopRef.current = scroller.scrollTop;
    onFrame();

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [vp.w]);

  const handleNavSelect = useCallback((link) => {
    setActiveNav(link);
    const wrap = wrapRef.current;
    if (!wrap) return;

    const sectionMap = {
      Trabajo: "work-section",
      "3D": "section-3d",
      "Sobre mí": "section-about",
      Contacto: "section-contact",
    };

    const targetId = sectionMap[link];
    if (!targetId) return;

    const target = wrap.querySelector(`#${targetId}`);
    if (!target) return;

    target.scrollIntoView({
      behavior: prefRM.current ? "auto" : "smooth",
      block: "start",
      inline: "nearest",
    });
  }, [prefRM]);

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
        onNavSelect={handleNavSelect}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        colors={colors}
        isAtTop={isNavAtTop}
        isVisible={isNavVisible}
      />

      <main id="main-content">
        <HeroSection wrapRef={wrapRef} heroSectionRef={heroSectionRef} prefRM={prefRM} />

        <div id="work-section">
          <HeroGallerySection isDark={isDark} prefRM={prefRM} wrapRef={wrapRef} />
        </div>

        <div id="section-about">
          <CloseLookSection isDark={isDark} prefRM={prefRM} alignLeft={closeLookAlignLeft} />
        </div>

        <FeaturedSection isDark={isDark} C={colors} />

        <div id="section-3d">
          <ArchSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />
        </div>

        <MiniProjectsSection isDark={isDark} C={colors} projects={[PROJECTS[0], PROJECTS[1], PROJECTS[2]]} />

        <UXSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />

        <MiniProjectsSection isDark={isDark} C={colors} projects={[PROJECTS[3], PROJECTS[0], PROJECTS[1]]} alt />

        <FullStackSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />
        <DeviceSection isDark={isDark} C={colors} wrapRef={wrapRef} prefRM={prefRM} />
        <ComparisonSection isDark={isDark} C={colors} />

        <section
          id="section-contact"
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
              {"Disponible para proyectos de diseño, producto y 3D arquitectónico."}
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
              <a className="btn-blue" style={{ padding: "13px 28px", textDecoration: "none" }} href={`mailto:${SITE_EMAIL}`}>
                {"Contactar →"}
              </a>
              <a
                className={`btn-social${isDark ? " btn-social-lt" : ""}`}
                style={{ textDecoration: "none" }}
                href={PROFILE_LINKS.linkedin}
                target="_blank"
                rel="noreferrer noopener">
                <IcoLI c={isDark ? "#1d1d1f" : "#f5f5f7"} /> LinkedIn
              </a>
              <a
                className={`btn-social${isDark ? " btn-social-lt" : ""}`}
                style={{ textDecoration: "none" }}
                href={PROFILE_LINKS.github}
                target="_blank"
                rel="noreferrer noopener">
                <IcoGH c={isDark ? "#1d1d1f" : "#f5f5f7"} /> GitHub
              </a>
            </div>
          </div>
        </section>

        <FooterSection isDark={isDark} C={colors} />
      </main>
    </div>
  );
}
