import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('ResearchArtifactCanvas', () => {
  it('uses a simple mutable stone, a foreground Saturn ring and orbiting neon nodes', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ResearchArtifactCanvas.tsx'), 'utf8')

    expect(source).toContain('<icosahedronGeometry args={[1.22, 2]} />')
    expect(source).toContain('<torusGeometry args={[1.72, 0.035, 12, 96]} />')
    expect(source.match(/<ResearchNode /g)).toHaveLength(6)
    expect(source).toContain('color="#8fff00"')
    expect(source).toContain('emissive="#8fff00"')
    expect(source).toContain('<sphereGeometry args={[0.11, 20, 16]} />')
    expect(source).not.toContain("'#8a8f99'")
    expect(source).toContain('group.rotation.z += delta * 0.16')
    expect(source).toContain('distort={0.16}')
    expect(source).toContain('distort={0.3}')
    expect(source).toContain('speed={reduceMotion ? 0 : 0.36}')
    expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(source).toContain('if (reduceMotion) return')
  })
})
