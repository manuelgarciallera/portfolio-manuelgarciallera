import { describe, expect, it } from 'vitest'

import { buildBrandPalettePreview } from './preview'

const field = (value: unknown) => ({ value, valid: true })

describe('buildBrandPalettePreview', () => {
  it('joins normalized colors and percentages from Payload form state', () => {
    expect(buildBrandPalettePreview({
      'colors.0.role': field('background'),
      'colors.0.value': field('#000'),
      'colors.1.role': field('accent'),
      'colors.1.value': field('#ff4b44'),
      'usageWeights.0.role': field('background'),
      'usageWeights.0.weight': field(70),
      'usageWeights.1.role': field('accent'),
      'usageWeights.1.weight': field(30),
    })).toEqual({ complete: true, segments: [
      { color: '#000000', role: 'background', weight: 70 },
      { color: '#FF4B44', role: 'accent', weight: 30 },
    ], total: 100 })
  })

  it('ignores malformed entries and reports an incomplete total without throwing', () => {
    expect(buildBrandPalettePreview({
      'colors.0.role': field('accent'),
      'colors.0.value': field('red'),
      'usageWeights.0.role': field('accent'),
      'usageWeights.0.weight': field(20),
      apiToken: field('must-not-pass'),
    })).toEqual({ complete: false, segments: [], total: 20 })
  })
})
