'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group, Mesh } from 'three'

import { createResearchSphere, createSatinTexture } from './researchArtifactMaterial'
import { advanceResearchTime, getResearchNodePosition, getResearchPose } from './researchArtifactMotion'

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

function ResearchArtifact({ reduceMotion, visible }: { reduceMotion: boolean; visible: boolean }) {
  const sphereRef = useRef<Mesh>(null)
  const orbitRef = useRef<Group>(null)
  const nodesRef = useRef<Group>(null)
  const time = useRef(0)
  const geometry = useMemo(() => createResearchSphere(), [])
  const satin = useMemo(() => createSatinTexture(), [])
  const initialPose = getResearchPose(0, true)

  useEffect(() => () => {
    geometry.dispose()
    satin.dispose()
  }, [geometry, satin])

  useFrame((_, delta) => {
    time.current = advanceResearchTime(time.current, delta, reduceMotion, visible)
    const pose = getResearchPose(time.current, reduceMotion)
    if (sphereRef.current) sphereRef.current.rotation.y = pose.sphereTurn
    if (orbitRef.current) orbitRef.current.rotation.set(...pose.ringTilt)
    if (nodesRef.current) nodesRef.current.rotation.z = pose.orbitTurn
  })

  return (
    <group>
      <mesh ref={sphereRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#41434b"
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
    <div ref={hostRef} style={{ width: '100%', height: '100%' }} data-research-motion={animate ? 'running' : 'paused'}>
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
        <ResearchArtifact reduceMotion={reduceMotion} visible={visible} />
      </Canvas>
    </div>
  )
}
