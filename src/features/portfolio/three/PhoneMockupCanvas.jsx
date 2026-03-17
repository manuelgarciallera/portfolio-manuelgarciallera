"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawGlassCard(ctx, { x, y, w, h, r, title, subtitle, meta, badgeColor = "#5ec4c8", active = false }) {
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, r);
  const grd = ctx.createLinearGradient(x, y, x + w, y + h);
  if (active) {
    grd.addColorStop(0, "rgba(23,104,165,.52)");
    grd.addColorStop(1, "rgba(16,62,114,.42)");
  } else {
    grd.addColorStop(0, "rgba(255,255,255,.13)");
    grd.addColorStop(1, "rgba(255,255,255,.08)");
  }
  ctx.fillStyle = grd;
  ctx.fill();
  if (active) {
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(94,196,200,.7)";
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = badgeColor;
  ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(title, x + 28, y + 42);

  ctx.fillStyle = "rgba(245,245,247,.95)";
  ctx.font = "640 32px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(subtitle, x + 28, y + 84);

  ctx.fillStyle = "rgba(245,245,247,.7)";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText(meta, x + 28, y + 118);
}

function buildScreenTexture(isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 1290;
  canvas.height = 2796;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (isDark) {
    bg.addColorStop(0, "#08122a");
    bg.addColorStop(0.55, "#0a2950");
    bg.addColorStop(1, "#120c23");
  } else {
    bg.addColorStop(0, "#112544");
    bg.addColorStop(0.55, "#1d4673");
    bg.addColorStop(1, "#22183a");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(245,245,247,.95)";
  ctx.font = "640 35px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("9:41", 96, 88);
  ctx.fillText("5G", canvas.width - 152, 88);

  ctx.fillStyle = "rgba(245,245,247,.95)";
  ctx.font = "700 110px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("LALIGA", 96, 264);

  ctx.fillStyle = "#64d8e6";
  ctx.font = "600 38px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Temporada 2025-26", 96, 324);

  drawGlassCard(ctx, {
    x: 86,
    y: 390,
    w: 1118,
    h: 164,
    r: 34,
    title: "EN DIRECTO",
    subtitle: "Real Madrid 2 - 1 Barça",
    meta: "Min 73' · Santiago Bernabéu",
    active: true,
  });

  drawGlassCard(ctx, {
    x: 86,
    y: 590,
    w: 1118,
    h: 132,
    r: 30,
    title: "●",
    subtitle: "Atlético 1-0 Sevilla",
    meta: "Final",
    badgeColor: "#ff4d67",
  });

  drawGlassCard(ctx, {
    x: 86,
    y: 744,
    w: 1118,
    h: 132,
    r: 30,
    title: "▣",
    subtitle: "Clasificación · J30",
    meta: "Ver tabla",
    badgeColor: "#8fd6ff",
  });

  drawGlassCard(ctx, {
    x: 86,
    y: 898,
    w: 1118,
    h: 132,
    r: 30,
    title: "★",
    subtitle: "Mbappé — 15 goles",
    meta: "Top goleador",
    badgeColor: "#f4d35e",
  });

  ctx.fillStyle = "rgba(255,255,255,.24)";
  ctx.fillRect(0, 2480, canvas.width, 2);

  ctx.fillStyle = "rgba(255,255,255,.58)";
  ctx.font = "550 26px -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
  ctx.fillText("Inicio", 148, 2624);
  ctx.fillText("Partidos", 454, 2624);
  ctx.fillText("Tabla", 782, 2624);
  ctx.fillText("Perfil", 1080, 2624);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function PhoneModel({ isDark, scrollProgressRef, interactive = true }) {
  const groupRef = useRef(null);
  const { nodes, materials } = useGLTF("/models/phone.gltf");
  const screenTexture = useMemo(() => buildScreenTexture(isDark), [isDark]);

  const tunedMaterials = useMemo(() => {
    const body = materials["Body.editable"]?.clone();
    const bezel = materials["Bezel.editable"]?.clone();
    const buttons = materials["Buttons.editable"]?.clone();
    const lenses = materials.Lenses?.clone();
    const flash = materials.Flash?.clone();

    if (body) {
      body.color = new THREE.Color(isDark ? "#1f232a" : "#d7dbe5");
      body.metalness = 1;
      body.roughness = 0.2;
      body.clearcoat = 1;
      body.clearcoatRoughness = 0.08;
      body.envMapIntensity = 1.25;
    }

    if (bezel) {
      bezel.color = new THREE.Color("#0a0c11");
      bezel.metalness = 0.7;
      bezel.roughness = 0.26;
      bezel.clearcoat = 0.9;
      bezel.envMapIntensity = 0.9;
    }

    if (buttons) {
      buttons.color = new THREE.Color(isDark ? "#20252d" : "#cfd3dc");
      buttons.metalness = 0.92;
      buttons.roughness = 0.22;
    }

    if (lenses) {
      lenses.color = new THREE.Color("#0c0f16");
      lenses.metalness = 0.96;
      lenses.roughness = 0.08;
      lenses.clearcoat = 1;
      lenses.clearcoatRoughness = 0.03;
    }

    if (flash) {
      flash.color = new THREE.Color("#f2d8b5");
      flash.emissive = new THREE.Color("#f7d9a4");
      flash.emissiveIntensity = isDark ? 0.15 : 0.08;
    }

    return { body, bezel, buttons, lenses, flash };
  }, [isDark, materials]);

  useEffect(() => {
    return () => {
      screenTexture?.dispose();
      Object.values(tunedMaterials).forEach((mat) => mat?.dispose?.());
    };
  }, [screenTexture, tunedMaterials]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const progress = scrollProgressRef?.current ?? 0;
    const targetRotY = -0.16 + progress * 0.24;
    const targetRotX = 0.03 - progress * 0.06;

    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetRotY, 5.8, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetRotX, 5.8, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, interactive ? -0.012 : 0, 5.8, delta);
  });

  return (
    <group ref={groupRef} position={[0, -0.09, 0]} scale={1.7}>
      <mesh castShadow receiveShadow geometry={nodes.Buttons.geometry} material={tunedMaterials.buttons} />
      <mesh castShadow receiveShadow geometry={nodes.Flash.geometry} material={tunedMaterials.flash} />
      <mesh castShadow receiveShadow geometry={nodes.Bezel.geometry} material={tunedMaterials.bezel} />
      <mesh castShadow receiveShadow geometry={nodes.Body.geometry} material={tunedMaterials.body} />
      <mesh castShadow receiveShadow geometry={nodes.Lenses.geometry} material={tunedMaterials.lenses} />
      <mesh castShadow receiveShadow geometry={nodes.Screen.geometry}>
        <meshPhysicalMaterial
          map={screenTexture ?? undefined}
          emissiveMap={screenTexture ?? undefined}
          emissive={new THREE.Color(isDark ? "#4ab0ff" : "#2a78d2")}
          emissiveIntensity={isDark ? 0.32 : 0.24}
          metalness={0}
          roughness={0.08}
          transmission={0}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Scene({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[2.7, 4.2, 3.8]} intensity={1.35} color="#d7e8ff" />
      <pointLight position={[-2.8, 0.9, 2.4]} intensity={0.9} color="#7ec8ff" />
      <pointLight position={[0, -2.0, 1.1]} intensity={0.35} color="#7f97d8" />

      <PhoneModel isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />

      <ContactShadows position={[0, -1.85, 0]} opacity={0.42} blur={2.8} scale={4.8} far={2.1} />
      <Environment preset={isDark ? "night" : "city"} />
    </>
  );
}

export function PhoneMockupCanvas({ isDark, scrollProgressRef, interactive = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0.06, 3.1], fov: 28 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
      <Suspense fallback={null}>
        <Scene isDark={isDark} scrollProgressRef={scrollProgressRef} interactive={interactive} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload("/models/phone.gltf");
