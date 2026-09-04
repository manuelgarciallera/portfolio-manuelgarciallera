import { describe, expect, it } from 'vitest'

import { normalizeMediaPlacement } from './placement'

describe('normalizeMediaPlacement', () => {
  it('creates a deterministic non-destructive placement recipe with safe defaults', () => {
    expect(normalizeMediaPlacement({ asset: 7 })).toEqual({
      asset: 7,
      fit: 'cover',
      focalX: 0.5,
      focalY: 0.5,
      frame: 'auto',
      overrides: {},
      zoom: 1,
    })
  })

  it('preserves bounded desktop values and explicit mobile and tablet overrides', () => {
    expect(
      normalizeMediaPlacement({
        asset: 'media-7',
        fit: 'contain',
        focalX: 0.25,
        focalY: 0.75,
        frame: '9:16',
        overrides: {
          mobile: { focalX: 0.6, focalY: 0.4, frame: '9:16', zoom: 1.8 },
          tablet: { fit: 'cover', frame: '4:3' },
        },
        zoom: 2,
      }),
    ).toEqual({
      asset: 'media-7',
      fit: 'contain',
      focalX: 0.25,
      focalY: 0.75,
      frame: '9:16',
      overrides: {
        mobile: { focalX: 0.6, focalY: 0.4, frame: '9:16', zoom: 1.8 },
        tablet: { fit: 'cover', frame: '4:3' },
      },
      zoom: 2,
    })
  })

  it.each([
    { asset: 7, focalX: -0.1 },
    { asset: 7, focalY: 1.1 },
    { asset: 7, zoom: 0.99 },
    { asset: 7, zoom: 4.01 },
    { asset: 7, fit: 'stretch' },
    { asset: 7, frame: 'cinema' },
    { asset: 7, overrides: { desktop: { zoom: 2 } } },
    { asset: 7, overrides: { mobile: { script: 'alert(1)' } } },
  ])('rejects unsafe placement input instead of silently distorting media %#', (input) => {
    expect(() => normalizeMediaPlacement(input)).toThrow()
  })

  it('returns a detached value so preview edits cannot mutate saved input', () => {
    const input = { asset: 7, overrides: { mobile: { zoom: 1.5 } } }
    const result = normalizeMediaPlacement(input)
    result.overrides.mobile!.zoom = 2
    expect(input.overrides.mobile.zoom).toBe(1.5)
  })
})
