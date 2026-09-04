'use client'

import { MeshDistortMaterial, MeshTransmissionMaterial, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { Group, MathUtils } from 'three'

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  onReady?: () => void
}

function LiquidOrb({ isDark, reduceMotion }: Pick<HeroOrbCanvasProps, 'isDark' | 'reduceMotion'>) {
  const groupRef = useRef<Group>(null)

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group || reduceMotion) return

    const smoothing = Math.min(1, delta * 2.5)
    group.rotation.x = MathUtils.lerp(group.rotation.x, -0.08 + state.pointer.y * 0.12, smoothing)
    group.rotation.y += delta * 0.16
    group.rotation.z = MathUtils.lerp(group.rotation.z, state.pointer.x * 0.18, smoothing)
    group.position.x = MathUtils.lerp(group.position.x, state.pointer.x * 0.08, smoothing)
    group.position.y = MathUtils.lerp(group.position.y, state.pointer.y * 0.05, smoothing)
  })

  return (
    <group
      ref={groupRef}
      position={[0, -0.02, 0.28]}
      scale={[1, 1, 1]}
    >
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
          samples={3}
          resolution={192}
          thickness={1.28}
          transmission={1}
          anisotropicBlur={0.12}
          attenuationColor={isDark ? '#f7f7f3' : '#ffffff'}
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
  )
}

function SceneReady({ onReady }: Pick<HeroOrbCanvasProps, 'onReady'>) {
  const reported = useRef(false)

  useFrame(() => {
    if (reported.current) return
    reported.current = true
    onReady?.()
  })

  return null
}

export function HeroOrbCanvas({ isDark, reduceMotion, onReady }: HeroOrbCanvasProps) {
  return (
    <Canvas
      className="rd-hero-canvas"
      dpr={[1, 1.2]}
      camera={{ position: [0, 0, 5], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isDark ? '#0d0e0c' : '#fafaf6']} />
        <ambientLight intensity={isDark ? 0.9 : 1.5} />
        <directionalLight position={[3, 4, 4]} intensity={isDark ? 2.2 : 1.8} />
        <pointLight position={[-3, 1.5, 3]} color="#9fe6ff" intensity={isDark ? 5 : 3.4} distance={7} />
        <pointLight position={[3, -2, 2.5]} color="#ff6dcf" intensity={isDark ? 3.2 : 2} distance={6} />
        <Text position={[0, -0.04, -0.82]} color={isDark ? '#f4f1ec' : '#171717'} fontSize={0.46} anchorX="center" anchorY="middle" textAlign="center">
          Manuel García-Llera
        </Text>
        <LiquidOrb isDark={isDark} reduceMotion={reduceMotion} />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
