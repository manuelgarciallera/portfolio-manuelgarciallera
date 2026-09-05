import { describe, expect, it } from 'vitest'

import { resolvePageBrand } from './inheritance'

const base = {
  colors: [
    { role: 'background', value: '#000000' },
    { role: 'surface', value: '#111111' },
    { role: 'text', value: '#FFFFFF' },
    { role: 'mutedText', value: '#AAAAAA' },
    { role: 'accent', value: '#FF4B44' },
    { role: 'interaction', value: '#00D4E6' },
    { role: 'success', value: '#21A366' },
    { role: 'danger', value: '#FF4B44' },
  ],
  usageWeights: [
    { role: 'background', weight: 70 },
    { role: 'surface', weight: 20 },
    { role: 'text', weight: 8 },
    { role: 'accent', weight: 2 },
  ],
  motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
} as const

describe('resolvePageBrand', () => {
  it('inherits when Payload hydrates unused optional fields and empty arrays', () => {
    expect(resolvePageBrand(base, {
      accent: undefined, surface: undefined, usageWeights: [],
      motion: { duration: undefined, stagger: null, travel: undefined, easing: undefined },
    })).toEqual(base)
  })
  it('returns a detached normalized brand when there are no overrides', () => {
    const resolved = resolvePageBrand(base, undefined)
    expect(resolved).toEqual(base)
    expect(resolved).not.toBe(base)
    expect(resolved.colors).not.toBe(base.colors)
    expect(resolved.motion).not.toBe(base.motion)
  })

  it('allows only accent, surface, usage and bounded motion overrides', () => {
    const resolved = resolvePageBrand(base, {
      accent: '#0df',
      surface: '#181818',
      usageWeights: [
        { role: 'background', weight: 65 },
        { role: 'surface', weight: 25 },
        { role: 'text', weight: 8 },
        { role: 'accent', weight: 2 },
      ],
      motion: { duration: 800, travel: 32 },
    })
    expect(resolved.colors.find(({ role }) => role === 'accent')?.value).toBe('#00DDFF')
    expect(resolved.colors.find(({ role }) => role === 'surface')?.value).toBe('#181818')
    expect(resolved.colors.find(({ role }) => role === 'background')?.value).toBe('#000000')
    expect(resolved.colors.find(({ role }) => role === 'text')?.value).toBe('#FFFFFF')
    expect(resolved.motion).toEqual({
      duration: 800,
      stagger: 80,
      travel: 32,
      easing: 'ease-out',
      reducedMotion: 'reduce',
    })
  })

  it('treats explicit null values as removal of an override and inherits the base value', () => {
    expect(
      resolvePageBrand(base, { accent: null, surface: null, usageWeights: null, motion: null }),
    ).toEqual(base)
  })

  it.each([
    [{ background: '#FFFFFF' }],
    [{ text: '#000000' }],
    [{ customCSS: 'body{}' }],
    [{ motion: { keyframes: 'spin' } }],
  ])('rejects disallowed or executable override keys safely %#', (overrides) => {
    expect(() => resolvePageBrand(base, overrides)).toThrow(/no está permitid/i)
  })

  it.each([
    [null, undefined],
    [{}, 'bad'],
    [{ ...base, colors: null }, {}],
    [{ ...base, motion: { duration: 1 } }, {}],
    [base, { usageWeights: [{ role: 'accent', weight: 50 }] }],
    [base, { surface: '#FFFFFF' }],
  ])('reports malformed, unbounded, or inaccessible input without leaking TypeErrors %#', (profile, overrides) => {
    expect(() => resolvePageBrand(profile, overrides)).toThrow(Error)
    expect(() => resolvePageBrand(profile, overrides)).not.toThrow(TypeError)
  })
})
