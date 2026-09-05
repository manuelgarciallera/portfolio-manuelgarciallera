import { describe, expect, it } from 'vitest'

import { buildBrandContrastPreview } from './contrast-preview'

const field = (value: unknown) => ({ value })

describe('buildBrandContrastPreview', () => {
  it('calculates the required WCAG pairs from Payload form state', () => {
    expect(buildBrandContrastPreview({
      'colors.0.role': field('background'), 'colors.0.value': field('#000000'),
      'colors.1.role': field('surface'), 'colors.1.value': field('#111111'),
      'colors.2.role': field('text'), 'colors.2.value': field('#FFFFFF'),
      'colors.3.role': field('mutedText'), 'colors.3.value': field('#AAAAAA'),
    })).toEqual([
      { complete: true, foreground: 'text', background: 'background', minimum: 4.5, passes: true, ratio: 21 },
      { complete: true, foreground: 'text', background: 'surface', minimum: 4.5, passes: true, ratio: 18.88 },
      { complete: true, foreground: 'mutedText', background: 'background', minimum: 3, passes: true, ratio: 9.04 },
    ])
  })

  it('returns incomplete rows for missing or malformed draft colors', () => {
    expect(buildBrandContrastPreview({
      'colors.0.role': field('background'), 'colors.0.value': field('black'),
    })).toEqual([
      { complete: false, foreground: 'text', background: 'background', minimum: 4.5 },
      { complete: false, foreground: 'text', background: 'surface', minimum: 4.5 },
      { complete: false, foreground: 'mutedText', background: 'background', minimum: 3 },
    ])
  })
})
