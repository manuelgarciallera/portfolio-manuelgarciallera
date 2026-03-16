"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, RoundedBox } from "@react-three/drei";

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawCard(ctx, options) {
  const { x, y, w, h, radius, title, subtitle, accent = "#54e6f4", highlight = false } = options;

  ctx.fillStyle = highlight ? "rgba(22,88,140,.34)" : "rgba(255,255,255,.08)";
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  if (highlight) {
    ctx.strokeStyle = "rgba(94,196,200,.55)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.font = "700 38px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(title, x + 40, y + 72);

  ctx.fillStyle = "rgba(245,245,247,.95)";
  ctx.font = "650 52px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(subtitle, x + 40, y + 144);
}

function buildScreenTexture(isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 1290;
  canvas.height = 2796;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1290, 2796);
  if (isDark) {
    gradient.addColorStop(0, "#090f20");
    gradient.addColorStop(0.45, "#102c54");
    gradient.addColorStop(1, "#170f27");
  } else {
    gradient.addColorStop(0, "#0e2545");
    gradient.addColorStop(0.45, "#18426f");
    gradient.addColorStop(1, "#26193a");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "650 36px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("9:41", 94, 100);
  ctx.fillText("5G", 1092, 100);

  ctx.fillStyle = "rgba(245,245,247,.95)";
  ctx.font = "700 128px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("LALIGA", 92, 276);

  ctx.fillStyle = "rgba(94,196,200,.95)";
  ctx.font = "620 42px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Temporada 2025-26", 94, 352);

  drawCard(ctx, {
    x: 94,
    y: 430,
    w: 1102,
    h: 380,
    radius: 46,
    title: "EN DIRECTO",
    subtitle: "Real Madrid 2 - 1 Bar\u00e7a",
    highlight: true,
  });

  ctx.fillStyle = "rgba(255,255,255,.64)";
  ctx.font = "500 36px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Min 73' \u00b7 Santiago Bernab\u00e9u", 134, 705);

  drawCard(ctx, {
    x: 94,
    y: 870,
    w: 1102,
    h: 250,
    radius: 38,
    title: "\ud83d\udd34",
    subtitle: "Atl\u00e9tico 1-0 Sevilla",
    accent: "rgba(255,255,255,.62)",
  });

  drawCard(ctx, {
    x: 94,
    y: 1160,
    w: 1102,
    h: 250,
    radius: 38,
    title: "\ud83d\udcca",
    subtitle: "Clasificaci\u00f3n \u00b7 J30",
    accent: "rgba(255,255,255,.62)",
  });

  drawCard(ctx, {
    x: 94,
    y: 1450,
    w: 1102,
    h: 250,
    radius: 38,
    title: "\u2b50",
    subtitle: "Mbapp\u00e9 \u2014 15 goles",
    accent: "rgba(255,255,255,.62)",
  });

  ctx.fillStyle = "rgba(255,255,255,.42)";
  ctx.font = "560 34px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Inicio", 180, 2610);
  ctx.fillText("Partidos", 500, 2610);
  ctx.fillText("Tabla", 820, 2610);
  ctx.fillText("Perfil", 1080, 2610);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

function DeviceMesh({ isDark, scrollProgressRef, interactive = true }) {
  const groupRef = useRef(null);
  const screenTexture = useMemo(() => buildScreenTexture(isDark), [isDark]);

  useEffect(() => {
    return () => screenTexture?.dispose();
  }, [screenTexture]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const progress = scrollProgressRef?.current ?? 0;
    const targetRotY = -0.11 + progress * 0.24;
    const targetRotX = 0.03 - progress * 0.08;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 6, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 6, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, interactive ? -0.01 : 0, 6, delta);
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      <RoundedBox args={[1.14, 2.38, 0.1]} radius={0.19} smoothness={6}>
        <meshPhysicalMaterial
          color={isDark ? "#23262e" : "#d8dbe5"}
          metalness={0.95}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.1}
        />
      </RoundedBox>

      <RoundedBox args={[1.04, 2.27, 0.012]} radius={0.15} smoothness={6} position={[0, 0, 0.048]}>
        <meshBasicMaterial color="#050608" />
      </RoundedBox>

      <RoundedBox args={[0.985, 2.16, 0.002]} radius={0.11} smoothness={6} position={[0, 0, 0.055]}>
        <meshBasicMaterial map={screenTexture ?? undefined} toneMapped={false} />
      </RoundedBox>

      <RoundedBox args={[0.28, 0.06, 0.012]} radius={0.04} smoothness={6} position={[0, 1.05, 0.058]}>
        <meshStandardMaterial color="#0b0c10" metalness={0.4} roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

function Scene({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.8, 3.6, 3.6]} intensity={1.25} color="#cfe6ff" />
      <pointLight position={[-2.6, 0.8, 2.2]} intensity={0.72} color="#86d7ff" />
      <pointLight position={[0, -2.2, 1.1]} intensity={0.28} color="#4b76d0" />

      <DeviceMesh isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />

      <ContactShadows position={[0, -1.58, 0]} opacity={0.44} blur={2.8} scale={4.4} far={1.8} />
      <Environment preset={isDark ? "night" : "city"} />
    </>
  );
}

export function PhoneMockupCanvas({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0.04, 3.25], fov: 30 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <Suspense fallback={null}>
        <Scene isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />
      </Suspense>
    </Canvas>
  );
}
