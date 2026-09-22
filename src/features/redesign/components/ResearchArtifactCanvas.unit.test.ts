import { describe, expect, it } from 'vitest'

import { createResearchSphere, createSatinTexture } from './researchArtifactMaterial'
import { advanceResearchTime, getResearchPose, getResearchNodePosition } from './researchArtifactMotion'

describe('round research sculpture', () => {
  it('keeps every surface vertex on the same radius, including the silhouette', () => {
    const geometry = createResearchSphere()
    const positions = geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      expect(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))).toBeCloseTo(1.2, 5)
    }
    expect(positions.count).toBeGreaterThan(2000)
    expect(positions.count).toBeLessThan(4000)
    geometry.dispose()
  })

  it('uses bounded surface detail with no visible longitude seam or pinched poles', () => {
    const texture = createSatinTexture()
    const { data, width, height } = texture.image
    const pixels = data as Uint8Array
    const samples = Array.from(pixels).filter((_, index) => index % 4 === 0)
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(10)
    expect(Math.min(...samples)).toBeGreaterThan(70)
    expect(Math.max(...samples)).toBeLessThan(190)
    for (let y = 0; y < height; y++) {
      expect(pixels[(y * width) * 4]).toBe(pixels[(y * width + width - 1) * 4])
    }
    for (const y of [0, height - 1]) {
      expect(new Set(samples.slice(y * width, (y + 1) * width)).size).toBe(1)
    }
    texture.dispose()
  })

  it('stores satin roughness separately from height so the bump map cannot polish the surface', () => {
    const texture = createSatinTexture()
    const pixels = texture.image.data as Uint8Array
    const roughness = Array.from(pixels).filter((_, index) => index % 4 === 1)
    expect(Math.min(...roughness) / 255).toBeGreaterThan(0.8)
    expect(Math.max(...roughness) / 255).toBeLessThan(0.95)
    expect(pixels[1] - pixels[0]).toBeGreaterThan(64)
    texture.dispose()
  })
})

describe('research orbit motion', () => {
  it('starts reduced motion at the composed static pose and keeps it there', () => {
    expect(getResearchPose(900, true)).toEqual(getResearchPose(0, false))
    expect(advanceResearchTime(0, 0.016, true, true)).toBe(0)
  })

  it('pauses offscreen and clamps the first frame after a long pause', () => {
    expect(advanceResearchTime(12, 600, false, false)).toBe(12)
    expect(advanceResearchTime(12, 600, false, true)).toBeCloseTo(12.05)
    expect(advanceResearchTime(12, 1 / 60, false, true)).toBeCloseTo(12 + 1 / 60)
  })

  it('keeps precession bounded and slow over a long visit', () => {
    for (let time = 0; time < 3600; time += 7) {
      const pose = getResearchPose(time, false)
      const next = getResearchPose(time + 1 / 60, false)
      expect(pose.ringTilt[0]).toBeGreaterThan(0.9)
      expect(pose.ringTilt[0]).toBeLessThan(1.25)
      expect(Math.abs(pose.ringTilt[1])).toBeLessThan(0.3)
      expect(pose.ringTilt[2]).toBeGreaterThan(-0.45)
      expect(pose.ringTilt[2]).toBeLessThan(-0.1)
      pose.ringTilt.forEach((value, axis) => expect(Math.abs(next.ringTilt[axis] - value)).toBeLessThan(0.001))
    }
  })

  it('moves lights on their actual ring plane without radial drift', () => {
    for (const phase of [0, 0.4, 1.6, 3.2, 6.28]) {
      const [x, y, z] = getResearchNodePosition(phase)
      expect(Math.hypot(x, y)).toBeCloseTo(1.7, 10)
      expect(z).toBe(0)
    }
    expect(getResearchNodePosition(0)).toEqual([1.7, 0, 0])
    expect(getResearchNodePosition(Math.PI / 2)[1]).toBeCloseTo(1.7)
  })
})
