import { APIError, type Payload, type PayloadRequest } from 'payload'

import { isOwner } from '../access/owner'
import { resolvePageBrand } from '../brand/inheritance'
import { createPreviewManifest } from './manifest'
import { recordAuditEvent } from '../collections/AuditEvents'
import { normalizeMediaPlacement } from '../media/placement'

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError('Datos editoriales no válidos.', 400)
  return value as Record<string, unknown>
}
const text = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined
/** Classify captured references as well as current rows, without resolving URLs or backfilling history. */
export const mediaReferenceStorage = (reference: Record<string, unknown>):
  { storage: 'versioned'; storageRevision: string } | { storage: 'legacy-unverified' } => {
  const revision = reference.storageRevision
  return typeof revision === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(revision)
    ? { storage: 'versioned', storageRevision: revision } : { storage: 'legacy-unverified' }
}
const defined = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))
const relationId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && ('id' in value)) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
}

const lexicalKeys = new Set(['type', 'version', 'direction', 'format', 'indent', 'text', 'detail', 'mode', 'tag', 'listType', 'start', 'language'])
const safeURL = (value: unknown): string => {
  if (typeof value !== 'string' || /[\u0000-\u001F\u007F]/.test(value)) throw new APIError('URL editorial no válida.', 400)
  if (value.includes('\\') || value.startsWith('//')) throw new APIError('URL editorial no válida.', 400)
  if (/^\/(?!\/)/.test(value)) {
    try {
      if (decodeURIComponent(value).includes('\\')) throw new Error('encoded backslash')
      return value
    } catch { throw new APIError('URL editorial no válida.', 400) }
  }
  if (value.startsWith('#')) return value
  try {
    const protocol = new URL(value).protocol
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(protocol)) return value
  } catch { /* handled below */ }
  throw new APIError('URL editorial no permitida.', 400)
}
export const projectLexical = (value: unknown, mediaIds: Array<number | string>): unknown => {
  if (Array.isArray(value)) return value.map((entry) => projectLexical(entry, mediaIds))
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value
  const source = record(value)
  if (Object.hasOwn(source, 'root')) return { root: projectLexical(source.root, mediaIds) }
  const output: Record<string, unknown> = {}
  for (const key of lexicalKeys) if (Object.hasOwn(source, key)) output[key] = projectLexical(source[key], mediaIds)
  if (Object.hasOwn(source, 'style')) output.style = ''
  if (Object.hasOwn(source, 'children')) output.children = projectLexical(source.children, mediaIds)
  const nodeType = text(source.type)
  if (nodeType === 'link' || nodeType === 'autolink') {
    const fields = record(source.fields)
    const linkType = text(fields.linkType) ?? (nodeType === 'autolink' ? 'custom' : undefined)
    if (linkType === 'custom') output.fields = defined({ linkType, url: safeURL(fields.url), newTab: typeof fields.newTab === 'boolean' ? fields.newTab : undefined })
    else if (linkType === 'internal') {
      const doc = record(fields.doc)
      const relationTo = text(doc.relationTo)
      const value = relationId(doc.value)
      if (!relationTo || !['pages', 'projects', 'articles'].includes(relationTo) || value === undefined) throw new APIError('Enlace interno no válido.', 400)
      output.fields = { linkType, doc: { relationTo, value: String(value) }, ...(typeof fields.newTab === 'boolean' ? { newTab: fields.newTab } : {}) }
    } else throw new APIError('Tipo de enlace no permitido.', 400)
  }
  if (nodeType === 'upload' || nodeType === 'relationship') {
    const relationTo = text(source.relationTo)
    const value = relationId(source.value)
    const allowed = nodeType === 'upload' ? ['media'] : ['media', 'pages', 'projects', 'articles']
    if (!relationTo || !allowed.includes(relationTo) || value === undefined) throw new APIError('Relación editorial no válida.', 400)
    output.relationTo = relationTo
    output.value = String(value)
    if (nodeType === 'upload') {
      if (typeof source.id !== 'string' || source.id.trim() === '') throw new APIError('El nodo Upload necesita un id válido.', 400)
      record(source.fields)
      output.id = source.id
      // No upload subfields are configured in this editor. An explicit empty object
      // is the canonical, rehydratable shape and prevents arbitrary field storage.
      output.fields = {}
    }
    if (relationTo === 'media') mediaIds.push(value)
  }
  return defined(output)
}

const projectLayout = (layout: unknown): { blocks: unknown[]; mediaIds: Array<number | string> } => {
  if (!Array.isArray(layout)) throw new APIError('La página no contiene un layout válido.', 400)
  const mediaIds: Array<number | string> = []
  const blockIds = new Set<string>()
  const blocks = layout.map((raw) => {
    const block = record(raw)
    const blockType = text(block.blockType)
    const id = block.id
    if (Object.hasOwn(block, 'id')) {
      if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id) || blockIds.has(id)) {
        throw new APIError('El identificador de bloque no es válido o está duplicado.', 400)
      }
      blockIds.add(id)
    }
    // Keep persisted identity; positional/generated IDs would become ambiguous
    // when an owner or an assistant reorders otherwise identical blocks.
    const base = defined({ blockType, id })
    if (blockType === 'hero') {
      const image = relationId(block.image)
      if (image !== undefined) mediaIds.push(image)
      return defined({ ...base, eyebrow: text(block.eyebrow), heading: text(block.heading), body: block.body ? projectLexical(block.body, mediaIds) : undefined, image: image === undefined ? undefined : String(image) })
    }
    if (blockType === 'richText') return { ...base, content: projectLexical(block.content, mediaIds) }
    if (blockType === 'projectGrid') {
      const projects = Array.isArray(block.projects) ? block.projects.map(relationId).filter((id): id is number | string => id !== undefined).map(String) : []
      return defined({ ...base, heading: text(block.heading), projects })
    }
    if (blockType === 'media') {
      const asset = relationId(block.asset)
      const placement = relationId(block.placement)
      if (asset === undefined) throw new APIError('El bloque media no tiene un recurso válido.', 400)
      mediaIds.push(asset)
      return defined({ ...base, asset: String(asset), caption: text(block.caption), placement: placement === undefined ? undefined : String(placement) })
    }
    if (blockType === 'customFeature') {
      const featureKey = text(block.featureKey)
      if (!['project-reel', 'research-index', 'contact-panel'].includes(featureKey ?? ''))
        throw new APIError('Funcionalidad personalizada no permitida.', 400)
      return defined({ ...base, featureKey, heading: text(block.heading) })
    }
    throw new APIError(`Tipo de bloque no permitido: ${blockType ?? 'desconocido'}.`, 400)
  })
  return { blocks, mediaIds: [...new Set(mediaIds)] }
}

const captureMediaPlacements = async (payload: Payload, req: PayloadRequest, blocks: unknown[]) => {
  const references = new Map<string, string>()
  for (const raw of blocks) {
    const block = record(raw)
    if (block.blockType !== 'media' || typeof block.placement !== 'string') continue
    const asset = String(block.asset)
    if (references.has(block.placement) && references.get(block.placement) !== asset) throw new APIError('El encuadre está asociado a imágenes diferentes.', 400)
    references.set(block.placement, asset)
  }
  return Promise.all([...references].map(async ([id, asset]) => {
    const stored = record(await payload.findByID({ collection: 'media-placements', id, draft: true, depth: 0, overrideAccess: false, req }))
    const updatedAt = text(stored.updatedAt)
    if (String(stored.id) !== id || !updatedAt) throw new APIError('El encuadre no tiene identidad o revisión verificable.', 400)
    const placement = normalizeMediaPlacement(stored.placement)
    if (String(placement.asset) !== asset) throw new APIError('El encuadre no corresponde a la imagen del bloque.', 400)
    return { id, versionId: `current:${updatedAt}`, placement }
  }))
}

export const createPagePreviewSnapshot = async ({ payload, req, pageId }: { payload: Payload; req: PayloadRequest; pageId: number | string }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const page = record(await payload.findByID({ collection: 'pages', id: pageId as number, draft: true, depth: 0, overrideAccess: false, req }))
  const brandId = relationId(page.brandProfile)
  if (brandId === undefined) throw new APIError('La página necesita un perfil de marca.', 400)
  const brand = await payload.findByID({ collection: 'brand-profiles', id: brandId as number, depth: 0, overrideAccess: false, req })
  const resolvedBrand = resolvePageBrand(brand, page.brandOverrides)
  const projected = projectLayout(page.layout)
  const mediaPlacements = await captureMediaPlacements(payload, req, projected.blocks)
  const mediaReferences = await Promise.all(projected.mediaIds.map(async (id) => {
    const media = record(await payload.findByID({ collection: 'media', id: id as number, depth: 0, overrideAccess: false, req }))
    // Missing revisions in older manifests remain unverified. Never backfill an
    // existing capture from today's media row or infer storage from its URL.
    return defined({ id: String(media.id), alt: text(media.alt), filename: text(media.filename), mimeType: text(media.mimeType), width: typeof media.width === 'number' ? media.width : undefined, height: typeof media.height === 'number' ? media.height : undefined,
      ...mediaReferenceStorage(media) })
  }))
  const updatedAt = text(page.updatedAt)
  if (!updatedAt) throw new APIError('La página no tiene una revisión actual verificable.', 400)
  const manifest = createPreviewManifest({
    source: { collection: 'pages', documentId: String(page.id), versionId: `current:${updatedAt}` },
    pageTitle: text(page.title),
    mediaPlacements,
    brandTokens: resolvedBrand,
    pageBlocks: projected.blocks,
    mediaReferences,
  })
  // Rechecking an unchanged revision must reuse its immutable capture. The hash
  // covers the freshly loaded page, brand and media, not just the page timestamp.
  const existing = await payload.find({
    collection: 'preview-snapshots', where: { manifestHash: { equals: manifest.hash } },
    depth: 0, limit: 1, pagination: false, overrideAccess: false, req,
  })
  if (existing.docs[0]) return existing.docs[0]
  const snapshot = await payload.create({
    collection: 'preview-snapshots',
    overrideAccess: true,
    draft: false,
    req,
    data: {
      schemaVersion: manifest.schemaVersion,
      sourceCollection: manifest.source.collection,
      sourceDocumentId: manifest.source.documentId,
      sourceVersionId: manifest.source.versionId,
      manifest,
      manifestHash: manifest.hash,
      createdBy: req.user.id,
    },
  })
  await recordAuditEvent({
    input: {
      action: 'preview.snapshot.created',
      metadata: { manifestHash: manifest.hash, snapshotId: snapshot.id },
      outcome: 'success',
      subject: { collection: 'pages', id: page.id as number | string },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return snapshot
}
