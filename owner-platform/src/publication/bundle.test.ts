import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationBundle, hashPublicationBundle } from './bundle'

const capsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:2026-09-04T23:00:00.000Z' },
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})
const input = {
  entries: [{
    capsule,
    draftHash: capsule.hash,
    pageId: '7',
    position: 0,
    previewHash: `sha256:${'a'.repeat(64)}`,
    releaseId: 44,
    sourceVersionId: capsule.source.versionId,
  }],
}

describe('publication bundle', () => {
  it('creates deterministic immutable publication evidence preserving explicit order', () => {
    const first = createPublicationBundle(input)
    const second = createPublicationBundle(input)
    expect(first.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(second.hash).toBe(first.hash)
    expect(hashPublicationBundle(first)).toBe(first.hash)
    expect(Object.isFrozen(first.entries[0].capsule.state)).toBe(true)
  })

  it('rejects duplicate pages, non-contiguous positions and mismatched capsule provenance', () => {
    expect(() => createPublicationBundle({ entries: [input.entries[0], { ...input.entries[0], position: 1, releaseId: 45 }] })).toThrow(/duplic|página/i)
    expect(() => createPublicationBundle({ entries: [{ ...input.entries[0], position: 2 }] })).toThrow(/posición|orden/i)
    expect(() => createPublicationBundle({ entries: [{ ...input.entries[0], pageId: '8' }] })).toThrow(/página|procedencia/i)
  })

  it('rejects unknown executable fields and later tampering', () => {
    expect(() => createPublicationBundle({ entries: input.entries, deploy: true })).toThrow(/campo|permitido/i)
    const bundle = createPublicationBundle(input)
    expect(() => hashPublicationBundle({ ...bundle, entries: [{ ...bundle.entries[0], previewHash: `sha256:${'b'.repeat(64)}` }] })).toThrow(/hash/i)
  })
})
