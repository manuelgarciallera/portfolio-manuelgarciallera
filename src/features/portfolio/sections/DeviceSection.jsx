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
          background: "transparent",
        }}
      />
    ),
  }
);

export function DeviceSection({ isDark, C, wrapRef, prefRM }) {
  const secRef = useRef(null);
  const progressRef = useRef(0);
  const phoneRef = useRef(null);

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

      if (!prefRM.current && phoneRef.current) {
        gsap.fromTo(
          phoneRef.current,
          { y: 26, opacity: 0.82 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: triggerEl,
              scroller: scrollerEl,
              start: "top 78%",
              end: "top 34%",
              scrub: true,
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
            {"UX \u00b7 Product Design"}
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
              <span style={{ color: C.text }}>{"Dise\u00f1o que vive en "}</span>
              <span className={isDark ? "acc-dk" : "acc-lt"}>{"iPhone render."}</span>
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
            {
              "Mockup conceptual estilo iPhone 17, fijo y en primer plano, con pantalla de LALIGA optimizada para lectura real en web."
            }
          </p>
          <div className="rv2" style={{ transitionDelay: ".28s", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className={isDark ? "btn-dk" : "btn-lt"}>{"Explorar mockup iPhone"}</button>
            <button className={`btn-ghost-${isDark ? "dk" : "lt"}`}>{"Pipeline GLB \u2192 Web"}</button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "var(--device-min-h,540px)",
          }}>
          <div
            ref={phoneRef}
            className="rs"
            style={{
              width: "min(100%, 470px)",
              height: "clamp(560px,74vh,760px)",
              position: "relative",
              filter: isDark
                ? "drop-shadow(0 30px 52px rgba(0,0,0,.6))"
                : "drop-shadow(0 24px 44px rgba(28,38,57,.26))",
            }}>
            <PhoneMockupCanvas isDark={isDark} scrollProgressRef={progressRef} interactive={!prefRM.current} />
          </div>
        </div>
      </div>
    </section>
  );
}
