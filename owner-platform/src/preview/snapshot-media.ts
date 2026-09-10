import type { PayloadRequest } from 'payload'
import { isOwner } from '../access/owner'
import { validateRevision } from '../media/revision-manifest'
import { hashPreviewManifest, type PreviewManifest } from './manifest'

type Input = { req: PayloadRequest; snapshotId: string; mediaId: string; store: { read(revision: string): Promise<{ name: string; bytes: Buffer }[]> } }

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid captured media')
  return value as Record<string, unknown>
}

/** Server-only primitive. The injected store must verify revision manifests and bytes.
 * No current-document lookup or legacy fallback: a capture cannot silently change.
 * An HTTP consumer must independently apply private/no-store and sandbox headers.
 */
export async function loadValidatedSnapshot(req: PayloadRequest, snapshotId: string) {
  if (!isOwner(req.user)) throw new Error('Owner required')
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(snapshotId)) throw new Error('Invalid identity')
  const doc = record(await req.payload.findByID({ collection: 'preview-snapshots', id: snapshotId, depth: 0, overrideAccess: false, req }))
  const manifest = record(doc.manifest) as unknown as PreviewManifest
  if (hashPreviewManifest(manifest) !== doc.manifestHash || manifest.schemaVersion !== 1 || doc.schemaVersion !== 1 ||
    manifest.source.collection !== 'pages' || doc.sourceCollection !== manifest.source.collection ||
    doc.sourceDocumentId !== manifest.source.documentId || doc.sourceVersionId !== manifest.source.versionId) throw new Error('Invalid snapshot provenance')
  if (!Array.isArray(manifest.mediaReferences)) throw new Error('Invalid captured references')
  return { doc, manifest }
}

export async function readSnapshotMedia({ req, snapshotId, mediaId, store }: Input): Promise<{ bytes: Buffer; mimeType: string; filename: string }> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(mediaId)) throw new Error('Invalid identity')
  const { manifest } = await loadValidatedSnapshot(req, snapshotId)
  const refs = manifest.mediaReferences.map(record)
  const selected = refs.filter(ref => ref.id === mediaId)
  if (selected.length !== 1) throw new Error('Captured media missing or ambiguous')
  const ref = selected[0]
  if (ref.storage !== 'versioned' || typeof ref.storageRevision !== 'string') throw new Error('Unverified legacy media')
  validateRevision(ref.storageRevision)
  if (typeof ref.filename !== 'string' || !ref.filename || /[\\/\u0000-\u001f\u007f]/.test(ref.filename)) throw new Error('Invalid captured filename')
  const files = await store.read(ref.storageRevision)
  const matches = files.filter(file => file.name === ref.filename)
  if (matches.length !== 1) throw new Error('Captured original unavailable')
  return { bytes: Buffer.from(matches[0].bytes), filename: ref.filename,
    mimeType: typeof ref.mimeType === 'string' && /^image\/(png|jpeg|webp|avif|gif)$/.test(ref.mimeType) ? ref.mimeType : 'application/octet-stream' }
}
