import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createPublicationExport, hashPublicationExport } from './export'

const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, layout: [{ blockType: 'hero', heading: 'Inicio' }], slug: 'inicio', title: 'Inicio' } })
const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
const artifact = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })

describe('publication export', () => {
  it('creates a deterministic immutable handoff containing only verified page state and provenance', () => {
    const output = createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
    expect(output).toMatchObject({ artifactHash: artifact.hash, bundleHash: bundle.hash, exportedAt: '2026-09-05T08:00:00.000Z', pageCount: 1, reviewHash: artifact.reviewHash, schemaVersion: 1 })
    expect(output.pages).toEqual([{ draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, sourceVersionId: 'current:now', state: capsule.state }])
    expect(output.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashPublicationExport(output)).toBe(output.hash)
    expect(Object.isFrozen(output.pages[0].state)).toBe(true)
  })

  it('rejects mismatched artifact provenance, page counts, and tampering', () => {
    expect(() => createPublicationExport({ artifact: { ...artifact, bundleHash: `sha256:${'c'.repeat(64)}` }, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })).toThrow(/artefacto|hash/i)
    expect(() => createPublicationExport({ artifact: { ...artifact, pageCount: 2 }, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })).toThrow(/hash|recuento|páginas/i)
    const output = createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
    expect(() => hashPublicationExport({ ...output, pageCount: 2 })).toThrow(/hash|recuento/i)
  })
})
