import { describe, expect, it } from 'vitest'

import { createPublicationBundle } from '../publication/bundle'
import { createDraftCapsule } from '../recovery/capsule'
import { enforcePublicationBundleDelete, preparePublicationBundle, PublicationBundles } from './PublicationBundles'

const owner = { id: 1, collection: 'users', role: 'owner' }
const capsule = createDraftCapsule({
  source: { collection: 'pages', documentId: '7', versionId: 'current:now' },
  state: { brandProfile: 3, layout: [], slug: 'inicio', title: 'Inicio' },
})
const bundle = createPublicationBundle({ entries: [{
  capsule, draftHash: capsule.hash, pageId: '7', position: 0,
  previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now',
}] })

describe('PublicationBundles collection', () => {
  it('is immutable, owner-readable, and closed to direct client mutation', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(PublicationBundles.slug).toBe('publication-bundles')
    expect(PublicationBundles.access?.read?.(access(owner))).toBe(true)
    expect(PublicationBundles.access?.read?.(access(null))).toBe(false)
    expect(PublicationBundles.access?.create?.(access(owner))).toBe(false)
    expect(PublicationBundles.access?.update?.(access(owner))).toBe(false)
    expect(PublicationBundles.access?.delete?.(access(owner))).toBe(false)
    expect(PublicationBundles.admin?.components?.edit?.beforeDocumentControls ?? []).toEqual([])
    expect(PublicationBundles.fields[0]).toMatchObject({
      name: 'ownerActions', type: 'ui',
      admin: { components: { Field: './components/PublicationBundleControls#PublicationBundleControls' } },
    })
  })

  it('accepts only matching bundle hash, count and owner provenance', async () => {
    const data = { bundle, bundleHash: bundle.hash, createdBy: 1, name: 'Publicación septiembre', pageCount: 1, schemaVersion: 1 }
    await expect(preparePublicationBundle({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(preparePublicationBundle({ data: { ...data, pageCount: 2 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/paquete|páginas/i)
  })

  it('rejects updates, deletes and anonymous creation', async () => {
    await expect(preparePublicationBundle({ data: {}, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(preparePublicationBundle({ data: {}, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforcePublicationBundleDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
