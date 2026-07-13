'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, MeshTransmissionMaterial } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Group, LinearFilter, MathUtils } from 'three'

const NAME_LINES = ['Manuel', 'García-Llera'] as const

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  onReady: () => void
}

/** Dibuja el nombre con la MISMA tipografía y métricas que el h1 del DOM. */
function createNameTexture(isDark: boolean): CanvasTexture {
  const scale = 2
  const w = Math.min(typeof window !== 'undefined' ? window.innerWidth : 1440, 1920)
  const h = typeof window !== 'undefined' ? window.innerHeight : 900
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(scale, scale)
    const gutter = Math.min(Math.max(20, 0.05 * w), 80)
    const fontSize = Math.min(Math.max(51.2, 0.125 * w), 200)
    const lineHeight = fontSize * 0.94
    const top = 0.3 * h
    ctx.fillStyle = isDark ? '#f2f1ea' : '#131512'
    ctx.textBaseline = 'top'
    ctx.font = `700 ${fontSize}px -apple-system, "SF Pro Display", "Segoe UI", system-ui, sans-serif`
    const ctxWithSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
    ctxWithSpacing.letterSpacing = `${-0.045 * fontSize}px`
    NAME_LINES.forEach((line, i) => ctx.fillText(line, gutter, top + i * lineHeight))
  }
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.anisotropy = 4
  return texture
}

function NamePlane({ isDark }: { isDark: boolean }) {
  const { viewport } = useThree()
  const texture = useMemo(() => createNameTexture(isDark), [isDark])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

function WaterOrb({ reduceMotion }: { reduceMotion: boolean }) {
  const groupRef = useRef<Group>(null)
  const { viewport } = useThree()
  const radius = viewport.height * 0.33
  const baseX = viewport.width * 0.14

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group || reduceMotion) return
    const t = state.clock.elapsedTime
    const smoothing = Math.min(1, delta * 2.6)
    group.position.x = MathUtils.lerp(group.position.x, baseX + state.pointer.x * viewport.width * 0.07, smoothing)
    group.position.y = MathUtils.lerp(group.position.y, state.pointer.y * viewport.height * 0.06, smoothing)
    group.rotation.y += delta * 0.14
    const breathe = 1 + Math.sin(t * 0.7) * 0.035
    group.scale.setScalar(breathe)
  })

  return (
    <group ref={groupRef} position={[baseX, 0, 1.6]}>
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <MeshTransmissionMaterial
          transmission={1}
          ior={1.3}
          thickness={2.2}
          roughness={0.02}
          chromaticAberration={0.05}
          anisotropicBlur={0.12}
          distortion={0.22}
          distortionScale={0.5}
          temporalDistortion={reduceMotion ? 0 : 0.12}
          backside
          backsideThickness={1}
          samples={6}
          resolution={384}
        />
      </mesh>
    </group>
  )
}

export function HeroOrbCanvas({ isDark, reduceMotion, onReady }: HeroOrbCanvasProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={onReady}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <NamePlane isDark={isDark} />
        <WaterOrb reduceMotion={reduceMotion} />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  )
}
