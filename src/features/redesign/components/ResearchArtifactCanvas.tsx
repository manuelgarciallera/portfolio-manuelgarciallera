'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Color, type Group, type Mesh, type MeshPhysicalMaterial } from 'three'

import { createResearchGradientTexture, createResearchPulseReset, createResearchSphere, createSatinTexture } from './researchArtifactMaterial'
import { advanceResearchPulse, getResearchAppearance } from './researchArtifactAppearance'
import { advanceResearchTime, getResearchNodePosition, getResearchPose } from './researchArtifactMotion'
import './research-artifact-controls.css'

interface ResearchNodeProps {
  position: [number, number, number]
  scale?: number
}

function ResearchNode({ position, scale = 1 }: ResearchNodeProps) {
  const [active, setActive] = useState(false)

  return (
    <mesh
      position={position}
      scale={scale}
      onPointerEnter={(event) => { event.stopPropagation(); setActive(true) }}
      onPointerLeave={() => setActive(false)}
      onPointerDown={(event) => { event.stopPropagation(); setActive((current) => !current) }}
    >
      <sphereGeometry args={[0.056, 16, 12]} />
      <meshStandardMaterial
        color="#8fff00"
        emissive="#8fff00"
        emissiveIntensity={active ? 3.2 : 1.4}
        roughness={0.24}
        metalness={0.32}
      />
    </mesh>
  )
}

function ResearchArtifact({ reduceMotion, visible, activation, pulseActive }: {
  reduceMotion: boolean
  visible: boolean
  activation: number
  pulseActive: boolean
}) {
  const sphereRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshPhysicalMaterial>(null)
  const orbitRef = useRef<Group>(null)
  const nodesRef = useRef<Group>(null)
  const time = useRef(0)
  const appearanceTime = useRef(0)
  const pulseAge = useRef(Infinity)
  const invalidate = useThree(state => state.invalidate)
  const geometry = useMemo(() => createResearchSphere(), [])
  const satin = useMemo(() => createSatinTexture(), [])
  const gradient = useMemo(() => createResearchGradientTexture(), [])
  const palette = useMemo(() => ({ graphite: new Color('#41434b'), grey: new Color('#858993') }), [])
  const initialPose = getResearchPose(0, true)

  const updateMaterial = useCallback((elapsed: number, age: number) => {
    if (!materialRef.current) return
    const appearance = getResearchAppearance(elapsed, age, reduceMotion)
    materialRef.current.color.lerpColors(palette.graphite, palette.grey, appearance.lighten)
    materialRef.current.emissiveIntensity = appearance.colour * 1.3
  }, [palette, reduceMotion])

  useEffect(() => {
    if (activation === 0) return
    appearanceTime.current = 0
    pulseAge.current = pulseActive ? 0 : Infinity
    updateMaterial(0, pulseAge.current)
    // Demand mode also receives the static reduced-motion colour and its reset.
    invalidate()
  }, [activation, pulseActive, updateMaterial, invalidate])

  useEffect(() => () => {
    geometry.dispose()
    satin.dispose()
    gradient.dispose()
  }, [geometry, satin, gradient])

  useFrame((_, delta) => {
    time.current = advanceResearchTime(time.current, delta, reduceMotion, visible)
    appearanceTime.current = pulseActive ? 0 : advanceResearchTime(appearanceTime.current, delta, reduceMotion, visible)
    pulseAge.current = pulseActive
      ? reduceMotion ? 0 : advanceResearchPulse(pulseAge.current, delta, visible)
      : Infinity
    updateMaterial(appearanceTime.current, pulseAge.current)
    const pose = getResearchPose(time.current, reduceMotion)
    if (sphereRef.current) sphereRef.current.rotation.y = pose.sphereTurn
    if (orbitRef.current) orbitRef.current.rotation.set(...pose.ringTilt)
    if (nodesRef.current) nodesRef.current.rotation.z = pose.orbitTurn
  })

  return (
    <group>
      <mesh ref={sphereRef} geometry={geometry}>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#41434b"
          emissive="#ffffff"
          emissiveMap={gradient}
          emissiveIntensity={0}
          roughness={0.78}
          roughnessMap={satin}
          bumpMap={satin}
          bumpScale={0.035}
          metalness={0.32}
          clearcoat={0.08}
          clearcoatRoughness={0.58}
        />
      </mesh>

      <group ref={orbitRef} rotation={initialPose.ringTilt}>
        <mesh>
          <torusGeometry args={[1.7, 0.019, 8, 128]} />
          <meshPhysicalMaterial
            color="#c7cbd5"
            emissive="#353448"
            emissiveIntensity={0.22}
            metalness={0.82}
            roughness={0.24}
            iridescence={0.28}
            iridescenceIOR={1.3}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.6, 0.008, 8, 128]} />
          <meshStandardMaterial color="#9c9ba9" metalness={0.72} roughness={0.32} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.83, 0.007, 8, 128]} />
          <meshStandardMaterial color="#777f93" metalness={0.7} roughness={0.32} />
        </mesh>
        <group ref={nodesRef}>
          {[0.24, 1.36, 2.32, 3.42, 4.5, 5.44].map((phase, index) => (
            <ResearchNode key={phase} position={getResearchNodePosition(phase)} scale={index % 2 ? 0.72 : 1} />
          ))}
        </group>
      </group>
    </group>
  )
}

export function ResearchArtifactCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)
  // Stay still until the preference and visibility have both been read.
  const [reduceMotion, setReduceMotion] = useState(true)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(false)
  const [activation, setActivation] = useState(0)
  const [pulseActive, setPulseActive] = useState(false)
  const pulseReset = useMemo(() => createResearchPulseReset(() => setPulseActive(false)), [])

  useEffect(() => () => pulseReset.cancel(), [pulseReset])

  const activateColour = () => {
    setActivation(current => current + 1)
    setPulseActive(true)
    pulseReset.restart()
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible')
    update()
    updateVisibility()
    media.addEventListener('change', update)
    document.addEventListener('visibilitychange', updateVisibility)
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    if (hostRef.current) observer.observe(hostRef.current)
    return () => {
      media.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', updateVisibility)
      observer.disconnect()
    }
  }, [])

  const visible = inView && pageVisible
  const animate = visible && !reduceMotion

  return (
    <div ref={hostRef} className="rd-research-scene" data-research-motion={animate ? 'running' : 'paused'} data-research-colour={pulseActive ? 'gradient' : 'neutral'}>
      <Canvas
        dpr={[1, 1.35]}
        frameloop={animate ? 'always' : 'demand'}
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <ambientLight intensity={0.7} />
        <hemisphereLight args={['#e1e7f4', '#343743', 1.6]} />
        <directionalLight position={[-3, 4, 5]} intensity={3.2} />
        <directionalLight position={[3, -1, 2]} color="#a4acd5" intensity={1.1} />
        <pointLight position={[-3, 1, 2]} color="#c1dc9e" intensity={1} distance={8} />
        <pointLight position={[2, -2, 3]} color="#8878ca" intensity={1.2} distance={7} />
        <ResearchArtifact reduceMotion={reduceMotion} visible={visible} activation={activation} pulseActive={pulseActive} />
      </Canvas>
      <button type="button" aria-label="Cambiar el color de Saturno" title="Cambiar color" className="rd-research-sphere-control" onClick={activateColour} />
    </div>
  )
}
