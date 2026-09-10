import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'

vi.mock('server-only', () => ({}))
vi.mock('payload', async (importOriginal) => ({
  ...await importOriginal<typeof import('payload')>(),
  initTransaction: vi.fn(async () => true),
  commitTransaction: vi.fn(async () => {}),
  killTransaction: vi.fn(async () => {}),
}))
import { commitTransaction, initTransaction, killTransaction } from 'payload'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createPublicationExport } from './export'
import { hashPublicationPreflight } from './preflight'
import { createOwnerPublicationPreflight } from './preflight-service'

const owner = { collection: 'users', id: 1, role: 'owner' }
const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, layout: [{ blockType: 'hero', heading: 'Inicio' }], seo: { description: 'Descripción', title: 'Inicio' }, slug: 'inicio', title: 'Inicio' } })
const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
const artifact = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })

const setup = () => {
  const find = vi.fn(async (): Promise<{ docs: Record<string, unknown>[]; totalDocs: number }> => ({ docs: [], totalDocs: 0 }))
  const findByID = vi.fn(async ({ collection }) => collection === 'publication-artifacts'
    ? { artifact, artifactHash: artifact.hash, bundle: 80, bundleHash: bundle.hash, id: 100, pageCount: 1 }
    : { bundle, bundleHash: bundle.hash, id: 80, pageCount: 1 })
  const create = vi.fn(async ({ collection, data }) => collection === 'publication-preflights' ? { id: 110, ...data } : { id: 111, ...data })
  return { create, find, findByID, payload: { create, find, findByID } as never }
}

describe('owner publication preflight service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fails closed without writing or closing a transaction it does not own', async () => {
    const { create, payload } = setup()
    vi.mocked(initTransaction).mockResolvedValueOnce(false)
    await expect(createOwnerPublicationPreflight({ artifactId: 100, payload, req: { user: owner } })).rejects.toThrow(/transacción exclusiva/)
    expect(create).not.toHaveBeenCalled()
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(killTransaction).not.toHaveBeenCalled()
  })

  it('rolls back an audit failure without claiming success', async () => {
    const { create, payload } = setup()
    create.mockImplementation(async ({ collection, data }) => {
      if (collection === 'audit-events') throw new Error('Audit unavailable')
      return { id: 110, ...data }
    })
    await expect(createOwnerPublicationPreflight({ artifactId: 100, payload, req: { user: owner } })).rejects.toThrow('Audit unavailable')
    expect(killTransaction).toHaveBeenCalledTimes(1)
    expect(commitTransaction).not.toHaveBeenCalled()
  })
  it('revalidates the approved artifact, persists one immutable report, and audits it', async () => {
    const { create, find, findByID, payload } = setup()
    const result = await createOwnerPublicationPreflight({ artifactId: 100, checkedAt: '2026-09-05T08:10:00.000Z', payload, req: { user: owner } })
    expect(result).toMatchObject({ id: 110, status: 'ready', issueCount: 0 })
    expect(commitTransaction).toHaveBeenCalledTimes(1)
    expect(killTransaction).not.toHaveBeenCalled()
    expect(findByID).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-preflights', where: { artifact: { equals: 100 } } }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-preflights', data: expect.objectContaining({ artifact: 100, artifactHash: artifact.hash, createdBy: 1, status: 'ready' }), overrideAccess: true }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'audit-events', data: expect.objectContaining({ action: 'publication.preflight.created', subjectCollection: 'publication-preflights', subjectId: '110' }) }))
  })

  it('returns an existing immutable report without recreating or re-auditing it', async () => {
    const { create, find, payload } = setup()
    const existing = await createOwnerPublicationPreflight({ artifactId: 100, checkedAt: '2026-09-05T08:10:00.000Z', payload, req: { user: owner } })
    find.mockResolvedValue({ docs: [existing], totalDocs: 1 })
    create.mockClear()
    await expect(createOwnerPublicationPreflight({ artifactId: 100, payload, req: { user: owner } })).resolves.toEqual(existing)
    expect(create).not.toHaveBeenCalled()
  })

  it('replaces a stale ready result with a new blocked report without changing the old record', async () => {
    const { create, find, findByID, payload } = setup()
    const badCapsule = createDraftCapsule({ source: capsule.source, state: { ...capsule.state, slug: 'a/b' } })
    const badBundle = createPublicationBundle({ entries: [{ ...bundle.entries[0], capsule: badCapsule, draftHash: badCapsule.hash }] })
    const badArtifact = createPublicationArtifact({ bundleHash: badBundle.hash, bundleId: 80, pageCount: 1, reviewHash: artifact.reviewHash, reviewId: 90 })
    findByID.mockImplementation(async ({ collection }) => collection === 'publication-artifacts'
      ? { artifact: badArtifact, artifactHash: badArtifact.hash, bundle: 80, bundleHash: badBundle.hash, id: 100, pageCount: 1 }
      : { bundle: badBundle, bundleHash: badBundle.hash, id: 80, pageCount: 1 })
    const checkedAt = '2026-09-05T08:10:00.000Z'
    const exported = createPublicationExport({ artifact: badArtifact, bundle: badBundle, exportedAt: checkedAt })
    // Historical rule set checked blocks/SEO but not URL segments. Independent
    // construction keeps this fixture valid even when today's validator changes.
    const historicalData = { artifactHash: badArtifact.hash, checkedAt, exportHash: exported.hash,
      issueCount: 0, issues: [], pageCount: 1, schemaVersion: 1 as const, status: 'ready' as const }
    const historicalHash = `sha256:${createHash('sha256').update(JSON.stringify(historicalData, Object.keys(historicalData).sort())).digest('hex')}`
    const report = Object.freeze({ ...historicalData, hash: historicalHash })
    expect(hashPublicationPreflight(report)).toBe(historicalHash)
    const legacy = Object.freeze({ id: 109, artifact: 100, artifactHash: badArtifact.hash, checkedAt, createdBy: 1,
      exportHash: exported.hash, status: 'ready', issueCount: 0, pageCount: 1, schemaVersion: 1, preflightHash: historicalHash, report })
    const before = JSON.stringify(legacy)
    find.mockResolvedValue({ docs: [legacy], totalDocs: 1 })
    const result = await createOwnerPublicationPreflight({ artifactId: 100, checkedAt: '2026-09-10T18:00:00.000Z', payload, req: { user: owner } })
    expect(result).toMatchObject({ id: 110, status: 'blocked', issueCount: 1, report: { issues: [expect.objectContaining({ code: 'invalid_slug' })] } })
    expect(legacy.status).toBe('ready')
    expect(JSON.stringify(legacy)).toBe(before)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'publication-preflights' }))
  })

  it('fails closed before persistence for anonymous or tampered provenance', async () => {
    const first = setup()
    await expect(createOwnerPublicationPreflight({ artifactId: 100, payload: first.payload, req: {} })).rejects.toThrow(/owner/i)
    const second = setup()
    second.findByID.mockImplementation(async ({ collection }) => collection === 'publication-artifacts' ? { artifact: { ...artifact, pageCount: 2 }, artifactHash: artifact.hash, bundle: 80, bundleHash: bundle.hash, id: 100, pageCount: 1 } : { bundle, bundleHash: bundle.hash, id: 80, pageCount: 1 })
    await expect(createOwnerPublicationPreflight({ artifactId: 100, payload: second.payload, req: { user: owner } })).rejects.toThrow(/integridad|procedencia/i)
    expect(second.create).not.toHaveBeenCalled()
  })
})
