"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";

function buildScreenTexture(isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 1024, 2048);
  if (isDark) {
    grad.addColorStop(0, "#0a0f22");
    grad.addColorStop(0.45, "#0f2952");
    grad.addColorStop(1, "#141021");
  } else {
    grad.addColorStop(0, "#1b2b55");
    grad.addColorStop(0.45, "#21436f");
    grad.addColorStop(1, "#241d33");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 2048);

  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.font = "700 118px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("LALIGA", 92, 240);

  ctx.fillStyle = "rgba(94,196,200,.95)";
  ctx.font = "600 44px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Temporada 2025-26", 92, 320);

  const card = { x: 92, y: 420, w: 840, h: 380, r: 42 };
  ctx.fillStyle = "rgba(94,196,200,.18)";
  roundRect(ctx, card.x, card.y, card.w, card.h, card.r);
  ctx.fill();
  ctx.strokeStyle = "rgba(94,196,200,.48)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "rgba(94,196,200,.95)";
  ctx.font = "700 34px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("EN DIRECTO", card.x + 36, card.y + 70);

  ctx.fillStyle = "rgba(255,255,255,.98)";
  ctx.font = "700 58px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Real Madrid 2 - 1 Bar\u00e7a", card.x + 36, card.y + 160);

  ctx.fillStyle = "rgba(255,255,255,.62)";
  ctx.font = "500 34px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Min 73' \u00b7 Santiago Bernab\u00e9u", card.x + 36, card.y + 220);

  drawRow(ctx, 92, 860, 840, 220, "Atl\u00e9tico 1-0 Sevilla", "Final");
  drawRow(ctx, 92, 1110, 840, 220, "Clasificaci\u00f3n \u00b7 J30", "Ver tabla");
  drawRow(ctx, 92, 1360, 840, 220, "Mbapp\u00e9 \u2014 15 goles", "Top goleador");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawRow(ctx, x, y, w, h, title, sub) {
  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundRect(ctx, x, y, w, h, 34);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.96)";
  ctx.font = "650 46px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(title, x + 40, y + 92);

  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.font = "500 34px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(sub, x + 40, y + 145);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function DeviceMesh({ isDark, scrollProgressRef, interactive = true }) {
  const groupRef = useRef(null);
  const screenTexture = useMemo(() => buildScreenTexture(isDark), [isDark]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.getElapsedTime();
    const p = scrollProgressRef?.current ?? 0;

    const targetRotY = -0.38 + p * 1.02;
    const targetRotX = 0.14 - p * 0.26;
    const targetPosY = -0.14 + Math.sin(t * 0.7) * 0.04;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 4.8, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 4.2, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, Math.sin(t * 0.55) * 0.03, 3.6, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, targetPosY, 4.6, delta);
  });

  return (
    <Float speed={interactive ? 1.2 : 0.55} floatIntensity={interactive ? 0.22 : 0.08} rotationIntensity={interactive ? 0.12 : 0.04}>
      <group ref={groupRef} position={[0, -0.05, 0]}>
        <RoundedBox args={[1.22, 2.55, 0.14]} radius={0.16} smoothness={6}>
          <meshStandardMaterial
            color={isDark ? "#252830" : "#d8dbe3"}
            metalness={0.88}
            roughness={0.24}
            envMapIntensity={1.15}
          />
        </RoundedBox>

        <RoundedBox args={[1.1, 2.34, 0.02]} radius={0.11} smoothness={6} position={[0, 0, 0.079]}>
          <meshBasicMaterial map={screenTexture ?? undefined} />
        </RoundedBox>

        <RoundedBox args={[1.12, 2.36, 0.012]} radius={0.11} smoothness={6} position={[0, 0, 0.092]}>
          <MeshTransmissionMaterial
            samples={4}
            thickness={0.16}
            roughness={0.08}
            chromaticAberration={0.02}
            anisotropy={0.1}
            distortion={0.04}
            distortionScale={0.18}
            temporalDistortion={0.08}
            iridescence={0.22}
            iridescenceIOR={1.1}
            ior={1.36}
            transmission={0.98}
            clearcoat={1}
            clearcoatRoughness={0.09}
            attenuationDistance={2.5}
            attenuationColor={isDark ? "#93d2dd" : "#9ab3ff"}
          />
        </RoundedBox>

        <RoundedBox args={[0.34, 0.075, 0.018]} radius={0.04} smoothness={4} position={[0, 1.08, 0.096]}>
          <meshStandardMaterial color="#09090b" metalness={0.32} roughness={0.48} />
        </RoundedBox>
      </group>
    </Float>
  );
}

function Scene({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.4, 3.4, 3]} intensity={1.35} color="#cce7ff" />
      <pointLight position={[-2.4, 1.2, 1.8]} intensity={0.72} color="#88f3ff" />
      <pointLight position={[0, -2.1, 1.1]} intensity={0.32} color="#3d79d6" />

      <DeviceMesh isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />

      <ContactShadows position={[0, -1.55, 0]} opacity={0.45} blur={2.6} scale={4.2} far={1.8} />
      <Environment preset={isDark ? "night" : "city"} />
    </>
  );
}

export function PhoneMockupCanvas({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.3], fov: 31 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <Suspense fallback={null}>
        <Scene isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />
      </Suspense>
    </Canvas>
  );
}
