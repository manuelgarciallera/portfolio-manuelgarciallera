import { describe, expect, it } from 'vitest'
import { normalizeTypography, previewFontStack } from './typography'

describe('font names at the rendering boundary', () => {
  it.each([undefined, null, '', 'Arial; color:red', 'url(https://example.invalid)', '"Arial"', 42])('uses a safe system fallback for %s', (value) => {
    expect(previewFontStack(value)).toBe('system-ui, sans-serif')
  })
  it('distinguishes generic families from quoted local names', () => {
    expect(previewFontStack(' MONOSPACE ')).toBe('monospace')
    expect(previewFontStack('Noto Sans')).toBe('"Noto Sans", system-ui, sans-serif')
  })
  it.each([[], 'Arial', 42])('rejects a malformed typography group: %s', (value) => {
    expect(() => normalizeTypography(value)).toThrow(/tipografía/)
  })
})
