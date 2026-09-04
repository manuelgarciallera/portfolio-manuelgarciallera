import { describe, expect, it } from 'vitest'

import {
  contrastRatio,
  normalizeHex,
  validateBrandProfile,
  validateMotion,
  validateSemanticColors,
  validateUsageWeights,
} from './validation'

describe('brand validation', () => {
  it('normalizes supported hex colors to uppercase six-digit values', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('00d4e6')).toBe('#00D4E6')
    expect(() => normalizeHex('#abcd')).toThrow(/hexadecimal/i)
  })

  it('rejects duplicate semantic and usage roles', () => {
    expect(
      validateSemanticColors([
        { role: 'background', value: '#000000' },
        { role: 'background', value: '#111111' },
      ]),
    ).toContain('El rol semántico "background" está repetido.')
    expect(
      validateUsageWeights([
        { role: 'background', weight: 50 },
        { role: 'background', weight: 50 },
      ]),
    ).toContain('El peso del rol "background" está repetido.')
  })

  it('requires usage weights to total exactly 100', () => {
    expect(
      validateUsageWeights([
        { role: 'background', weight: 70 },
        { role: 'accent', weight: 29 },
      ]),
    ).toContain('Los porcentajes de uso deben sumar exactamente 100 (actual: 99).')
  })

  it('calculates WCAG contrast and enforces the required pairs', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.478, 2)

    const errors = validateBrandProfile({
      colors: [
        { role: 'background', value: '#FFFFFF' },
        { role: 'surface', value: '#FFFFFF' },
        { role: 'text', value: '#777777' },
        { role: 'mutedText', value: '#AAAAAA' },
        { role: 'accent', value: '#000000' },
        { role: 'interaction', value: '#000000' },
        { role: 'success', value: '#008000' },
        { role: 'danger', value: '#B00020' },
      ],
      usageWeights: [{ role: 'background', weight: 100 }],
      motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/text.*background.*4\.5/i),
        expect.stringMatching(/text.*surface.*4\.5/i),
        expect.stringMatching(/mutedText.*background.*3/i),
      ]),
    )
  })

  it('bounds motion values and permits only deterministic presets', () => {
    expect(
      validateMotion({
        duration: 149,
        stagger: 501,
        travel: 81,
        easing: 'spring(1,2,3)',
        reducedMotion: 'ignore',
      }),
    ).toHaveLength(5)
    expect(
      validateMotion({
        duration: 150,
        stagger: 0,
        travel: 0,
        easing: 'ease-out',
        reducedMotion: 'reduce',
      }),
    ).toEqual([])
  })

  it('reports malformed colors without aborting the complete validation pass', () => {
    expect(
      validateBrandProfile({
        colors: [
          { role: 'background', value: 'not-a-color' },
          { role: 'surface', value: '#111111' },
          { role: 'text', value: '#FFFFFF' },
          { role: 'mutedText', value: '#AAAAAA' },
          { role: 'accent', value: '#FF4B44' },
          { role: 'interaction', value: '#00D4E6' },
          { role: 'success', value: '#21A366' },
          { role: 'danger', value: '#FF4B44' },
        ],
        usageWeights: [{ role: 'background', weight: 100 }],
        motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
      }),
    ).toContain('El color "not-a-color" no es un hexadecimal RGB válido.')
  })
})
