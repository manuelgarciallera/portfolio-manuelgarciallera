import { describe, expect, it } from 'vitest'
import { getResearchAppearance, advanceResearchPulse } from './researchArtifactAppearance'

describe('Saturn colour response', () => {
  it('breathes slowly back to its original graphite without changing geometry', () => {
    expect(getResearchAppearance(0, Infinity, false).lighten).toBe(0)
    expect(getResearchAppearance(12, Infinity, false).lighten).toBeCloseTo(1)
    expect(getResearchAppearance(24, Infinity, false).lighten).toBeCloseTo(0)
  })
  it('restores a neutral surface after the touch gradient fades', () => {
    expect(getResearchAppearance(0, 0, false).colour).toBe(1)
    expect(getResearchAppearance(0, 2, false).colour).toBeGreaterThan(0)
    expect(getResearchAppearance(0, 6, false).colour).toBe(0)
    expect(getResearchAppearance(0, Infinity, false).colour).toBe(0)
  })
  it('keeps the automatic surface still with reduced motion', () => {
    expect(getResearchAppearance(12, Infinity, true).lighten).toBe(0)
    expect(getResearchAppearance(12, 0, true).colour).toBe(1)
    expect(getResearchAppearance(12, Infinity, true).colour).toBe(0)
  })
  it('does not accumulate hidden time or jump on tab return', () => {
    expect(advanceResearchPulse(1, 20, false)).toBe(1)
    expect(advanceResearchPulse(1, 20, true)).toBeCloseTo(1.05)
    expect(advanceResearchPulse(Infinity, 0.016, true)).toBe(Infinity)
    expect(advanceResearchPulse(1, -2, true)).toBe(1)
  })
})
