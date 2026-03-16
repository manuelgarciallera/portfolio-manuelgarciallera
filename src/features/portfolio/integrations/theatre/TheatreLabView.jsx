"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getProject, types } from "@theatre/core";

import { isTheatreStudioEnabled, THEATRE_PROJECT_NAME, THEATRE_SHEET_NAME } from "./config";

const ORB_DEFAULTS = {
  rotationY: types.number(0, { range: [-Math.PI, Math.PI], nudgeMultiplier: 0.01 }),
  rotationX: types.number(0, { range: [-1.1, 1.1], nudgeMultiplier: 0.01 }),
  positionX: types.number(0, { range: [-1.8, 1.8], nudgeMultiplier: 0.01 }),
  scale: types.number(1, { range: [0.6, 1.8], nudgeMultiplier: 0.01 }),
  glow: types.number(0.55, { range: [0, 1], nudgeMultiplier: 0.01 }),
  speed: types.number(0.38, { range: [0, 1.5], nudgeMultiplier: 0.01 }),
};

const CAMERA_DEFAULTS = {
  z: types.number(4.7, { range: [2.4, 8.2], nudgeMultiplier: 0.01 }),
  y: types.number(0.1, { range: [-2, 2], nudgeMultiplier: 0.01 }),
};

async function ensureTheatreStudio() {
  if (!isTheatreStudioEnabled() || typeof window === "undefined") return;
  if (window.__PORTFOLIO_THEATRE_STUDIO_INIT__) return;

  const studioMod = await import("@theatre/studio");
  const studio = studioMod.default;
  studio.initialize();
  window.__PORTFOLIO_THEATRE_STUDIO_INIT__ = true;
}

export function TheatreLabView() {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    sync();
    if (media.addEventListener) {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(() => {
    ensureTheatreStudio().catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const project = getProject(THEATRE_PROJECT_NAME, { state: {} });
    const sheet = project.sheet(THEATRE_SHEET_NAME);
    const orbObject = sheet.object("Orb", ORB_DEFAULTS);
    const cameraObject = sheet.object("Camera", CAMERA_DEFAULTS);

    let orbValues = {
      rotationY: 0,
      rotationX: 0,
      positionX: 0,
      scale: 1,
      glow: 0.55,
      speed: 0.38,
    };
    let cameraValues = { z: 4.7, y: 0.1 };

    const unsubscribeOrb = orbObject.onValuesChange((values) => {
      orbValues = values;
    });
    const unsubscribeCamera = cameraObject.onValuesChange((values) => {
      cameraValues = values;
    });

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#06080f");
    scene.fog = new THREE.Fog("#06080f", 9, 24);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.1, cameraValues.z);

    const ambient = new THREE.AmbientLight("#a3d6ff", 0.42);
    scene.add(ambient);

    const key = new THREE.DirectionalLight("#c5ebff", 1.25);
    key.position.set(2.8, 3.4, 4);
    scene.add(key);

    const fill = new THREE.PointLight("#66e8ff", 0.72, 20);
    fill.position.set(-3, 0.8, 3.6);
    scene.add(fill);

    const floorLight = new THREE.PointLight("#437aff", 0.28, 12);
    floorLight.position.set(0, -2.6, 1.8);
    scene.add(floorLight);

    const orbGeometry = new THREE.IcosahedronGeometry(1.12, 12);
    const orbMaterial = new THREE.MeshPhysicalMaterial({
      color: "#87dbf5",
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.86,
      thickness: 1.05,
      clearcoat: 1,
      clearcoatRoughness: 0.09,
      iridescence: 0.18,
      iridescenceIOR: 1.1,
      emissive: new THREE.Color("#5ec4c8"),
      emissiveIntensity: 0.22,
      envMapIntensity: 1.15,
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.castShadow = true;
    orb.position.set(0, 0.14, 0);
    scene.add(orb);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.82, 0.014, 20, 220),
      new THREE.MeshBasicMaterial({ color: "#7ce6f0", transparent: true, opacity: 0.33 })
    );
    ring.rotation.x = Math.PI / 2.8;
    scene.add(ring);

    const particlesCount = 300;
    const particles = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.6 + Math.random() * 3;
      particles[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particles[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particles[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particles, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: "#8adde0",
      size: 0.03,
      transparent: true,
      opacity: 0.44,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(points);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.9, 80),
      new THREE.MeshBasicMaterial({ color: "#0c1320", transparent: true, opacity: 0.6 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    scene.add(floor);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const clock = new THREE.Clock();
    let rafId;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      camera.position.z += (cameraValues.z - camera.position.z) * 0.08;
      camera.position.y += (cameraValues.y - camera.position.y) * 0.08;
      camera.lookAt(0, 0.04, 0);

      if (!reducedMotionRef.current) {
        const pulse = Math.sin(t * (0.45 + orbValues.speed * 0.55));
        orb.rotation.y += 0.003 + orbValues.speed * 0.008;
        orb.rotation.x = orbValues.rotationX + Math.sin(t * 0.55) * 0.08;
        orb.position.x = orbValues.positionX + Math.sin(t * 0.31) * 0.06;
        orb.scale.setScalar(Math.max(0.45, orbValues.scale + pulse * 0.02));
        orbMaterial.emissiveIntensity = 0.08 + orbValues.glow * 0.52;
        ring.rotation.z += 0.0018 + orbValues.speed * 0.006;
        points.rotation.y += 0.0007;
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      unsubscribeOrb();
      unsubscribeCamera();
      ro.disconnect();
      orbGeometry.dispose();
      orbMaterial.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      renderer.dispose();
    };
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
          Laboratory · Theatre.js
        </h1>
        <p style={{ color: "rgba(245,245,247,.72)", fontSize: 17, lineHeight: 1.55, marginBottom: 28 }}>
          Timeline visual de Theatre sobre escena 3D: listo para coreografiar cámara, malla y timing sin perder control de código.
        </p>

        <div
          style={{
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.12)",
            minHeight: "72vh",
            background: "#0b0f18",
            position: "relative",
          }}>
          <div ref={hostRef} style={{ position: "absolute", inset: 0 }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 14,
              bottom: 14,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.2)",
              background: "rgba(18,20,28,.66)",
              color: "rgba(245,245,247,.92)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".02em",
              pointerEvents: "none",
            }}>
            {isTheatreStudioEnabled() ? "Theatre Studio ON" : "Theatre Studio OFF · activa NEXT_PUBLIC_ENABLE_THEATRE_STUDIO"}
            {reducedMotion ? " · Reduced Motion ON" : ""}
          </div>
        </div>
      </div>
    </section>
  );
}
