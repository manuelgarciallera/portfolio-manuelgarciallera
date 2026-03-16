import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PhoneMockupCanvas = dynamic(
  () => import("../three/PhoneMockupCanvas").then((m) => m.PhoneMockupCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(145deg,#0a1222 0%,#10192f 55%,#0d1120 100%)",
        }}
      />
    ),
  }
);

export function DeviceSection({ isDark, C, wrapRef, prefRM }) {
  const secRef = useRef(null);
  const progressRef = useRef(0);
  const panelRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const triggerEl = secRef.current;
    const scrollerEl = wrapRef.current;
    if (!triggerEl || !scrollerEl) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: triggerEl,
        scroller: scrollerEl,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });

      if (!prefRM.current && panelRef.current) {
        gsap.fromTo(
          panelRef.current,
          { y: 24, opacity: 0.82, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: triggerEl,
              scroller: scrollerEl,
              start: "top 80%",
              end: "top 38%",
              scrub: true,
            },
          }
        );
      }

      if (!prefRM.current && badgeRef.current) {
        gsap.fromTo(
          badgeRef.current,
          { autoAlpha: 0, y: 8 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: triggerEl,
              scroller: scrollerEl,
              start: "top 72%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, triggerEl);

    return () => ctx.revert();
  }, [prefRM, wrapRef]);

  return (
    <section
      ref={secRef}
      style={{
        padding: "var(--sec-pad-y,130px) var(--page-pad-x,28px)",
        background: isDark ? "#0a0a0b" : "#f5f5f7",
        transition: "background .5s",
        overflow: "hidden",
      }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: "56px 86px",
          alignItems: "center",
        }}>
        <div>
          <p
            className="rv"
            style={{
              fontSize: 12,
              color: C.teal,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 18,
            }}>
            UX · Product Design
          </p>
          <div style={{ overflow: "hidden", marginBottom: 20 }}>
            <h2
              className="clip-rv ttl-rv"
              style={{
                fontSize: "clamp(26px,4vw,50px)",
                fontWeight: 700,
                letterSpacing: "-.036em",
                lineHeight: 1.1,
              }}>
              <span style={{ color: C.text }}>Diseño que vive en </span>
              <span className={isDark ? "acc-dk" : "acc-lt"}>3D real.</span>
            </h2>
          </div>
          <p
            className="rv2"
            style={{
              transitionDelay: ".14s",
              fontSize: 17,
              color: C.textSec,
              lineHeight: 1.72,
              marginBottom: 34,
            }}>
            Mockup móvil con React Three Fiber y animación por scroll. Estructura lista para reemplazar este modelo por tu GLB optimizado y enseñar casos UX dentro del dispositivo.
          </p>
          <div className="rv2" style={{ transitionDelay: ".28s", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className={isDark ? "btn-dk" : "btn-lt"}>Explorar mockup 3D</button>
            <button className={`btn-ghost-${isDark ? "dk" : "lt"}`}>Pipeline GLB → Web</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "var(--device-min-h,540px)" }}>
          <div
            ref={panelRef}
            className="rs"
            style={{
              width: "min(100%, 560px)",
              height: "clamp(430px,58vw,640px)",
              borderRadius: 34,
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"}`,
              background: isDark
                ? "radial-gradient(120% 120% at 10% 0%,rgba(44,71,132,.34) 0%,rgba(17,24,42,.86) 44%,#0a0d16 100%)"
                : "radial-gradient(120% 120% at 10% 0%,rgba(130,173,245,.34) 0%,rgba(228,238,252,.86) 44%,#edf2f9 100%)",
              boxShadow: isDark ? "0 34px 90px rgba(0,0,0,.56)" : "0 30px 72px rgba(33,43,64,.2)",
            }}>
            <PhoneMockupCanvas isDark={isDark} scrollProgressRef={progressRef} interactive={!prefRM.current} />

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(145deg,rgba(255,255,255,.12) 0%,rgba(255,255,255,0) 36%,rgba(0,0,0,.2) 100%)",
              }}
            />

            <div
              ref={badgeRef}
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                padding: "9px 13px",
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(255,255,255,.24)" : "rgba(0,0,0,.14)"}`,
                background: isDark ? "rgba(20,22,28,.62)" : "rgba(255,255,255,.68)",
                color: isDark ? "#d9edf0" : "#103b51",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: ".03em",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                pointerEvents: "none",
              }}>
              Scroll synced · R3F + GSAP
            </div>

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
                borderRadius: 20,
                padding: "14px 16px",
                border: `1px solid ${isDark ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.66)"}`,
                background: isDark ? "rgba(20,22,30,.54)" : "rgba(255,255,255,.66)",
                color: isDark ? "rgba(245,245,247,.95)" : "#132439",
                fontSize: 13,
                lineHeight: 1.5,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}>
              <strong style={{ fontWeight: 700 }}>Listo para producción.</strong> Este bloque acepta modelos GLB optimizados con Meshopt/Draco y pantallas dinámicas por proyecto.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
