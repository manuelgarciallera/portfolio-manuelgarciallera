import { describe, expect, it, vi } from 'vitest'
import { createPreviewManifest } from './manifest'
import { loadSnapshotVisualPreview } from './snapshot-visual'

const setup = (legacy = false) => {
  const manifest = createPreviewManifest({ source: { collection: 'pages', documentId: '7', versionId: 'current:old' }, pageTitle: 'Título antiguo', brandTokens: {},
    pageBlocks: [{ blockType: 'hero', heading: 'Antes', image: '9' }, { blockType: 'projectGrid', projects: ['3'] }],
    mediaReferences: [{ id: '9', filename: 'old.png', alt: 'Original', width: 1200, height: 800, storage: legacy ? 'legacy-unverified' : 'versioned',
      ...(legacy ? {} : { storageRevision: '12345678-1234-4234-8234-123456789012' }) }] })
  const doc = { schemaVersion: 1, sourceCollection: 'pages', sourceDocumentId: '7', sourceVersionId: 'current:old', manifestHash: manifest.hash, manifest, createdAt: '2026-09-01' }
  const findByID = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection !== 'preview-snapshots') throw new Error('Live read forbidden')
    return doc
  })
  return { doc, req: { user: { collection: 'users', id: 1, role: 'owner' }, payload: { findByID } }, findByID }
}

describe('snapshot visual projection', () => {
  it('projects captured title, blocks and image without live relationship reads', async () => {
    const f = setup()
    const result = await loadSnapshotVisualPreview({ req: f.req as never, snapshotId: '2' })
    expect(result.title).toBe('Título antiguo')
    expect(result.blocks[0].heading).toBe('Antes')
    expect(result.assets['9']).toEqual({ id: '9', url: '/api/media/snapshot/2/9', alt: 'Original', width: 1200, height: 800 })
    expect(result.blocks[1].projects).toEqual([])
    expect(result.warnings.join(' ')).toContain('proyecto 3')
    expect(f.findByID).toHaveBeenCalledTimes(1)
    expect(f.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'preview-snapshots', overrideAccess: false }))
  })
  it('does not infer legacy images from current data', async () => {
    const f = setup(true)
    const result = await loadSnapshotVisualPreview({ req: f.req as never, snapshotId: '2' })
    expect(result.assets).toEqual({})
    expect(result.warnings.join(' ')).toContain('medio 9')
    expect(f.findByID).toHaveBeenCalledTimes(1)
  })
  it('labels absent historical titles explicitly', async () => {
    const f = setup()
    const previous = { ...f.doc.manifest }; delete previous.pageTitle
    f.doc.manifest = createPreviewManifest({ ...previous, pageBlocks: [...previous.pageBlocks], mediaReferences: [...previous.mediaReferences] })
    f.doc.manifestHash = f.doc.manifest.hash
    const result = await loadSnapshotVisualPreview({ req: f.req as never, snapshotId: '2' })
    expect(result.title).toBe('Captura sin título guardado')
    expect(result.warnings.join(' ')).toContain('no conserva el título')
    expect(f.findByID).toHaveBeenCalledTimes(1)
  })
  it('preserves captured brand and responsive placement without extra database reads', async () => {
    const f = setup()
    f.doc.manifest = createPreviewManifest({ ...f.doc.manifest,
      pageBlocks: [{ blockType: 'media', asset: '9', placement: '14' }], mediaReferences: [...f.doc.manifest.mediaReferences],
      brandTokens: { colors: [{ role: 'background', value: '#123456' }, { role: 'text', value: '#FFFFFF' },
        { role: 'surface', value: '#111111' }, { role: 'mutedText', value: '#AAAAAA' }, { role: 'accent', value: '#FF4B44' },
        { role: 'interaction', value: '#00D4E6' }, { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' }],
        usageWeights: [{ role: 'background', weight: 100 }], motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' } },
      mediaPlacements: [{ id: '14', versionId: 'current:old', placement: { asset: '9', fit: 'cover', frame: '4:3', focalX: .2, focalY: .8, zoom: 1.5, overrides: { mobile: { frame: '9:16', zoom: 2 } } } }],
    })
    f.doc.manifestHash = f.doc.manifest.hash
    const result = await loadSnapshotVisualPreview({ req: f.req as never, snapshotId: '2' })
    expect(result.brand?.colors).toContainEqual({ role: 'background', value: '#123456' })
    expect(result.blocks[0].placement).toEqual({ asset: '9', fit: 'cover', frame: '4:3', focalX: .2, focalY: .8, zoom: 1.5, overrides: { mobile: { frame: '9:16', zoom: 2 } } })
    expect(result.warnings).toEqual([])
    expect(f.findByID).toHaveBeenCalledTimes(1)
  })
  it('rejects anonymous before reading', async () => {
    const f = setup()
    await expect(loadSnapshotVisualPreview({ req: { ...f.req, user: null } as never, snapshotId: '2' })).rejects.toThrow()
    expect(f.findByID).not.toHaveBeenCalled()
  })
  it('rejects tampered provenance', async () => {
    const f = setup(); f.doc.sourceDocumentId = '8'
    await expect(loadSnapshotVisualPreview({ req: f.req as never, snapshotId: '2' })).rejects.toThrow()
  })
})
