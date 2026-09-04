import { describe, expect, it } from 'vitest'

import {
  STUDIO_PATCH_LIMITS,
  decideStudioPatch,
  validateStudioPatch,
  type AssistCapabilitySwitches,
  type StudioPatch,
} from './contracts'

const enabled: AssistCapabilitySwitches = {
  suggestCopy: true,
  suggestPalette: true,
  suggestLayout: true,
  suggestCrop: true,
  suggestMotion: true,
}

const patch = (overrides: Partial<StudioPatch> = {}): StudioPatch => ({
  schemaVersion: 1,
  capability: 'suggestCopy',
  operations: [{ op: 'replace', path: '/page/title', value: 'Un título mejor' }],
  ...overrides,
})

describe('StudioPatch validation', () => {
  it('accepts an allowlisted operation for an enabled capability', () => {
    expect(validateStudioPatch(patch(), enabled)).toEqual(patch())
  })

  it('rejects a patch when its capability switch is disabled', () => {
    expect(() => validateStudioPatch(patch(), { ...enabled, suggestCopy: false })).toThrow(/desactivada/i)
  })

  it.each([
    '/page/status',
    '/page/_status',
    '/page/publishedAt',
    '/auth/roles',
    '/brand/secret',
    '/page/blocks/0/onClick',
    '/page/__proto__/polluted',
    '/page/constructor/prototype',
  ])('rejects forbidden or unknown path %s', (path) => {
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path, value: 'x' }] }), enabled)).toThrow()
  })

  it.each(['javascript:alert(1)', 'data:text/html,boom', 'file:///etc/passwd', 'https://user:pass@example.com/x'])('rejects unsafe URL value %s', (value) => {
    expect(() => validateStudioPatch(patch({ capability: 'suggestCrop', operations: [{ op: 'replace', path: '/page/blocks/0/mediaUrl', value }] }), enabled)).toThrow(/URL/i)
  })

  it('accepts only HTTPS URLs without credentials', () => {
    const safe = patch({ capability: 'suggestCrop', operations: [{ op: 'replace', path: '/page/blocks/0/mediaUrl', value: 'https://cdn.example.com/image.webp' }] })
    expect(validateStudioPatch(safe, enabled)).toEqual(safe)
  })

  it.each(['/page/~1status', '/page/blocks/0/~0prototype', '/page/blocks/0/body~1status'])('rejects JSON Pointer escaping in %s', (path) => {
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path, value: 'x' }] }), enabled)).toThrow(/ruta/i)
  })

  it('rejects block indexes outside the bounded editor range', () => {
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path: '/page/blocks/256/body', value: 'x' }] }), enabled)).toThrow(/índice/i)
  })

  it('rejects unrecognized envelope and operation members', () => {
    expect(() => validateStudioPatch({ ...patch(), providerToken: 'secret' }, enabled)).toThrow(/propiedad/i)
    expect(() => validateStudioPatch({ ...patch(), operations: [{ op: 'replace', path: '/page/title', value: 'x', from: '/page/status' }] }, enabled)).toThrow(/propiedad/i)
  })

  it('rejects an operation incompatible with the declared capability', () => {
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path: '/brand/colors/accent', value: '#ff00aa' }] }), enabled)).toThrow(/capacidad/i)
  })

  it('validates palette, motion, and crop values against editor bounds', () => {
    expect(() => validateStudioPatch(patch({ capability: 'suggestPalette', operations: [{ op: 'replace', path: '/brand/colors/accent', value: 'red' }] }), enabled)).toThrow(/hexadecimal/i)
    expect(() => validateStudioPatch(patch({ capability: 'suggestPalette', operations: [{ op: 'replace', path: '/brand/usageWeights/accent', value: 101 }] }), enabled)).toThrow(/porcentaje/i)
    expect(() => validateStudioPatch(patch({ capability: 'suggestMotion', operations: [{ op: 'replace', path: '/brand/motion/duration', value: 149 }] }), enabled)).toThrow(/movimiento/i)
    expect(() => validateStudioPatch(patch({ capability: 'suggestCrop', operations: [{ op: 'replace', path: '/page/blocks/0/crop/zoom', value: 0 }] }), enabled)).toThrow(/recorte/i)
  })

  it('rejects unsupported JSON Patch operations', () => {
    expect(() => validateStudioPatch({ ...patch(), operations: [{ op: 'copy' as 'replace', path: '/page/title', value: 'x' }] }, enabled)).toThrow(/operación/i)
  })

  it('rejects too many operations', () => {
    const operations = Array.from({ length: STUDIO_PATCH_LIMITS.maxOperations + 1 }, () => ({ op: 'replace' as const, path: '/page/title' as const, value: 'x' }))
    expect(() => validateStudioPatch(patch({ operations }), enabled)).toThrow(/operaciones/i)
  })

  it('rejects excessive depth, strings, and serialized bytes', () => {
    let deep: unknown = 'x'
    for (let index = 0; index <= STUDIO_PATCH_LIMITS.maxValueDepth; index += 1) deep = { value: deep }
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path: '/page/title', value: deep }] }), enabled)).toThrow(/profundidad/i)
    expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path: '/page/title', value: 'x'.repeat(STUDIO_PATCH_LIMITS.maxStringLength + 1) }] }), enabled)).toThrow(/texto/i)
    const operations = Array.from({ length: STUDIO_PATCH_LIMITS.maxOperations }, () => ({ op: 'replace' as const, path: '/page/title' as const, value: 'x'.repeat(STUDIO_PATCH_LIMITS.maxStringLength) }))
    expect(() => validateStudioPatch(patch({ operations }), enabled)).toThrow(/bytes/i)
  })

  it('rejects nested executable, prototype, and secret keys', () => {
    for (const value of [{ nested: { script: 'alert(1)' } }, { nested: { __proto__: null, prototype: 'x' } }, { nested: { apiKey: 'secret' } }, { nested: { accessToken: 'secret' } }, { nested: { clientSecret: 'secret' } }]) {
      expect(() => validateStudioPatch(patch({ operations: [{ op: 'replace', path: '/page/title', value }] }), enabled)).toThrow()
    }
  })

  it('returns an explicit decision without applying the proposal', () => {
    expect(decideStudioPatch(patch(), enabled)).toEqual({ allowed: true, capability: 'suggestCopy', patch: patch() })
    expect(decideStudioPatch(patch(), { ...enabled, suggestCopy: false })).toMatchObject({ allowed: false, capability: 'suggestCopy' })
  })

  it('returns an immutable copy so the validated patch cannot be changed afterwards', () => {
    const input = { schemaVersion: 1, capability: 'suggestCopy', operations: [{ op: 'replace', path: '/page/title', value: 'Seguro' }] }
    const validated = validateStudioPatch(input, enabled)
    input.operations[0].path = '/page/status'
    expect(validated.operations[0].path).toBe('/page/title')
    expect(Object.isFrozen(validated)).toBe(true)
    expect(Object.isFrozen(validated.operations[0])).toBe(true)
  })
})
