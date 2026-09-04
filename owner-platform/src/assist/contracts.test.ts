import { describe, expect, it } from 'vitest'
import { decideStudioPatch, validateStudioPatch, type AssistCapabilitySwitches, type StudioPatchContext } from './contracts'

const enabled: AssistCapabilitySwitches = { suggestCopy: true, suggestPalette: true, suggestLayout: true, suggestCrop: true, suggestMotion: true }
const context: StudioPatchContext = {
  page: { title: 'Inicio', layout: [{ blockType: 'hero', heading: 'Hola' }, { blockType: 'media', caption: 'Portada' }, { blockType: 'richText', content: {} }] },
  brand: { colors: [{ role: 'background', value: '#000000' }, { role: 'accent', value: '#FF0000' }], usageWeights: [{ role: 'background', weight: 80 }, { role: 'accent', weight: 20 }], motion: { duration: 600, stagger: 100, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' } },
}
const proposal = (capability: keyof AssistCapabilitySwitches, operations: unknown[]) => ({ schemaVersion: 1, capability, operations })

describe('StudioPatch validation against current Payload fields', () => {
  it('accepts detached immutable replacements for existing safe fields', () => {
    const input = proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'Nuevo' }, { op: 'replace', path: '/page/layout/0/heading', value: 'Hero' }])
    const result = validateStudioPatch(input, enabled, context)
    ;(input.operations[0] as { path: string }).path = '/page/_status'
    expect(result.operations[0].path).toBe('/page/title')
    expect(Object.isFrozen(result.operations[0])).toBe(true)
  })

  it.each(['/page/_status', '/page/publishedAt', '/auth/roles', '/brand/secret', '/page/~1status', '/page/layout/256/heading', '/page/layout/2/heading', '/page/layout/0/caption', '/page/blocks/0/body', '/page/layout/0/mediaUrl'])('rejects unknown, privileged, escaped, excessive, or nonexistent path %s', (path) => {
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path, value: 'x' }]), enabled, context)).toThrow()
  })

  it('keeps layout and crop capabilities unavailable even if switches are on', () => {
    for (const capability of ['suggestLayout', 'suggestCrop'] as const) expect(() => validateStudioPatch(proposal(capability, [{ op: 'replace', path: '/page/layout/0/heading', value: 'x' }]), enabled, context)).toThrow(/no dispone/i)
  })

  it('requires an explicit enabled capability switch', () => {
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'x' }]), { ...enabled, suggestCopy: false }, context)).toThrow(/desactivada/i)
  })

  it.each(['copy', 'move', 'test'])('rejects JSON Patch operation %s', (op) => {
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op, path: '/page/title', value: 'x' }]), enabled, context)).toThrow(/operación/i)
  })

  it('permits remove only for optional existing copy and without value', () => {
    expect(validateStudioPatch(proposal('suggestCopy', [{ op: 'remove', path: '/page/layout/1/caption' }]), enabled, context).operations).toHaveLength(1)
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'remove', path: '/page/layout/1/caption', value: 'x' }]), enabled, context)).toThrow(/valor/i)
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'remove', path: '/page/title' }]), enabled, context)).toThrow(/obligatorio/i)
  })

  it('uses current indexed brand fields and validates their values', () => {
    expect(validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/colors/1/value', value: '#00FF00' }]), enabled, context).operations).toHaveLength(1)
    expect(() => validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/colors/3/value', value: '#00FF00' }]), enabled, context)).toThrow(/existe/i)
    expect(() => validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/colors/1/value', value: 'red' }]), enabled, context)).toThrow(/hexadecimal/i)
  })

  it('requires an atomic complete weight proposal totaling exactly 100', () => {
    expect(validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/usageWeights/0/weight', value: 70 }, { op: 'replace', path: '/brand/usageWeights/1/weight', value: 30 }]), enabled, context).operations).toHaveLength(2)
    expect(() => validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/usageWeights/0/weight', value: 70 }]), enabled, context)).toThrow(/completa/i)
    expect(() => validateStudioPatch(proposal('suggestPalette', [{ op: 'replace', path: '/brand/usageWeights/0/weight', value: 90 }, { op: 'replace', path: '/brand/usageWeights/1/weight', value: 20 }]), enabled, context)).toThrow(/100/i)
  })

  it('matches current motion names and bounds', () => {
    expect(validateStudioPatch(proposal('suggestMotion', [{ op: 'replace', path: '/brand/motion/duration', value: 900 }]), enabled, context).operations).toHaveLength(1)
    expect(() => validateStudioPatch(proposal('suggestMotion', [{ op: 'replace', path: '/brand/motion/duration', value: 149 }]), enabled, context)).toThrow(/límites/i)
  })

  it('rejects getters, non-plain or inherited envelopes, and extra members', () => {
    const getter = Object.defineProperty({ schemaVersion: 1, capability: 'suggestCopy' }, 'operations', { enumerable: true, get: () => [{ op: 'replace', path: '/page/title', value: 'x' }] })
    expect(() => validateStudioPatch(getter, enabled, context)).toThrow(/datos planos/i)
    expect(() => validateStudioPatch(Object.create({ schemaVersion: 1, capability: 'suggestCopy', operations: [] }), enabled, context)).toThrow(/objeto plano|propias/i)
    expect(() => validateStudioPatch(new (class Patch { schemaVersion = 1; capability = 'suggestCopy'; operations: unknown[] = [] })(), enabled, context)).toThrow(/objeto plano/i)
    expect(() => validateStudioPatch({ ...proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'x' }]), token: 'x' }, enabled, context)).toThrow(/propiedad/i)
  })

  it('rejects prototype- or getter-backed Page/Brand context projections', () => {
    const inherited = { ...context, page: Object.create({ title: 'Inicio', layout: [] }) }
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'x' }]), enabled, inherited)).toThrow(/contexto|página/i)
    const page = Object.defineProperty({ title: 'Inicio' }, 'layout', { enumerable: true, get: () => [] })
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'x' }]), enabled, { ...context, page } as StudioPatchContext)).toThrow(/datos planos/i)
  })

  it('rejects getter, custom iterator, and custom prototype operation arrays', () => {
    const getterOps: unknown[] = []
    Object.defineProperty(getterOps, '0', { enumerable: true, get: () => ({ op: 'replace', path: '/page/title', value: 'x' }) })
    expect(() => validateStudioPatch(proposal('suggestCopy', getterOps), enabled, context)).toThrow(/datos planos/i)
    const iteratorOps = [{ op: 'replace', path: '/page/title', value: 'x' }]
    Object.defineProperty(iteratorOps, Symbol.iterator, { value: function* () { yield* [] } })
    expect(() => validateStudioPatch(proposal('suggestCopy', iteratorOps), enabled, context)).toThrow(/símbolos/i)
    const prototypeOps = [{ op: 'replace', path: '/page/title', value: 'x' }]
    Object.setPrototypeOf(prototypeOps, {})
    expect(() => validateStudioPatch(proposal('suggestCopy', prototypeOps), enabled, context)).toThrow(/prototipo/i)
  })

  it('rejects malicious arrays nested inside operation values before traversal', () => {
    const cases: unknown[][] = []
    const getter: unknown[] = []
    Object.defineProperty(getter, '0', { enumerable: true, get: () => 'x' })
    cases.push(getter)
    const iterator: unknown[] = []
    Object.defineProperty(iterator, Symbol.iterator, { value: function* () { yield 'x' } })
    cases.push(iterator)
    const prototype: unknown[] = []
    Object.setPrototypeOf(prototype, {})
    cases.push(prototype)
    const symbol: unknown[] = []
    Object.defineProperty(symbol, Symbol('hidden'), { value: 'x' })
    cases.push(symbol)
    for (const value of cases) expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value }]), enabled, context)).toThrow(/datos planos|símbolos|prototipo/i)
  })

  it('rejects executable, prototype, secret, and bounded-size abuse', () => {
    for (const value of [{ script: 'x' }, { accessToken: 'x' }, { constructor: 'x' }]) expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value }]), enabled, context)).toThrow()
    expect(() => validateStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'x'.repeat(4001) }]), enabled, context)).toThrow(/texto/i)
    expect(() => validateStudioPatch(proposal('suggestCopy', Array.from({ length: 33 }, () => ({ op: 'replace', path: '/page/title', value: 'x' }))), enabled, context)).toThrow(/operaciones/i)
  })

  it('returns explicit decisions without applying changes', () => {
    expect(decideStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'Nuevo' }]), enabled, context)).toMatchObject({ allowed: true, capability: 'suggestCopy' })
    expect(decideStudioPatch(proposal('suggestCopy', [{ op: 'replace', path: '/page/title', value: 'Nuevo' }]), { ...enabled, suggestCopy: false }, context)).toMatchObject({ allowed: false })
    expect(context.page.title).toBe('Inicio')
  })
})
