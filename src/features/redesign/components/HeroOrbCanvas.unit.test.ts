import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('HeroOrbCanvas recovered artifact', () => {
  it('recovers the stable refractive sphere without loading an HDR environment', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')

    expect(source).not.toContain('Environment')
    expect(source).toContain('<sphereGeometry args={[1, 96, 64]} />')
    expect(source).toContain('dpr={[1, 1.2]}')
    expect(source).toContain("isDark ? '#0d0e0c' : '#fafaf6'")
    expect(source).toContain('distort={0.22}')
    expect(source).toContain('speed={reduceMotion ? 0 : 0.42}')
    expect(source).toContain('scale={[1, 1, 1]}')
    expect(source).toContain('opacity={0.18}')
    expect(source).toContain('distort={0.24}')
    expect(source).not.toContain('scale={[1.58, 0.82, 0.68]}')
  })

  it('reports readiness only after the scene has rendered a frame', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')
    expect(source).toContain('function SceneReady')
    expect(source).toContain('useFrame(() =>')
    expect(source).toContain('<SceneReady onReady={onReady} />')
    expect(source).not.toContain('onCreated={onReady}')
  })
})
