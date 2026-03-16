"use client";

import { useEffect, useState } from "react";

import { SplineScene } from "./SplineScene";

export function SplineLabView() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "96px 28px 56px",
        background: "#06080f",
        color: "#f5f5f7",
      }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "clamp(36px,5vw,64px)",
            fontWeight: 700,
            letterSpacing: "-.032em",
            lineHeight: 1.04,
            marginBottom: 12,
          }}>
          Laboratorio Spline
        </h1>
        <p style={{ color: "rgba(245,245,247,.72)", fontSize: 17, lineHeight: 1.55, marginBottom: 28 }}>
          Entorno preparado para integrar escenas de app.spline.design con fallback accesible y control de movimiento reducido.
        </p>

        <div
          style={{
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.12)",
            minHeight: "72vh",
            background: "#0b0f18",
          }}>
          <SplineScene reducedMotion={reducedMotion} />
        </div>
      </div>
    </section>
  );
}
