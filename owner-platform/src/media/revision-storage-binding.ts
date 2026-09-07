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
const configuredNativeOrigin = (value: unknown) => {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error('Native fetch origin must be a canonical HTTP(S) origin.')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Native fetch origin must be a canonical HTTP(S) origin.') }
  const canonical = url.origin === value && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password
  const secure = url.protocol === 'https:'
  const fixtureLoopback = url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port !== ''
  if (!canonical || (!secure && !fixtureLoopback)) throw new Error('Native fetch origin must be canonical HTTPS or an exact ported 127.0.0.1 fixture origin.')
  return value
}

/** Opt-in only: provision a PRIVATE root outside every static web mount before calling. */
export const createRevisionStorageCollection = async (
  collection: CollectionConfig,
  settings: { nativeFetchOrigin?: string; revisionRoot: string; staticDir: string },
): Promise<CollectionConfig> => {
  if (collection.slug !== 'media' || !collection.upload || !collection.versions ||
    collection.fields.some((field) => 'name' in field && field.name === 'storageRevision')) {
    throw new Error('Expected the raw versioned Media collection.')
  }
  const revisionRoot = await provisionedRoot(settings?.revisionRoot)
  const staticDir = await provisionedRoot(settings?.staticDir)
  const nativeFetchOrigin = configuredNativeOrigin(settings?.nativeFetchOrigin)
  if (contains(revisionRoot, staticDir) || contains(staticDir, revisionRoot)) {
    throw new Error('Revision storage must be separate from native static storage.')
  }
  const upload = typeof collection.upload === 'object' ? collection.upload : {}
  // Only actual restoreVersion operations can grant a single-use capability.
  // Payload creates a validation request with Object.create(req) during restore.
  const restores = new WeakMap<object, { parent: unknown; version: Record<string, unknown> }>()
  // Payload removes the source id before its field hooks prepare a duplicate.
  // Preserve only the server-side duplicate operation's source id for its refetch URL.
  const nativeSources = new WeakMap<object, string>()
  const revisionURL = (req: PayloadRequest, id: unknown, revision: unknown, filename: string) =>
    `${req.payload.config.routes.api}/media/revision/${encodeURIComponent(String(id))}/${revision}/${encodeURIComponent(filename)}`
  const revisionURLField = ({ data, originalDoc, req, value }: {
    data?: Record<string, unknown>
    originalDoc?: Record<string, unknown>
    req: PayloadRequest
    value?: unknown
  }) => {
    const doc = object(originalDoc ?? data)
    const id = doc.id ?? nativeSources.get(req)
    return id !== undefined && typeof doc.storageRevision === 'string' && revisionID.test(doc.storageRevision) && typeof doc.filename === 'string'
      ? revisionURL(req, id, doc.storageRevision, doc.filename)
      : value
  }

  return {
    ...collection,
    fields: [...collection.fields,
      { name: 'storageRevision', type: 'text', admin: { readOnly: true } },
      // Merges after Payload's generated upload URL hook. This also runs during
      // getDuplicateDocumentData, unlike collection-level afterRead hooks.
      { name: 'url', type: 'text', admin: { hidden: true, readOnly: true }, hooks: { afterRead: [revisionURLField] } },
    ],
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
        nativeSources.delete(req)
        if (['create', 'update', 'delete', 'restoreVersion'].includes(operation)) restores.delete(req)
        const incoming = object((args as { data?: unknown }).data)
        const uploadEdits = object(req.query?.uploadEdits)
        const hasUploadEdits = ['crop', 'focalPoint', 'heightInPixels', 'widthInPixels'].some((key) => Object.hasOwn(uploadEdits, key))
        const bodyFocalEdit = Object.hasOwn(incoming, 'focalX') || Object.hasOwn(incoming, 'focalY')
        const duplicate = operation === 'create' && args.duplicateFromID !== undefined
        const assertNativeOrigin = () => {
          if (!isOwner(req.user) || !nativeFetchOrigin || req.headers.get('origin') !== nativeFetchOrigin) {
            throw new APIError('Trusted owner origin required for native media editing.', 403)
          }
        }
        if (duplicate) {
          assertNativeOrigin()
          nativeSources.set(req, String(args.duplicateFromID))
        }
        if (operation === 'create' && !req.file && !duplicate && (hasUploadEdits || bodyFocalEdit ||
          ['url', 'filename', 'storageRevision', 'prefix'].some((key) => Object.hasOwn(incoming, key)))) {
          throw new APIError('A new media record requires an uploaded file.', 400)
        }
        const nativeEdit = !req.file && operation === 'update' && (hasUploadEdits || bodyFocalEdit)
        if (nativeEdit) {
          assertNativeOrigin()
          const source = object(await req.payload.findByID({
            collection: 'media', id: (args as unknown as { id: string | number }).id, depth: 0,
            // updateByID mutates the latest version even when this request also
            // publishes it and therefore has no draft=true query parameter.
            draft: true,
            overrideAccess: false, req,
          }))
          if (Object.hasOwn(incoming, 'storageRevision') && incoming.storageRevision !== source.storageRevision) {
            throw new APIError('Storage revision cannot be assigned by a caller.', 400)
          }
          if (Object.hasOwn(incoming, 'prefix')) throw new APIError('Storage prefix cannot be assigned by a caller.', 400)
          if (typeof source.storageRevision !== 'string' || !revisionID.test(source.storageRevision) || typeof source.filename !== 'string') {
            throw new APIError('Native media source is not revision-backed.', 400)
          }
          // Native edits need a URL before beforeChange. Always replace client
          // selectors with the access-checked current record's immutable URL.
          args.data = {
            ...incoming,
            filename: source.filename,
            url: revisionURL(req, source.id, source.storageRevision, source.filename),
          }
        }
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
          const files = new Map<string, Buffer>()
          const addFile = (name: unknown, bytes: unknown) => {
            if (typeof name !== 'string' || !Buffer.isBuffer(bytes)) throw new Error('Payload did not provide complete generated media bytes.')
            const existing = files.get(name)
            if (existing && !existing.equals(bytes)) throw new Error('Payload generated conflicting bytes for one media filename.')
            files.set(name, bytes)
          }
          addFile(data.filename, req.file.data)
          for (const [name, size] of Object.entries(object(data.sizes))) {
            const filename = object(size).filename
            if (typeof filename === 'string') addFile(filename, req.payloadUploadSizes?.[name])
          }
          // Keep an orphan if a later hook/transaction fails; never guess cleanup.
          data.storageRevision = await writeMediaRevision(revisionRoot, [...files].map(([name, bytes]) => ({ name, bytes })))
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
          ? revisionURL(req, doc.id, doc.storageRevision, doc.filename) : null
        for (const size of Object.values(object(doc.sizes))) {
          const entry = object(size)
          entry.url = doc.url && typeof entry.filename === 'string' ? revisionURL(req, doc.id, doc.storageRevision, entry.filename) : null
        }
        return doc
      }],
    },
  }
}
