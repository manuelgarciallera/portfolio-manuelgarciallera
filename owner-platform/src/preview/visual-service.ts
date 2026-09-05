import { APIError, type Payload, type PayloadRequest } from 'payload'
import type { RichText } from '@payloadcms/richtext-lexical/react'
import { isOwner } from '../access/owner'
import { resolvePageBrand, type ResolvedBrand } from '../brand/inheritance'
import { normalizeMediaPlacement, type MediaPlacement } from '../media/placement'
import { presentPreviewAsset, type PreviewAsset } from '../media/placement-preview'
import { projectLexical } from './service'
import { createPreviewManifest } from './manifest'

export type PreviewText = Parameters<typeof RichText>[0]['data']
export type VisualBlock = {
  type: string; heading?: string; eyebrow?: string; content?: PreviewText; assetId?: string; caption?: string;
  placement?: MediaPlacement; featureKey?: string;
  projects?: { id: string; title: string; summary: string; assetId?: string }[];
}
export type PageVisualPreview = { id: string; title: string; updatedAt: string; status: string; blocks: VisualBlock[]; assets: Record<string, PreviewAsset>; brand: ResolvedBrand | null; warnings: string[] }
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const text = (value: unknown) => typeof value === 'string' ? value.slice(0, 10_000) : ''
const idOf = (value: unknown): string | undefined => {
  const id = typeof value === 'object' ? record(value).id : value
  return (typeof id === 'string' || typeof id === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(id)) ? String(id) : undefined
}

export const loadPageVisualPreview = async ({ payload, req, pageId }: { payload: Pick<Payload, 'findByID'>; req: PayloadRequest; pageId: string }): Promise<PageVisualPreview> => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (!idOf(pageId)) throw new APIError('Identificador no válido.', 400)
  const reads = new Map<string, Promise<Record<string, unknown>>>()
  const read = (collection: 'pages' | 'brand-profiles' | 'media' | 'media-placements' | 'projects', id: string) => {
    const key = `${collection}:${id}`
    if (!reads.has(key)) reads.set(key, payload.findByID({ collection, id, draft: true, depth: 0, overrideAccess: false, req }).then(record))
    return reads.get(key)!
  }
  const page = await read('pages', pageId)
  const source = record(page)
  const result: PageVisualPreview = { id: pageId, title: text(source.title), updatedAt: text(source.updatedAt), status: text(source._status), blocks: [], assets: {}, brand: null, warnings: [] }
  const brandId = idOf(source.brandProfile)
  if (brandId) {
    try { result.brand = resolvePageBrand(await read('brand-profiles', brandId), source.brandOverrides) }
    catch { result.warnings.push('No se pudo resolver la marca asignada. Se muestra una base neutra.') }
  } else result.warnings.push('Sin perfil de marca: se muestra una base neutra.')
  const mediaIds = new Set<string>()
  const media = (value: unknown) => {
    const id = idOf(value)
    if (id) mediaIds.add(id)
    if (mediaIds.size > 200) throw new APIError('La vista previa admite como máximo 200 medios.', 400)
    return id
  }
  const richText = (value: unknown): PreviewText | undefined => {
    if (value == null) return undefined
    // Bound the complete JSON tree before the recursive editorial projection.
    createPreviewManifest({ source: { collection: 'pages', documentId: pageId, versionId: 'visual' }, brandTokens: {}, pageBlocks: [value], mediaReferences: [] })
    const ids: Array<string | number> = []
    const projected = projectLexical(value, ids)
    ids.forEach(media)
    return projected as PreviewText
  }
  if (!Array.isArray(source.layout) || source.layout.length > 100) throw new APIError('El layout debe contener como máximo 100 bloques.', 400)
  const projectCount = source.layout.reduce((total, block) => total + (Array.isArray(record(block).projects) ? (record(block).projects as unknown[]).length : 0), 0)
  if (projectCount > 200) throw new APIError('La vista previa admite como máximo 200 referencias de proyecto.', 400)
  for (const raw of source.layout) {
    const block = record(raw)
    const item: VisualBlock = { type: text(block.blockType), heading: text(block.heading) }
    if (item.type === 'hero') Object.assign(item, { eyebrow: text(block.eyebrow), content: richText(block.body), assetId: media(block.image) })
    else if (item.type === 'richText') item.content = richText(block.content)
    else if (item.type === 'media') {
      item.assetId = media(block.asset)
      item.caption = text(block.caption)
      const placementId = idOf(block.placement)
      if (placementId) {
        try {
          const placementDoc = record(await read('media-placements', placementId))
          item.placement = normalizeMediaPlacement(placementDoc.placement)
          if (String(item.placement.asset) !== item.assetId) throw new Error('Different original')
        } catch { delete item.placement; result.warnings.push(`Bloque ${result.blocks.length + 1}: encuadre no disponible o asociado a otra imagen.`) }
      }
    } else if (item.type === 'projectGrid') {
      const projects = Array.isArray(block.projects) ? block.projects : []
      if (projects.length > 100) throw new APIError('Demasiados proyectos en la cuadrícula.', 400)
      item.projects = []
      for (const value of projects) {
        const id = idOf(value)
        if (!id) { result.warnings.push('Referencia de proyecto no válida.'); continue }
        try {
          const project = record(await read('projects', id))
          item.projects.push({ id, title: text(project.title), summary: text(project.summary), assetId: media(project.heroImage) })
        } catch { result.warnings.push(`No se pudo cargar el proyecto ${id}.`) }
      }
    } else if (item.type === 'customFeature') item.featureKey = text(block.featureKey)
    else result.warnings.push(`Bloque ${result.blocks.length + 1}: tipo no compatible con esta vista previa.`)
    result.blocks.push(item)
  }
  for (const id of mediaIds) {
    try { result.assets[id] = presentPreviewAsset(await read('media', id), id) }
    catch { result.warnings.push(`No se pudo cargar el medio ${id}.`) }
  }
  return result
}
