'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PROJECTS } from "./content";
import { IcoGH, IcoLI } from "./icons";
import { computePortfolioLayout } from "./layout";
import { PortfolioNavigation } from "./components/PortfolioNavigation";
import { ContactForm } from "./components/ContactForm";
import { usePortfolioReveal } from "./hooks/usePortfolioReveal";
import { usePortfolioViewport } from "./hooks/usePortfolioViewport";
import { useLenisScroller } from "./hooks/useLenisScroller";
import { useReducedMotionRef } from "@/lib/motion/useReducedMotionRef";
import { PROFILE_LINKS, SITE_EMAIL } from "@/lib/site-config";
import { ArchSection } from "./sections/ArchSection";
import { CloseLookSection } from "./sections/CloseLookSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { WorkSection } from "./sections/WorkSection";
import { getPortfolioThemeColors } from "./theme";

const EDUCATION = [
  "Grado Superior en Dise\u00f1o Gr\u00e1fico \u00b7 Escuela de Arte San Telmo",
  "Grado en Dise\u00f1o Integrado \u00b7 URJC",
  "M\u00e1ster en Dise\u00f1o UX/UI \u00b7 UNIR",
  "M\u00e1ster en Full Stack Developer \u00b7 UNIR (en curso)",
];

const TOOLS = ["Figma", "Angular", "Node/Express", "MySQL", "Next.js", "React", "Three.js", "Twinmotion", "SketchUp", "AutoCAD"];

export default function PortfolioPage() {
  const [theme, setTheme] = useState("dark");
  const [themeReady, setThemeReady] = useState(false);
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
    const raf = window.requestAnimationFrame(() => {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }
      setThemeReady(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!themeReady || typeof window === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, themeReady]);

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
      "Sobre m\u00ed": "section-about",
      Contacto: "section-contact",
    };

    const targetId = sectionMap[link];
    if (!targetId) return;

    const target = wrap.querySelector(`#${targetId}`);
    if (!target) return;

    // "Sobre mí" needs a stable landing point to avoid oscillating the reveal threshold.
    if (link === "Sobre m\u00ed") {
      const heading = target.querySelector("h2");
      const anchor = heading || target;
      const wrapRect = wrap.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const anchorTop = anchorRect.top - wrapRect.top + wrap.scrollTop;
      const navHeight = 52;
      const visualGap = wrap.clientWidth >= 1024 ? 50 : 20;
      const top = Math.max(0, Math.round(anchorTop - navHeight - visualGap));

      wrap.scrollTo({
        top,
        behavior: prefRM.current ? "auto" : "smooth",
      });
      return;
    }

    target.scrollIntoView({
      behavior: prefRM.current ? "auto" : "smooth",
      block: "start",
      inline: "nearest",
    });
  }, [prefRM]);

  const handleBrandClick = useCallback(() => {
    setActiveNav("Trabajo");
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.scrollTo({
      top: 0,
      behavior: prefRM.current ? "auto" : "smooth",
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
        onBrandClick={handleBrandClick}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        colors={colors}
        isAtTop={isNavAtTop}
        isVisible={isNavVisible}
      />

      <main id="main-content">
        <HeroSection heroSectionRef={heroSectionRef} isDark={isDark} colors={colors} onNavSelect={handleNavSelect} />

        <div id="work-section">
          <WorkSection isDark={isDark} C={colors} projects={PROJECTS} />
        </div>

        <CloseLookSection isDark={isDark} prefRM={prefRM} alignLeft={closeLookAlignLeft} />

        <div id="section-3d">
          <ArchSection isDark={isDark} C={colors} prefRM={prefRM} wrapRef={wrapRef} />
        </div>

        <section
          id="section-about"
          style={{
            padding: "var(--sec-pad-y-lg,150px) var(--page-pad-x,28px)",
            background: colors.bgSec,
            transition: "background .5s",
          }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <p
              className="rv"
              style={{
                fontSize: 12,
                color: colors.textSec,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: 22,
              }}>
              Sobre m&iacute;
            </p>
            <h2
              className="rv"
              style={{
                fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
                fontSize: "clamp(30px,4.4vw,52px)",
                fontWeight: 600,
                letterSpacing: "-.015em",
                lineHeight: 1.08,
                color: colors.text,
                marginBottom: 32,
                maxWidth: 860,
              }}>
              Dise&ntilde;o, construyo e investigo productos digitales.
            </h2>
            <div
              className="rv"
              style={{ transitionDelay: ".12s", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: colors.text, fontWeight: 400 }}>
                Soy Manuel Garc&iacute;a-Llera y me mueve una idea simple: un buen producto no se dise&ntilde;a, se entiende. No
                me conformo con que una interfaz se vea bien &mdash; quiero saber c&oacute;mo piensa quien la usa y por
                qu&eacute; una decisi&oacute;n de dise&ntilde;o es la correcta.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: colors.textSec, fontWeight: 400 }}>
                Mi recorrido no fue una l&iacute;nea recta, fue una escalada. Empec&eacute; en el dise&ntilde;o gr&aacute;fico,
                segu&iacute; hacia el dise&ntilde;o integrado, me especialic&eacute; en UX/UI y no par&eacute; hasta aprender a
                construir con c&oacute;digo lo que antes solo dibujaba. Hoy entiendo un producto en todas sus capas: c&oacute;mo
                se ve, c&oacute;mo se siente, c&oacute;mo se construye y por qu&eacute; funciona.
              </p>
              <p style={{ fontSize: 18, lineHeight: 1.65, color: colors.textSec, fontWeight: 400 }}>
                Desde 2018 trabajo en el Departamento de Infraestructura de LALIGA, donde cruzo dise&ntilde;o, visualizaci&oacute;n 3D e
                ingenier&iacute;a en proyectos reales. Y miro hacia adelante: quiero llevar a la investigaci&oacute;n
                la pregunta que me obsesiona &mdash; c&oacute;mo las interfaces ayudan a las personas a decidir y trabajar mejor
                cuando m&aacute;s hay en juego.
              </p>
            </div>

            <div
              className="rv"
              style={{
                transitionDelay: ".2s",
                marginTop: 56,
                display: "grid",
                gap: 40,
                gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              }}>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: colors.textSec,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 14,
                  }}>
                  Estudios
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {EDUCATION.map((item) => (
                    <li key={item} style={{ fontSize: 15, lineHeight: 1.5, color: colors.text }}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 12,
                    color: colors.textSec,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    marginBottom: 14,
                  }}>
                  Herramientas
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {TOOLS.map((tool) => (
                    <span
                      key={tool}
                      style={{
                        fontSize: 13,
                        padding: "6px 13px",
                        borderRadius: 980,
                        border: `1px solid ${colors.divider}`,
                        color: colors.textSec,
                      }}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
              className="rv"
              style={{
                transitionDelay: ".14s",
                fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif',
                fontSize: "clamp(34px,6vw,68px)",
                fontWeight: 600,
                letterSpacing: "-.02em",
                lineHeight: 1.04,
                color: colors.ctaText,
                marginBottom: 20,
              }}>
              Construyamos algo extraordinario.
            </h2>
            <p
              className="rv"
              style={{
                transitionDelay: ".26s",
                fontSize: 17,
                lineHeight: 1.65,
                marginBottom: 36,
                fontWeight: 400,
                color: colors.ctaTextSec,
              }}>
              {"Disponible para proyectos de diseño, producto y 3D arquitectónico."}
            </p>
            <div className="rv" style={{ transitionDelay: ".38s", maxWidth: 460, margin: "0 auto" }}>
              <ContactForm C={colors} isDark={isDark} />
            </div>
            <p
              className="rv"
              style={{ transitionDelay: ".46s", fontSize: 13, color: colors.ctaTextSec, marginTop: 18 }}>
              {"O escríbeme directamente a "}
              <a href={`mailto:${SITE_EMAIL}`} style={{ color: colors.ctaText, textDecoration: "underline" }}>
                {SITE_EMAIL}
              </a>
            </p>
            <div
              className="rv"
              style={{
                transitionDelay: ".54s",
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 26,
              }}>
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
