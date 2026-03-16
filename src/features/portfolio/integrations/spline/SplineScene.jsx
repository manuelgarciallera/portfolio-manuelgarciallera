"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { getSplineSceneUrl } from "./config";

const SPLINE_FALLBACK_STYLE = {
  width: "100%",
  height: "100%",
  background: "radial-gradient(120% 120% at 20% 0%,rgba(94,196,200,.18),rgba(16,21,35,.9) 48%,#080b12 100%)",
};

const Spline = dynamic(() => import("@splinetool/react-spline").then((module) => module.default), {
  ssr: false,
  loading: () => <div style={SPLINE_FALLBACK_STYLE} />,
});

export function SplineScene({ reducedMotion = false, sceneUrl }) {
  const scene = useMemo(() => sceneUrl || getSplineSceneUrl(), [sceneUrl]);

  if (!scene || reducedMotion) {
    return (
      <div
        style={{
          ...SPLINE_FALLBACK_STYLE,
          display: "grid",
          placeItems: "center",
          color: "rgba(245,245,247,.92)",
          fontSize: 14,
          letterSpacing: "-.01em",
          textAlign: "center",
          padding: 24,
        }}>
        Modo reducido activo: visual 3D estático.
      </div>
    );
  }

  return <Spline scene={scene} style={{ width: "100%", height: "100%" }} aria-hidden="true" />;
}
