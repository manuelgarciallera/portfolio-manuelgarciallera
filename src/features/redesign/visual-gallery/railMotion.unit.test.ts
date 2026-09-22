import { describe, expect, it } from 'vitest'
import { railVelocity, stepRail } from './railMotion'

const ready = {
  enabled: true, reducedMotion: false, visible: true, focused: false,
  paused: false, manual: false, pointer: null, position: 300, maximum: 1000,
}

describe('project rail motion', () => {
  it('drifts the images left slowly and accelerates only toward the hovered edge', () => {
    expect(railVelocity(ready)).toBe(14)
    expect(railVelocity({ ...ready, pointer: 0.5 })).toBe(0)
    expect(railVelocity({ ...ready, pointer: 0 })).toBe(-110)
    expect(railVelocity({ ...ready, pointer: 1 })).toBe(110)
    expect(railVelocity({ ...ready, pointer: 0.08 })).toBe(-55)
  })

  it.each(['reducedMotion', 'focused', 'paused', 'manual'] as const)('stops for %s without a competing animation', flag => {
    expect(railVelocity({ ...ready, [flag]: true, pointer: 1 })).toBe(0)
  })

  it('stops outside the viewport and on touch-only layouts', () => {
    expect(railVelocity({ ...ready, visible: false })).toBe(0)
    expect(railVelocity({ ...ready, enabled: false })).toBe(0)
  })

  it('never jumps to the beginning or scrolls beyond either end', () => {
    expect(railVelocity({ ...ready, position: 1000 })).toBe(0)
    expect(railVelocity({ ...ready, position: 0, pointer: 0 })).toBe(0)
    expect(railVelocity({ ...ready, position: 1000, pointer: 0 })).toBe(-110)
    expect(stepRail(999, 110, 0.05, 1000)).toBe(1000)
    expect(stepRail(1, -110, 0.05, 1000)).toBe(0)
  })

  it('caps a resumed animation frame so backgrounding cannot cause a large jump', () => {
    expect(stepRail(300, 14, 0.05, 1000)).toBeCloseTo(300.7)
    expect(stepRail(300, 14, 12, 1000)).toBeCloseTo(300.7)
    expect(stepRail(0, 14, 0.05, 0)).toBe(0)
  })
})
