'use client'

import { MeshDistortMaterial } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import type { Group, Mesh } from 'three'

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
      <sphereGeometry args={[0.11, 20, 16]} />
      <meshStandardMaterial
        color="#8fff00"
        emissive="#8fff00"
        emissiveIntensity={active ? 4.6 : 1.65}
        roughness={0.24}
        metalness={0.32}
      />
    </mesh>
  )
}

function ResearchArtifact({ reduceMotion }: { reduceMotion: boolean }) {
  const stoneRef = useRef<Mesh>(null)
  const orbitRef = useRef<Group>(null)

  useFrame((state, delta) => {
    if (reduceMotion) return
    if (stoneRef.current) {
      stoneRef.current.rotation.y += delta * 0.08
      stoneRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08
    }
    const group = orbitRef.current
    if (group) group.rotation.z += delta * 0.16
  })

  return (
    <group rotation={[0.18, -0.28, -0.12]}>
      <mesh ref={stoneRef} scale={[1, 1.18, 0.92]}>
        <icosahedronGeometry args={[1.22, 2]} />
        <MeshDistortMaterial
          color="#181b22"
          roughness={0.34}
          metalness={0.62}
          distort={0.16}
          speed={reduceMotion ? 0 : 0.42}
        />
      </mesh>

      <group ref={orbitRef} rotation={[1.18, 0.1, 0.18]} position={[0, 0, 0.08]}>
        <mesh>
          <torusGeometry args={[1.72, 0.035, 12, 96]} />
          <MeshDistortMaterial
            color="#777b84"
            emissive="#343942"
            emissiveIntensity={0.6}
            metalness={0.76}
            roughness={0.2}
            distort={0.3}
            speed={reduceMotion ? 0 : 0.36}
          />
        </mesh>
        <ResearchNode position={[1.72, 0, 0]} />
        <ResearchNode position={[0.86, 1.49, 0]} scale={0.86} />
        <ResearchNode position={[-0.86, 1.49, 0]} scale={1.05} />
        <ResearchNode position={[-1.72, 0, 0]} scale={0.92} />
        <ResearchNode position={[-0.86, -1.49, 0]} scale={0.78} />
        <ResearchNode position={[0.86, -1.49, 0]} scale={0.96} />
      </group>
    </group>
  )
}

export function ResearchArtifactCanvas() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <Canvas
      dpr={[1, 1.35]}
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-3, 1, 3]} color="#8fff00" intensity={4.5} distance={8} />
      <pointLight position={[2, -2, 3]} color="#6976ff" intensity={3.2} distance={7} />
      <ResearchArtifact reduceMotion={reduceMotion} />
    </Canvas>
  )
}
