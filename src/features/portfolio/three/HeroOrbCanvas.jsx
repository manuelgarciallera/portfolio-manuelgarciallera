"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshDistortMaterial, MeshTransmissionMaterial, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { MathUtils } from "three";

const HERO_NAME = "Manuel Garcia-Llera";

function useReducedMotionPreference() {
  return useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

function LiquidMesh({ isDark, reduceMotion }) {
  const liquidRef = useRef(null);

  useFrame((state, delta) => {
    if (!liquidRef.current || reduceMotion) return;
    const targetX = state.pointer.x * 0.18;
    const targetY = state.pointer.y * 0.12;
    const smoothing = Math.min(1, delta * 2.4);
    liquidRef.current.rotation.y += delta * 0.16;
    liquidRef.current.rotation.x = MathUtils.lerp(liquidRef.current.rotation.x, -0.08 + targetY, smoothing);
    liquidRef.current.rotation.z = MathUtils.lerp(liquidRef.current.rotation.z, targetX, smoothing);
    liquidRef.current.position.x = MathUtils.lerp(liquidRef.current.position.x, state.pointer.x * 0.08, smoothing);
    liquidRef.current.position.y = MathUtils.lerp(liquidRef.current.position.y, state.pointer.y * 0.05, smoothing);
  });

  return (
    <group ref={liquidRef} position={[0, -0.02, 0.28]} scale={[1.38, 1.06, 0.72]}>
      <mesh>
        <sphereGeometry args={[1, 96, 64]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.48}
          chromaticAberration={0.01}
          distortion={0.09}
          distortionScale={0.16}
          temporalDistortion={reduceMotion ? 0 : 0.055}
          roughness={0.015}
          samples={5}
          resolution={160}
          thickness={1.28}
          transmission={1}
          anisotropicBlur={0.16}
          clearcoat={1}
          attenuationColor={isDark ? "#f7f7f3" : "#ffffff"}
          attenuationDistance={1.35}
        />
      </mesh>

      <mesh scale={[1.006, 1.004, 1.006]}>
        <sphereGeometry args={[1, 96, 64]} />
        <MeshDistortMaterial
          color="#f3f3ee"
          transparent
          opacity={0.62}
          roughness={0.18}
          metalness={0.02}
          distort={0.22}
          speed={reduceMotion ? 0 : 0.42}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={[1.026, 1.02, 1.026]}>
        <sphereGeometry args={[1, 96, 64]} />
        <MeshDistortMaterial
          color="#d8d8d1"
          transparent
          opacity={0.18}
          distort={0.24}
          speed={reduceMotion ? 0 : 0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function OrbScene({ isDark }) {
  const textRef = useRef(null);
  const reduceMotion = useReducedMotionPreference();

  useFrame((state, delta) => {
    if (!textRef.current || reduceMotion) return;
    const smoothing = Math.min(1, delta * 3.2);
    textRef.current.position.x = MathUtils.lerp(textRef.current.position.x, state.pointer.x * -0.045, smoothing);
    textRef.current.position.y = MathUtils.lerp(textRef.current.position.y, state.pointer.y * -0.025, smoothing);
  });

  const textColor = isDark ? "#f4f1ec" : "#171717";

  return (
    <>
      <color attach="background" args={[isDark ? "#050505" : "#fbfbf8"]} />
      <ambientLight intensity={isDark ? 0.95 : 1.55} />
      <directionalLight position={[3.2, 4.2, 4.5]} intensity={isDark ? 2.4 : 2.1} />
      <pointLight position={[-3, 1.6, 3]} color={isDark ? "#ffffff" : "#eef5ff"} intensity={isDark ? 7 : 4.2} distance={7} />
      <pointLight position={[3, -2, 2.4]} color={isDark ? "#d8e4ff" : "#ffffff"} intensity={isDark ? 3.8 : 2.4} distance={6} />

      <group ref={textRef} position={[0, -0.08, -0.98]}>
        <Text
          color={textColor}
          fontSize={0.76}
          lineHeight={1}
          letterSpacing={0}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          material-toneMapped={false}>
          <meshBasicMaterial color={textColor} toneMapped={false} />
          {HERO_NAME}
        </Text>
      </group>

      <LiquidMesh isDark={isDark} reduceMotion={reduceMotion} />

      <Environment preset="studio" />
    </>
  );
}

export function HeroOrbCanvas({ isDark }) {
  return (
    <Canvas
      aria-hidden="true"
      className="pf-hero-orb-canvas"
      camera={{ position: [0, 0, 4.8], fov: 39 }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      fallback={<div className="hero-orb-fallback" />}
      frameloop="always">
      <OrbScene isDark={isDark} />
    </Canvas>
  );
}
