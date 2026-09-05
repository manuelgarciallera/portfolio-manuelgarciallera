import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from '../publication/artifact'
import { createPublicationBundle } from '../publication/bundle'
import { createPublicationExport } from '../publication/export'
import { createPublicationPreflight } from '../publication/preflight'
import { enforcePublicationPreflightDelete, preparePublicationPreflight, PublicationPreflights } from './PublicationPreflights'

const owner = { collection: 'users', id: 1, role: 'owner' }
const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, layout: [{ blockType: 'hero', heading: 'Inicio' }], slug: 'inicio', title: 'Inicio' } })
const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
const artifact = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })
const exported = createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
const report = createPublicationPreflight(exported, '2026-09-05T08:10:00.000Z')
const data = { artifact: 100, artifactHash: artifact.hash, checkedAt: report.checkedAt, createdBy: 1, exportHash: exported.hash, issueCount: report.issueCount, pageCount: report.pageCount, preflightHash: report.hash, report, schemaVersion: report.schemaVersion, status: report.status }

describe('PublicationPreflights collection', () => {
  it('is immutable, owner-readable, and unavailable through direct creation', async () => {
    expect(PublicationPreflights.slug).toBe('publication-preflights')
    expect(PublicationPreflights.access?.create?.({ req: { user: owner } } as never)).toBe(false)
    expect(PublicationPreflights.access?.read?.({ req: { user: owner } } as never)).toBe(true)
    expect(PublicationPreflights.access?.update?.({ req: { user: owner } } as never)).toBe(false)
    expect(PublicationPreflights.access?.delete?.({ req: { user: owner } } as never)).toBe(false)
    expect(PublicationPreflights.admin?.components?.edit?.beforeDocumentControls).toEqual(['./components/PublicationPreflightSummary#PublicationPreflightSummary'])
    await expect(enforcePublicationPreflightDelete({} as never)).rejects.toThrow(/inmutables/i)
  })

  it('accepts only exact canonical report data bound to the authenticated owner', async () => {
    await expect(preparePublicationPreflight({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(preparePublicationPreflight({ data: { ...data, status: 'ready' }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|informe|procedencia/i)
    await expect(preparePublicationPreflight({ data: { ...data, createdBy: 2 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/procedencia|owner/i)
    await expect(preparePublicationPreflight({ data, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutables/i)
  })
})
