'use client'

import { MeshDistortMaterial, MeshTransmissionMaterial, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { Group, MathUtils } from 'three'

// El nombre vive dentro de la escena, detras del orbe. Su tamano estaba fijado en
// unidades de mundo, asi que en un lienzo estrecho (movil) el rotulo era mas ancho
// que el plano visible y se cortaba por los dos lados: se leia «Man ... llera».
// Aqui se mide el plano a la profundidad del texto y se deja que troika reparta
// el nombre en dos lineas cuando no cabe en una.
//
// La composicion cambia con la forma del lienzo, y no por capricho. En apaisado el
// orbe se posa sobre el centro del nombre: ese es el efecto, y el criterio de
// aceptacion lo describe como «al mover el raton, el orbe pasa por encima del
// nombre y las letras se deforman a traves de el». En un lienzo vertical no hay
// raton que lo mueva, el orbe ocupa una fraccion mucho mayor del ancho y lo unico
// que consigue es tapar el nombre. Alli el orbe sube y el rotulo baja: la curva
// inferior roza la parte alta de la primera linea —queda refraccion— pero el
// nombre se lee entero.
const WORDMARK_Z = -0.82
const WORDMARK_MAX_SIZE = 0.46
// Posiciones en unidades de mundo para la composicion compacta, con el plano
// visible en ~4.0 de alto: el orbe ocupa la mitad superior y el rotulo la inferior.
//
// El corte NO puede salir de la relacion de aspecto del lienzo. En escritorio
// `.rd-hero-art` declara `aspect-ratio: 1.15`, y en movil el lienzo mide unos
// 438x352, o sea 1.24: el movil es mas apaisado que el escritorio. Quien decide es
// la anchura del viewport, la misma que decide la maquetacion en CSS.
const COMPACT_ORB_Y = 0.42
const COMPACT_ORB_SCALE = 0.75
const COMPACT_WORDMARK_Y = -0.62

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  // El hero apilado de movil: el orbe deja de posarse sobre el nombre.
  isCompact: boolean
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

// El plano visible a la profundidad del rotulo. `getCurrentViewport` devuelve el
// ancho y alto en unidades de mundo para esa distancia de camara, que es lo que
// hace falta para decidir el cuerpo tipografico y el ancho de reparto.
function useWordmarkPlane() {
  const viewport = useThree((state) => state.viewport)
  const camera = useThree((state) => state.camera)
  return useMemo(
    () => viewport.getCurrentViewport(camera, [0, 0, WORDMARK_Z]),
    [viewport, camera],
  )
}

function HeroWordmark({ isDark, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'isCompact'>) {
  const plane = useWordmarkPlane()
  // 0.9 del ancho deja un margen visible a izquierda y derecha; el divisor es el
  // avance aproximado de «Garcia-Llera», la palabra mas larga, que nunca se parte.
  const maxWidth = plane.width * 0.9
  const fontSize = Math.min(WORDMARK_MAX_SIZE, maxWidth / 6.9)

  return (
    <Text
      position={[0, isCompact ? COMPACT_WORDMARK_Y : -0.04, WORDMARK_Z]}
      color={isDark ? '#f4f1ec' : '#171717'}
      fontSize={fontSize}
      maxWidth={maxWidth}
      lineHeight={1.05}
      anchorX="center"
      anchorY="middle"
      textAlign="center"
    >
      Manuel García-Llera
    </Text>
  )
}

// En el hero apilado el orbe sube y encoge para dejar de competir con el rotulo.
function ResponsiveOrb({ isDark, reduceMotion, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'reduceMotion' | 'isCompact'>) {
  return (
    <group scale={isCompact ? COMPACT_ORB_SCALE : 1} position={[0, isCompact ? COMPACT_ORB_Y : 0, 0]}>
      <LiquidOrb isDark={isDark} reduceMotion={reduceMotion} />
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
        <color attach="background" args={[isDark ? '#0d0e0c' : '#fafaf6']} />
        <ambientLight intensity={isDark ? 0.9 : 1.5} />
        <directionalLight position={[3, 4, 4]} intensity={isDark ? 2.2 : 1.8} />
        <pointLight position={[-3, 1.5, 3]} color="#9fe6ff" intensity={isDark ? 5 : 3.4} distance={7} />
        <pointLight position={[3, -2, 2.5]} color="#ff6dcf" intensity={isDark ? 3.2 : 2} distance={6} />
        <HeroWordmark isDark={isDark} isCompact={isCompact} />
        <ResponsiveOrb isDark={isDark} reduceMotion={reduceMotion} isCompact={isCompact} />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
