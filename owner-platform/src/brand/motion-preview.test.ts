import { describe, expect, it } from 'vitest'

import { buildBrandMotionPreview } from './motion-preview'

const field = (value: unknown) => ({ value })

describe('buildBrandMotionPreview', () => {
  it('projects bounded CSS-safe motion settings from Payload form state', () => {
    expect(buildBrandMotionPreview({
      'motion.duration': field(700),
      'motion.stagger': field(90),
      'motion.travel': field(32),
      'motion.easing': field('ease-out'),
      'motion.reducedMotion': field('reduce'),
    })).toEqual({ complete: true, duration: 700, easing: 'ease-out', reducedMotion: 'reduce', stagger: 90, travel: 32 })
  })

  it('falls back safely for incomplete or invalid draft settings', () => {
    expect(buildBrandMotionPreview({
      'motion.duration': field(10),
      'motion.easing': field('spring(1,2,3)'),
    })).toEqual({ complete: false, duration: 600, easing: 'ease-out', reducedMotion: 'reduce', stagger: 80, travel: 24 })
  })
})
