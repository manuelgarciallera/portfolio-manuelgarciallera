'use client'

import { MeshDistortMaterial, MeshTransmissionMaterial, Text } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, FrontSide, Group, MathUtils } from 'three'

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

// El corte entre las dos composiciones NO puede salir de la relacion de aspecto del
// lienzo. En escritorio `.rd-hero-art` declara `aspect-ratio: 1.15`; en movil el
// lienzo mide 320x352, 390x352 o 430x352 segun el telefono, o sea entre 0.91 y 1.22.
// A 430 el movil es casi tan apaisado como el escritorio y esa medida los confundia.
// Quien decide es la anchura del viewport, la misma que decide la maquetacion en CSS.

// Geometria de la composicion apilada, en unidades de mundo sobre un plano visible
// de ~4.0 de alto. Se exporta porque la unica forma seria de guardarla es hacer la
// aritmetica, no buscar cadenas: lo que importa no es que los numeros sean estos,
// sino que el borde inferior del orbe quede por encima de la primera linea del
// rotulo. La version anterior fallaba justo ahi: el orbe bajaba hasta -0.46 y la
// primera linea empezaba en -0.28, asi que la esfera se comia «uel Garci».
//
// Y no basta con «rozar». La idea de que el roce produce refraccion vale en
// escritorio, donde el orbe cruza el nombre y se ve el liquido deformar las letras.
// Sobre fondo negro y sin raton que lo mueva, el solapamiento no refracta: tapa.
export const COMPACT_GEOMETRY = {
  orbY: 0.5,
  orbScale: 0.72,
  // Desplazamiento del grupo interior del orbe, que la escala del padre multiplica.
  orbGroupOffsetY: -0.02,
  // El canto Fresnel se dibuja a 1.015 del radio: es el borde real que se ve.
  orbRimScale: 1.015,
  wordmarkY: -0.92,
  // Mas bajo que en apaisado. «Garcia-Llera» a 0.46 mide 3.17 de ancho y el plano
  // a 320px solo da 3.28 utiles: el margen era del 3% y cualquier ajuste de fuente
  // lo rompia partiendo la palabra. A 0.44 el margen sube al 7%.
  wordmarkMaxSize: 0.44,
  wordmarkLineHeight: 1.05,
  // El nombre no cabe en una linea en ningun telefono: a 430px, el mas ancho, haria
  // falta 5.06 de plano y solo hay 4.41. Antes lo partia troika por el guion y
  // quedaba «Manuel Garcia-» / «Llera», que es el peor corte posible de este nombre.
  // Se parte a proposito por el espacio.
  wordmarkLines: 2,
} as const

const COMPACT_WORDMARK_TEXT = 'Manuel\nGarcía-Llera'
const WIDE_WORDMARK_TEXT = 'Manuel García-Llera'

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  // El hero apilado de movil: el orbe deja de posarse sobre el nombre.
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
          transmission={1}
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

// Avance tipografico medido sobre el render real de produccion a 1440, no estimado:
// lienzo 571x497, plano 4.605 x 4.008, y de ahi el ancho en pixeles de cada linea.
//
//   «Manuel Garcia-»       6.91 em
//   «Llera»                2.56 em
//   «Manuel Garcia-Llera»  9.47 em
//
// El divisor tiene que ser el avance de la linea mas larga de CADA composicion, y
// esas son distintas. En apaisado la linea es el nombre entero. En vertical el
// nombre se parte a proposito por el espacio y la linea mas larga es «Garcia-Llera»,
// de avance parecido a «Manuel Garcia-».
//
// El 6.9 que habia servia para las dos y solo era correcto para una. En apaisado
// dejaba el rotulo un 5.1% mas ancho que el plano util, troika lo partia, y lo
// partia por el guion: «Manuel Garcia-» / «Llera». El peor corte posible de este
// nombre, en la primera pantalla del sitio.
const WIDE_WORDMARK_ADVANCE = 9.8
const COMPACT_WORDMARK_ADVANCE = 6.9

function HeroWordmark({ isDark, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'isCompact'>) {
  const plane = useWordmarkPlane()
  // 0.9 del ancho deja un margen visible a izquierda y derecha.
  const maxWidth = plane.width * 0.9
  const cap = isCompact ? COMPACT_GEOMETRY.wordmarkMaxSize : WORDMARK_MAX_SIZE
  const advance = isCompact ? COMPACT_WORDMARK_ADVANCE : WIDE_WORDMARK_ADVANCE
  // El tope solo entra cuando el plano da de sobra: si maxWidth/9.8 supera 0.46 es
  // que maxWidth > 4.51, y el nombre entero a 0.46 ocupa 4.36. Cabe.
  const fontSize = Math.min(cap, maxWidth / advance)

  return (
    <Text
      position={[0, isCompact ? COMPACT_GEOMETRY.wordmarkY : -0.04, WORDMARK_Z]}
      color={isDark ? '#f4f1ec' : '#171717'}
      fontSize={fontSize}
      maxWidth={maxWidth}
      lineHeight={COMPACT_GEOMETRY.wordmarkLineHeight}
      anchorX="center"
      anchorY="middle"
      textAlign="center"
    >
      {isCompact ? COMPACT_WORDMARK_TEXT : WIDE_WORDMARK_TEXT}
    </Text>
  )
}

// En el hero apilado el orbe sube y encoge para dejar de competir con el rotulo.
function ResponsiveOrb({ isDark, reduceMotion, isCompact }: Pick<HeroOrbCanvasProps, 'isDark' | 'reduceMotion' | 'isCompact'>) {
  return (
    <group
      scale={isCompact ? COMPACT_GEOMETRY.orbScale : 1}
      position={[0, isCompact ? COMPACT_GEOMETRY.orbY : 0, 0]}
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
