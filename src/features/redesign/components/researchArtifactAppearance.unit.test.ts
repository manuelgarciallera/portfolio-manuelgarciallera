import { describe, expect, it } from 'vitest'
import { getResearchAppearance, advanceResearchPulse } from './researchArtifactAppearance'
import * as appearance from './researchArtifactAppearance'

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
  it('uses actual visible pulse time rather than the rotation speed clamp', () => {
    expect(advanceResearchPulse(1, 20, false)).toBe(1)
    expect(advanceResearchPulse(1, 0.1, true)).toBeCloseTo(1.1)
    expect(advanceResearchPulse(Infinity, 0.016, true)).toBe(Infinity)
    expect(advanceResearchPulse(1, -2, true)).toBe(1)
  })

  it('keeps the same 24-second appearance phase at 60fps and 10fps', () => {
    expect(appearance.createResearchAppearanceClock).toBeTypeOf('function')
    for (const fps of [60, 10]) {
      const clock = appearance.createResearchAppearanceClock()
      expect(clock.tick(0, true)).toBe(0)
      let time = 0
      for (let frame = 1; frame <= fps * 24; frame++) {
        time += clock.tick(1 / fps, true)
        if (frame === fps * 12) {
          expect(time).toBeCloseTo(12)
          expect(getResearchAppearance(time, Infinity, false).lighten).toBeCloseTo(1)
        }
      }
      expect(time).toBeCloseTo(24)
      expect(getResearchAppearance(time, Infinity, false).lighten).toBeCloseTo(0)
    }
  })

  it('discards the first frame after a pause even when no hidden frame rendered', () => {
    expect(appearance.createResearchAppearanceClock).toBeTypeOf('function')
    const clock = appearance.createResearchAppearanceClock()
    expect(clock.tick(30, true)).toBe(0)
    expect(clock.tick(0.1, true)).toBeCloseTo(0.1)
    clock.pause()
    expect(clock.tick(600, true)).toBe(0)
    expect(clock.tick(0.1, true)).toBeCloseTo(0.1)
    expect(clock.tick(50, false)).toBe(0)
    expect(clock.tick(50, true)).toBe(0)
    expect(clock.tick(0.1, true)).toBeCloseTo(0.1)
  })

  it('accumulates nothing while invisible or motion is reduced', () => {
    expect(appearance.createResearchAppearanceClock).toBeTypeOf('function')
    const clock = appearance.createResearchAppearanceClock()
    for (let frame = 0; frame < 120; frame++) expect(clock.tick(1, false)).toBe(0)
    expect(clock.tick(120, true)).toBe(0)
    expect(clock.tick(1 / 60, true)).toBeCloseTo(1 / 60)
  })

  it('rejects non-finite and negative deltas without poisoning the active clock or pulse', () => {
    expect(appearance.createResearchAppearanceClock).toBeTypeOf('function')
    const clock = appearance.createResearchAppearanceClock()
    clock.tick(0, true)
    for (const delta of [NaN, Infinity, -Infinity, -1]) {
      expect(clock.tick(delta, true)).toBe(0)
      expect(advanceResearchPulse(1, delta, true)).toBe(1)
    }
    expect(clock.tick(0.1, true)).toBeCloseTo(0.1)
    expect(advanceResearchPulse(1, 0.1, true)).toBeCloseTo(1.1)
  })

  it('smoothly fades the pulse in six real seconds at either frame rate', () => {
    for (const fps of [60, 10]) {
      let age = 0
      for (let frame = 1; frame <= fps * 6; frame++) {
        age = advanceResearchPulse(age, 1 / fps, true)
        if (frame === fps * 3) expect(getResearchAppearance(0, age, false).colour).toBeCloseTo(0.5)
      }
      expect(age).toBeCloseTo(6)
      expect(getResearchAppearance(0, age, false).colour).toBeCloseTo(0)
    }
  })

  it('does not inject hidden time into the pulse on the first resumed frame', () => {
    expect(appearance.createResearchAppearanceClock).toBeTypeOf('function')
    const clock = appearance.createResearchAppearanceClock()
    clock.tick(0, true)
    let age = advanceResearchPulse(1, clock.tick(0.1, true), true)
    clock.pause()
    age = advanceResearchPulse(age, clock.tick(120, true), true)
    expect(age).toBeCloseTo(1.1)
    age = advanceResearchPulse(age, clock.tick(0.1, true), true)
    expect(age).toBeCloseTo(1.2)
  })

  it('keeps invalid appearance times neutral rather than generating invalid material colours', () => {
    for (const time of [NaN, Infinity, -Infinity, -1]) {
      expect(getResearchAppearance(time, Infinity, false).lighten).toBe(0)
    }
  })
})
