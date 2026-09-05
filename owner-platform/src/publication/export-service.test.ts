import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createOwnerPublicationExport } from './export-service'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' } })
const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
const artifact = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })

const setup = () => {
  const create = vi.fn(async ({ data }) => ({ id: 101, ...data }))
  const findByID = vi.fn(async ({ collection }) => collection === 'publication-artifacts'
    ? { artifact, artifactHash: artifact.hash, bundle: 80, bundleHash: bundle.hash, id: 100, pageCount: 1, review: 90, reviewHash: artifact.reviewHash }
    : { bundle, bundleHash: bundle.hash, id: 80, pageCount: 1 })
  return { create, findByID, payload: { create, findByID } }
}

describe('createOwnerPublicationExport', () => {
  it('reverifies the immutable artifact and bundle, returns a bounded export, and audits the download', async () => {
    const { create, payload } = setup()
    const output = await createOwnerPublicationExport({ artifactId: 100, exportedAt: '2026-09-05T08:00:00.000Z', payload, req: { user: owner } })
    expect(output).toMatchObject({ artifactHash: artifact.hash, bundleHash: bundle.hash, pageCount: 1 })
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'publication.export.downloaded', subjectCollection: 'publication-artifacts', subjectId: '100' }) }))
    expect(JSON.stringify(output)).not.toMatch(/secret|token|password|credential/i)
  })

  it('rejects anonymous, tampered, or mismatched evidence before returning content', async () => {
    const first = setup()
    await expect(createOwnerPublicationExport({ artifactId: 100, payload: first.payload, req: {} })).rejects.toThrow(/owner/i)
    const second = setup()
    second.findByID.mockImplementation(async ({ collection }) => collection === 'publication-artifacts' ? { artifact: { ...artifact, pageCount: 2 }, artifactHash: artifact.hash, bundle: 80, bundleHash: bundle.hash, id: 100, pageCount: 1, review: 90, reviewHash: artifact.reviewHash } : { bundle, bundleHash: bundle.hash, id: 80, pageCount: 1 })
    await expect(createOwnerPublicationExport({ artifactId: 100, payload: second.payload, req: { user: owner } })).rejects.toThrow(/integridad|hash/i)
    expect(second.create).not.toHaveBeenCalled()
  })
})
