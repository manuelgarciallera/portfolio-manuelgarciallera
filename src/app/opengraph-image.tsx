import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 20% 20%, rgba(94,196,200,.32), rgba(13,17,31,.95) 44%, #06080f 100%)",
          color: "white",
          padding: "56px 64px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
        <div style={{ fontSize: 36, opacity: 0.85 }}>Manuel García Llera</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 76, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.04em" }}>
            Diseño que piensa en código.
          </div>
          <div style={{ fontSize: 32, opacity: 0.86 }}>
            UX/UI · Product Design · 3D Arquitectónico · Full Stack
          </div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.8 }}>portfolio profesional · React + Three.js</div>
      </div>
    ),
    size
  );
}
