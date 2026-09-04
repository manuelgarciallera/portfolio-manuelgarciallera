import { describe, expect, it } from 'vitest'

import { createDraftCapsule, hashDraftCapsule } from './capsule'

const input = {
  source: { collection: 'pages' as const, documentId: '7', versionId: 'current:2026-09-04T23:00:00.000Z' },
  state: {
    brandOverrides: { accent: '#FF4B44', motion: { duration: 600 } },
    brandProfile: 3,
    layout: [{ blockType: 'hero', heading: 'Hola', image: 9 }],
    slug: 'inicio',
    title: 'Inicio',
  },
}

describe('draft recovery capsule', () => {
  it('creates a deterministic immutable capsule from whitelisted draft fields', () => {
    const first = createDraftCapsule(input)
    const second = createDraftCapsule({
      state: { title: 'Inicio', layout: input.state.layout, slug: 'inicio', brandProfile: 3, brandOverrides: input.state.brandOverrides },
      source: input.source,
    })
    expect(first.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(second.hash).toBe(first.hash)
    expect(hashDraftCapsule(first)).toBe(first.hash)
    expect(Object.isFrozen(first.state)).toBe(true)
  })

  it('excludes publication state and rejects unknown or credential-shaped data', () => {
    expect(() => createDraftCapsule({ ...input, state: { ...input.state, _status: 'published' } })).toThrow(/campo|permitido/i)
    expect(() => createDraftCapsule({ ...input, state: { ...input.state, apiToken: 'secret' } })).toThrow(/campo|permitido|clave/i)
    expect(() => createDraftCapsule({ ...input, state: { ...input.state, layout: [{ blockType: 'hero', onClick: 'run()' }] } })).toThrow(/clave|permitid/i)
  })

  it('rejects malformed relations, non-JSON values and tampering', () => {
    expect(() => createDraftCapsule({ ...input, state: { ...input.state, brandProfile: { id: 3 } } })).toThrow(/perfil|relación/i)
    expect(() => createDraftCapsule({ ...input, state: { ...input.state, layout: [() => undefined] } })).toThrow(/JSON/i)
    const capsule = createDraftCapsule(input)
    expect(() => hashDraftCapsule({ ...capsule, state: { ...capsule.state, title: 'Manipulado' } })).toThrow(/hash/i)
  })
})
