'use client'

import { MeshDistortMaterial, MeshTransmissionMaterial } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, FrontSide, Group, MathUtils } from 'three'

// Composición única: esfera clara arriba y nombre completo debajo en todos los
// dispositivos. El apellido compuesto nunca se divide: los saltos son explícitos.
const COMPACT_GEOMETRY = { orbY: 0.5, orbScale: 0.72 } as const

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  // Solo adapta el presupuesto de render; la composición es compartida.
  isCompact: boolean
  onReady?: () => void
}

const RIM_VERTEX = `
varying vec3 vNormalW;
varying vec3 vViewW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewW = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const RIM_FRAGMENT = `
uniform vec3 uColor;
uniform float uPower;
uniform float uIntensity;
varying vec3 vNormalW;
varying vec3 vViewW;
void main() {
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewW)), 0.0, 1.0), uPower);
  gl_FragColor = vec4(uColor * fresnel * uIntensity, fresnel * uIntensity);
}`

function LiquidOrb({ isDark, reduceMotion, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'reduceMotion' | 'isCompact'>) {
  const groupRef = useRef<Group>(null)
  // Preserve the glass refraction without painting an opaque canvas rectangle.
  const transmissionBackground = useMemo(() => new Color(isDark ? '#0d0e0c' : '#fafaf6'), [isDark])
  const rimUniforms = useMemo(
    () => ({
      uColor: { value: new Color(isDark ? '#eaf4ff' : '#334155') },
      uPower: { value: isDark ? 3 : 4 },
      uIntensity: { value: isDark ? 0.8 : 0.22 },
    }),
    [isDark],
  )

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
          background={transmissionBackground}
          backside
          backsideThickness={0.48}
          chromaticAberration={0.035}
          distortion={0.28}
          distortionScale={0.42}
          temporalDistortion={reduceMotion ? 0 : 0.055}
          roughness={0.015}
          samples={isCompact ? 4 : 6}
          resolution={isCompact ? 256 : 384}
          thickness={0.55}
          ior={1.28}
          transmission={0.72}
          color="#f4f1ec"
          emissive="#e8e4df"
          emissiveIntensity={0.25}
          anisotropicBlur={0.12}
          attenuationColor="#ffffff"
          attenuationDistance={8}
        />
      </mesh>
      {/* Corrientes internas: la misma malla de antes, pero a 0.05 de opacidad ya
          no vela el nombre; solo insinua movimiento dentro del liquido. */}
      <mesh scale={[1.006, 1.004, 1.006]}>
        <sphereGeometry args={[1, 96, 64]} />
        <MeshDistortMaterial
          color="#f3f3ee"
          transparent
          opacity={0.05}
          roughness={0.18}
          metalness={0.02}
          distort={0.22}
          speed={reduceMotion ? 0 : 0.42}
          depthWrite={false}
        />
      </mesh>
      {/* El borde. Un vidrio limpio sobre fondo negro es un agujero negro: lo que
          hace que se perciba una gota es el Fresnel del canto, no el relleno. En
          claro el canto tiene que oscurecer, no iluminar, o el fondo se lo come. */}
      <mesh scale={[1.015, 1.015, 1.015]}>
        <sphereGeometry args={[1, 96, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={FrontSide}
          uniforms={rimUniforms}
          vertexShader={RIM_VERTEX}
          fragmentShader={RIM_FRAGMENT}
        />
      </mesh>
    </group>
  )
}

// En el hero apilado el orbe sube y encoge para dejar de competir con el rotulo.
function ResponsiveOrb({ isDark, reduceMotion, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'reduceMotion' | 'isCompact'>) {
  return (
    <group
      scale={COMPACT_GEOMETRY.orbScale}
      position={[0, COMPACT_GEOMETRY.orbY, 0]}
    >
      <LiquidOrb isDark={isDark} reduceMotion={reduceMotion} isCompact={isCompact} />
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

export function HeroOrbCanvas({ isDark, reduceMotion, isCompact, onReady }: HeroOrbCanvasProps) {
  return (
    <Canvas
      className="rd-hero-canvas"
      dpr={[1, 1.2]}
      camera={{ position: [0, 0, 5], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <ambientLight intensity={isDark ? 0.9 : 1.5} />
        <directionalLight position={[3, 4, 4]} intensity={isDark ? 2.2 : 1.8} />
        <pointLight position={[-3, 1.5, 3]} color="#9fe6ff" intensity={isDark ? 5 : 3.4} distance={7} />
        <pointLight position={[3, -2, 2.5]} color="#ff6dcf" intensity={isDark ? 3.2 : 2} distance={6} />
        <ResponsiveOrb isDark={isDark} reduceMotion={reduceMotion} isCompact={isCompact} />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
