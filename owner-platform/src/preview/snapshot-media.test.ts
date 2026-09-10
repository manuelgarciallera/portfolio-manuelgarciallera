import { describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'
import { createPreviewManifest } from './manifest'
import { readSnapshotMedia } from './snapshot-media'

const revision = '12345678-1234-4234-8234-123456789012'
const setup = () => {
  const manifest = createPreviewManifest({ source: { collection: 'pages', documentId: '7', versionId: 'current:old' }, brandTokens: {}, pageBlocks: [],
    mediaReferences: [{ id: '9', filename: 'old.png', mimeType: 'image/png', storage: 'versioned', storageRevision: revision }] })
  const doc = { schemaVersion: 1, sourceCollection: 'pages', sourceDocumentId: '7', sourceVersionId: 'current:old', manifestHash: manifest.hash, manifest }
  const findByID = vi.fn().mockResolvedValue(doc)
  const req = { user: { collection: 'users', id: 1, role: 'owner' }, payload: { findByID } } as unknown as PayloadRequest
  const store = { read: vi.fn().mockResolvedValue([{ name: 'old.png', bytes: Buffer.from('historical') }]) }
  return { doc, req, store, findByID }
}

describe('private snapshot original media', () => {
  it('reads the captured revision, never the current media document', async () => {
    const f = setup()
    const result = await readSnapshotMedia({ ...f, snapshotId: '2', mediaId: '9' })
    expect(result.bytes.toString()).toBe('historical')
    expect(result.mimeType).toBe('image/png')
    expect(f.store.read).toHaveBeenCalledWith(revision)
    expect(f.findByID).toHaveBeenCalledExactlyOnceWith({ collection: 'preview-snapshots', id: '2', depth: 0, overrideAccess: false, req: f.req })
  })
  it.each([null, { collection: 'users', id: 1, role: 'editor' }])('rejects non-owner before reading data', async user => {
    const f = setup(); f.req.user = user as PayloadRequest['user']
    await expect(readSnapshotMedia({ ...f, snapshotId: '2', mediaId: '9' })).rejects.toThrow()
    expect(f.findByID).not.toHaveBeenCalled(); expect(f.store.read).not.toHaveBeenCalled()
  })
  it.each(['hash', 'source', 'membership', 'legacy', 'duplicate'])('rejects %s before object access', async fault => {
    const f = setup()
    if (fault === 'hash') f.doc.manifestHash = 'wrong'
    if (fault === 'source') f.doc.sourceDocumentId = '8'
    if (fault === 'legacy' || fault === 'duplicate') {
      const refs = fault === 'legacy' ? [{ id: '9', filename: 'old.png', storage: 'legacy-unverified' }] : [...f.doc.manifest.mediaReferences, ...f.doc.manifest.mediaReferences]
      f.doc.manifest = createPreviewManifest({ ...f.doc.manifest, pageBlocks: [...f.doc.manifest.pageBlocks], mediaReferences: refs }); f.doc.manifestHash = f.doc.manifest.hash
    }
    await expect(readSnapshotMedia({ ...f, snapshotId: '2', mediaId: fault === 'membership' ? '10' : '9' })).rejects.toThrow()
    expect(f.store.read).not.toHaveBeenCalled()
  })
  it('does not fall back when original bytes are missing', async () => {
    const f = setup(); f.store.read.mockResolvedValue([])
    await expect(readSnapshotMedia({ ...f, snapshotId: '2', mediaId: '9' })).rejects.toThrow()
  })
})
