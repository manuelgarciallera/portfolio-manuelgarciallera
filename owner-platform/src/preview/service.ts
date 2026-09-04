import { APIError, type Payload, type PayloadRequest } from 'payload'

import { isOwner } from '../access/owner'
import { resolvePageBrand } from '../brand/inheritance'
import { createPreviewManifest } from './manifest'

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError('Datos editoriales no válidos.', 400)
  return value as Record<string, unknown>
}
const text = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined
const defined = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))
const relationId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && ('id' in value)) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
}

const lexicalKeys = new Set(['type', 'version', 'children', 'direction', 'format', 'indent', 'text', 'detail', 'mode', 'style', 'tag', 'listType', 'start', 'value', 'language', 'url', 'target', 'rel', 'title'])
const projectLexical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(projectLexical)
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value
  const source = record(value)
  if (Object.hasOwn(source, 'root')) return { root: projectLexical(source.root) }
  const output: Record<string, unknown> = {}
  for (const key of lexicalKeys) if (Object.hasOwn(source, key)) output[key] = projectLexical(source[key])
  return defined(output)
}

const projectLayout = (layout: unknown): { blocks: unknown[]; mediaIds: Array<number | string> } => {
  if (!Array.isArray(layout)) throw new APIError('La página no contiene un layout válido.', 400)
  const mediaIds: Array<number | string> = []
  const blocks = layout.map((raw) => {
    const block = record(raw)
    const blockType = text(block.blockType)
    const base = { blockType }
    if (blockType === 'hero') {
      const image = relationId(block.image)
      if (image !== undefined) mediaIds.push(image)
      return defined({ ...base, eyebrow: text(block.eyebrow), heading: text(block.heading), body: block.body ? projectLexical(block.body) : undefined, image: image === undefined ? undefined : String(image) })
    }
    if (blockType === 'richText') return { ...base, content: projectLexical(block.content) }
    if (blockType === 'projectGrid') {
      const projects = Array.isArray(block.projects) ? block.projects.map(relationId).filter((id): id is number | string => id !== undefined).map(String) : []
      return defined({ ...base, heading: text(block.heading), projects })
    }
    if (blockType === 'media') {
      const asset = relationId(block.asset)
      if (asset === undefined) throw new APIError('El bloque media no tiene un recurso válido.', 400)
      mediaIds.push(asset)
      return defined({ ...base, asset: String(asset), caption: text(block.caption) })
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

export const createPagePreviewSnapshot = async ({ payload, req, pageId }: { payload: Payload; req: PayloadRequest; pageId: number | string }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const page = record(await payload.findByID({ collection: 'pages', id: pageId as number, draft: true, depth: 0, overrideAccess: false, req }))
  const brandId = relationId(page.brandProfile)
  if (brandId === undefined) throw new APIError('La página necesita un perfil de marca.', 400)
  const brand = await payload.findByID({ collection: 'brand-profiles', id: brandId as number, depth: 0, overrideAccess: false, req })
  const resolvedBrand = resolvePageBrand(brand, page.brandOverrides)
  const projected = projectLayout(page.layout)
  const mediaReferences = await Promise.all(projected.mediaIds.map(async (id) => {
    const media = record(await payload.findByID({ collection: 'media', id: id as number, depth: 0, overrideAccess: false, req }))
    return defined({ id: String(media.id), alt: text(media.alt), filename: text(media.filename), mimeType: text(media.mimeType), width: typeof media.width === 'number' ? media.width : undefined, height: typeof media.height === 'number' ? media.height : undefined })
  }))
  const updatedAt = text(page.updatedAt)
  if (!updatedAt) throw new APIError('La página no tiene una revisión actual verificable.', 400)
  const manifest = createPreviewManifest({
    source: { collection: 'pages', documentId: String(page.id), versionId: `current:${updatedAt}` },
    brandTokens: resolvedBrand,
    pageBlocks: projected.blocks,
    mediaReferences,
  })
  return payload.create({
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
}
