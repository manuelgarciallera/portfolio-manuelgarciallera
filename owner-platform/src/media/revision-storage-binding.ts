import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'

import { isOwner } from '../access/owner'
import { readMediaRevision, writeMediaRevision } from './revision-store'

const revisionID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const binaryKeys = ['storageRevision', 'filename', 'mimeType', 'filesize', 'width', 'height', 'sizes'] as const
const binaryMetadata = (doc: Record<string, unknown>) => Object.fromEntries(binaryKeys.map((key) => [key,
  key === 'sizes' ? Object.fromEntries(Object.entries(object(doc.sizes)).map(([name, size]) => {
    const metadata = Object.fromEntries(Object.entries(object(size)).filter(([key]) => key !== 'url'))
    return [name, metadata]
  })) : doc[key] ?? null,
]))
const missing = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })

const provisionedRoot = async (root: string) => {
  if (typeof root !== 'string' || !path.isAbsolute(root) || path.resolve(root) === path.parse(root).root) {
    throw new Error('Storage roots must be explicit absolute provisioned directories.')
  }
  const stats = await lstat(root)
  if (!stats.isDirectory() || stats.isSymbolicLink() || path.relative(path.resolve(root), await realpath(root)) !== '') {
    throw new Error('Storage roots must be real directories without links.')
  }
  return path.resolve(root)
}
const contains = (parent: string, child: string) => {
  const relative = path.relative(parent, child)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

/** Opt-in only: provision a PRIVATE root outside every static web mount before calling. */
export const createRevisionStorageCollection = async (
  collection: CollectionConfig,
  settings: { revisionRoot: string; staticDir: string },
): Promise<CollectionConfig> => {
  if (collection.slug !== 'media' || !collection.upload || !collection.versions ||
    collection.fields.some((field) => 'name' in field && field.name === 'storageRevision')) {
    throw new Error('Expected the raw versioned Media collection.')
  }
  const revisionRoot = await provisionedRoot(settings?.revisionRoot)
  const staticDir = await provisionedRoot(settings?.staticDir)
  if (contains(revisionRoot, staticDir) || contains(staticDir, revisionRoot)) {
    throw new Error('Revision storage must be separate from native static storage.')
  }
  const upload = typeof collection.upload === 'object' ? collection.upload : {}
  // Only actual restoreVersion operations can grant a single-use capability.
  // Payload creates a validation request with Object.create(req) during restore.
  const restores = new WeakMap<object, { parent: unknown; version: Record<string, unknown> }>()
  const revisionURL = (req: PayloadRequest, doc: Record<string, unknown>, filename: string) =>
    `${req.payload.config.routes.api}/media/revision/${encodeURIComponent(String(doc.id))}/${doc.storageRevision}/${encodeURIComponent(filename)}`

  return {
    ...collection,
    fields: [...collection.fields, { name: 'storageRevision', type: 'text', admin: { readOnly: true } }],
    upload: { ...upload, staticDir, disableLocalStorage: true, handlers: [() => missing()] },
    endpoints: [...(collection.endpoints || []), {
      path: '/revision/:id/:revision/:filename', method: 'get',
      handler: async (req) => {
        try {
          const { id, revision, filename } = req.routeParams ?? {}
          if (typeof id !== 'string' || typeof revision !== 'string' || !revisionID.test(revision) || typeof filename !== 'string') return missing()
          // Always check current collection access/existence, even for an owner.
          const current = object(await req.payload.findByID({ collection: 'media', id, depth: 0, draft: false, overrideAccess: false, req }))
          let selected: Record<string, unknown> = current
          if (current.storageRevision !== revision) {
            if (!isOwner(req.user)) return missing()
            const versions = await req.payload.findVersions({ collection: 'media', depth: 0, limit: 1, pagination: false,
              where: { and: [{ parent: { equals: id } }, { 'version.storageRevision': { equals: revision } }] },
              overrideAccess: false, req,
            })
            if (!versions.docs[0]) return missing()
            selected = object(versions.docs[0].version)
          }
          if (!isOwner(req.user) && selected._status !== 'published') return missing()
          const candidates = [selected, ...Object.values(object(selected.sizes)).map(object)]
          const metadata = candidates.find((entry) => entry.filename === filename)
          if (!metadata) return missing()
          const files = await readMediaRevision(revisionRoot, revision)
          const file = files.find((entry) => entry.name === filename)
          if (!file) return missing()
          return new Response(new Uint8Array(file.bytes), { headers: {
            'Content-Type': typeof metadata.mimeType === 'string' ? metadata.mimeType : 'application/octet-stream',
            'Content-Length': String(file.bytes.length), 'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            // Publication can be revoked; never cache access to an old publication.
            'Cache-Control': 'private, no-store',
          } })
        } catch { return missing() }
      },
    }],
    hooks: {
      ...collection.hooks,
      beforeOperation: [...(collection.hooks?.beforeOperation ?? []), async ({ operation, args, req }) => {
        if (['create', 'update', 'delete', 'restoreVersion'].includes(operation)) restores.delete(req)
        if (operation === 'restoreVersion') {
          if (!isOwner(req.user)) throw new APIError('Owner required to restore media.', 403)
          const version = await req.payload.findVersionByID({ collection: 'media', id: String(args.id), depth: 0, overrideAccess: false, req })
          restores.set(req, { parent: version.parent, version: object(version.version) })
        }
        return args
      }],
      beforeChange: [...(collection.hooks?.beforeChange ?? []), async ({ data, originalDoc, req }) => {
        const authorityReq = restores.has(req) ? req : Object.getPrototypeOf(req) as object
        const restore = restores.get(authorityReq)
        if (restore) {
          restores.delete(authorityReq)
          if (String(restore.parent) !== String(originalDoc.id) || !isDeepStrictEqual(binaryMetadata(data), binaryMetadata(restore.version))) {
            throw new APIError('Restored media must match its stored version.', 400)
          }
          if (typeof restore.version.storageRevision === 'string') await readMediaRevision(revisionRoot, restore.version.storageRevision)
          return data
        }
        if (Object.hasOwn(data, 'storageRevision') && data.storageRevision !== originalDoc?.storageRevision) {
          throw new APIError('Storage revision cannot be assigned by a caller.', 400)
        }
        if (Object.hasOwn(data, 'prefix')) throw new APIError('Storage prefix cannot be assigned by a caller.', 400)
        if (req.file) {
          const files = [{ name: data.filename as string, bytes: req.file.data }]
          for (const [name, size] of Object.entries(object(data.sizes))) {
            const filename = object(size).filename
            if (typeof filename === 'string') files.push({ name: filename, bytes: req.payloadUploadSizes?.[name] as Buffer })
          }
          // Keep an orphan if a later hook/transaction fails; never guess cleanup.
          data.storageRevision = await writeMediaRevision(revisionRoot, files)
        } else {
          const merged = { ...originalDoc, ...data, storageRevision: originalDoc?.storageRevision }
          if (!isDeepStrictEqual(binaryMetadata(merged), binaryMetadata(originalDoc ?? {}))) {
            throw new APIError('Binary metadata requires an upload or stored version restore.', 400)
          }
          data.storageRevision = originalDoc?.storageRevision ?? null
        }
        return data
      }],
      afterRead: [...(collection.hooks?.afterRead ?? []), ({ doc, req }) => {
        doc.url = typeof doc.storageRevision === 'string' && revisionID.test(doc.storageRevision) && typeof doc.filename === 'string'
          ? revisionURL(req, doc, doc.filename) : null
        for (const size of Object.values(object(doc.sizes))) {
          const entry = object(size)
          entry.url = doc.url && typeof entry.filename === 'string' ? revisionURL(req, doc, entry.filename) : null
        }
        return doc
      }],
    },
  }
}
