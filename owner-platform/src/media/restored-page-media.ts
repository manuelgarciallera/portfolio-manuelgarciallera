import { APIError, type CollectionBeforeChangeHook, type Payload, type PayloadRequest } from 'payload'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'

// Server-owned capability, never an HTTP context flag. Only the restore operation
// can assign this protected relationship; an explicit owner form action can clear it.
// Next can load the route and Payload's cached collection hooks from different
// module instances. Share only the registry, still keyed by the exact server
// request object. No request body/context/property can grant this capability.
const registryKey = Symbol.for('mgl.owner.restored-page-media.v1')
if (!Object.hasOwn(globalThis, registryKey)) {
  Object.defineProperty(globalThis, registryKey, {
    value: new WeakMap<object, string | number>(),
    enumerable: false, configurable: false, writable: false,
  })
}
const registry: unknown = Reflect.get(globalThis, registryKey)
if (!(registry instanceof WeakMap)) throw new Error('Invalid restored media capability registry')
const activeRestores = registry as WeakMap<object, string | number>
export const withRestoredPageMedia = async <T>(req: object, snapshot: string | number, write: () => Promise<T>): Promise<T> => {
  if (activeRestores.has(req)) throw new Error('Nested media restore is not supported')
  activeRestores.set(req, snapshot)
  try { return await write() } finally { activeRestores.delete(req) }
}
export const bindRestoredPageMedia: CollectionBeforeChangeHook = ({ data, req, originalDoc }) => ({
  ...data,
  restoredMediaSnapshot: activeRestores.get(req) ?? (data.useCurrentMedia === true ? null : originalDoc?.restoredMediaSnapshot ?? null),
})

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
export const resolveRestoredPageMedia = async ({ payload, req, page }: {
  payload: Pick<Payload, 'findByID'>; req: PayloadRequest; page: Record<string, unknown>
}) => {
  const id = page.restoredMediaSnapshot
  if (id == null) return (media: Record<string, unknown>) => media
  if (typeof id !== 'string' && typeof id !== 'number') throw new APIError('La referencia histórica no es válida.', 409)
  const snapshot = await payload.findByID({ collection: 'preview-snapshots', id, depth: 0, req, overrideAccess: false })
  const manifest = snapshot.manifest as PreviewManifest
  if (hashPreviewManifest(manifest) !== snapshot.manifestHash || manifest.source.documentId !== String(page.id) || manifest.source.collection !== 'pages') {
    throw new APIError('La referencia histórica no corresponde a esta página.', 409)
  }
  return (media: Record<string, unknown>): Record<string, unknown> => {
    const captured = manifest.mediaReferences.map(record).find(reference => String(reference.id) === String(media.id))
    if (!captured) return media
    if (captured.storage !== 'versioned' || typeof captured.storageRevision !== 'string' || typeof captured.filename !== 'string') {
      throw new APIError('La imagen histórica no tiene almacenamiento verificable.', 409)
    }
    return { ...captured, url: `/api/media/revision/${encodeURIComponent(String(media.id))}/${captured.storageRevision}/${encodeURIComponent(captured.filename)}` }
  }
}
