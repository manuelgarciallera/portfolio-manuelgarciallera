import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createPublicationExport, hashPublicationExport, verifyPublicationExport } from './export'

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

  it('rejects self-described exports before hashing when their envelope is not canonical', () => {
    const output = createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
    expect(() => verifyPublicationExport({ ...output, publish: true })).toThrow(/campo no permitido/i)
    expect(() => verifyPublicationExport({ ...output, schemaVersion: 2 })).toThrow(/versión de esquema/i)
    expect(() => verifyPublicationExport({ ...output, exportedAt: 'yesterday' })).toThrow(/fecha de exportación/i)
  })

  it('reconstructs every draft capsule and rejects invalid page order, identity, or state', () => {
    const output = createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
    const page = output.pages[0]
    expect(verifyPublicationExport(output)).toBe(output)
    expect(() => verifyPublicationExport({ ...output, pages: [{ ...page, position: 1 }] })).toThrow(/posición/i)
    expect(() => verifyPublicationExport({ ...output, pages: [{ ...page, pageId: '' }] })).toThrow(/página/i)
    expect(() => verifyPublicationExport({ ...output, pages: [{ ...page, state: { ...page.state, slug: '' } }] })).toThrow(/slug/i)
    expect(() => verifyPublicationExport({ ...output, pages: [{ ...page, state: { ...page.state, layout: [{ blockType: 'hero', script: 'alert(1)' }] } }] })).toThrow(/clave|permitida/i)
  })

  it('rejects duplicate page and slug identities before accepting a handoff', () => {
    const secondCapsule = createDraftCapsule({ source: { collection: 'pages', documentId: '8', versionId: 'current:two' }, state: { brandProfile: 3, layout: [{ blockType: 'hero', heading: 'Otra' }], slug: 'otra', title: 'Otra' } })
    const secondBundle = createPublicationBundle({ entries: [bundle.entries[0], { capsule: secondCapsule, draftHash: secondCapsule.hash, pageId: '8', position: 1, previewHash: `sha256:${'c'.repeat(64)}`, releaseId: 45, sourceVersionId: 'current:two' }] })
    const secondArtifact = createPublicationArtifact({ bundleHash: secondBundle.hash, bundleId: 81, pageCount: 2, reviewHash: `sha256:${'d'.repeat(64)}`, reviewId: 91 })
    const output = createPublicationExport({ artifact: secondArtifact, bundle: secondBundle, exportedAt: '2026-09-05T08:00:00.000Z' })
    const duplicateSlugCapsule = createDraftCapsule({ source: { collection: 'pages', documentId: '8', versionId: 'current:two' }, state: { ...output.pages[1].state, slug: 'inicio' } })
    expect(() => verifyPublicationExport({ ...output, pages: [output.pages[0], { ...output.pages[1], pageId: '7' }] })).toThrow(/página duplicada/i)
    expect(() => verifyPublicationExport({ ...output, pages: [output.pages[0], { ...output.pages[1], draftHash: duplicateSlugCapsule.hash, state: duplicateSlugCapsule.state }] })).toThrow(/slug duplicado/i)
  })
})
