import { createHash } from 'node:crypto'

import { createDraftCapsule, type DraftPageState } from '../recovery/capsule'
import { hashPublicationArtifact, type PublicationArtifact } from './artifact'
import { hashPublicationBundle, type PublicationBundle } from './bundle'

export type PublicationExportPage = Readonly<{
  draftHash: string
  pageId: string
  position: number
  previewHash: string
  sourceVersionId: string
  state: DraftPageState
}>

export type PublicationExport = Readonly<{
  artifactHash: string
  bundleHash: string
  exportedAt: string
  hash: string
  pageCount: number
  pages: readonly PublicationExportPage[]
  reviewHash: string
  schemaVersion: 1
}>

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/
const EXPORT_FIELDS = new Set(['artifactHash', 'bundleHash', 'exportedAt', 'hash', 'pageCount', 'pages', 'reviewHash', 'schemaVersion'])
const PAGE_FIELDS = new Set(['draftHash', 'pageId', 'position', 'previewHash', 'sourceVersionId', 'state'])
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const exactFields = (value: Record<string, unknown>, allowed: Set<string>, label: string) => {
  const unknown = Object.keys(value).find((key) => !allowed.has(key))
  if (unknown) throw new TypeError(`${label} contiene un campo no permitido: ${unknown}.`)
}
const validHash = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) throw new TypeError(`${label} no es válido.`)
  return value
}
const textValue = (value: unknown, label: string, maxLength: number): string => {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > maxLength) throw new TypeError(`${label} no es válido.`)
  return value
}
const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`
}
const digest = (value: unknown) => {
  const serialized = stable(value)
  if (Buffer.byteLength(serialized, 'utf8') > 5 * 1_024 * 1_024) throw new TypeError('La exportación supera el tamaño permitido.')
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`
}
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }
const exactIso = (value: unknown): value is string => typeof value === 'string' && (() => { try { return new Date(value).toISOString() === value } catch { return false } })()

export const createPublicationExport = ({ artifact, bundle, exportedAt }: { artifact: PublicationArtifact; bundle: PublicationBundle; exportedAt: string }): PublicationExport => {
  const artifactHash = hashPublicationArtifact(artifact)
  const bundleHash = hashPublicationBundle(bundle)
  if (artifact.bundleHash !== bundleHash || artifact.pageCount !== bundle.entries.length) throw new TypeError('El artefacto no coincide con el paquete o su recuento de páginas.')
  if (!exactIso(exportedAt)) throw new TypeError('La fecha de exportación no es válida.')
  const pages = bundle.entries.map((entry) => ({
    draftHash: entry.draftHash, pageId: entry.pageId, position: entry.position, previewHash: entry.previewHash,
    sourceVersionId: entry.sourceVersionId, state: entry.capsule.state,
  }))
  const withoutHash = { artifactHash, bundleHash, exportedAt, pageCount: pages.length, pages, reviewHash: artifact.reviewHash, schemaVersion: 1 as const }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationExport = (value: PublicationExport): string => {
  return verifyPublicationExport(value).hash
}

export const verifyPublicationExport = (input: unknown): PublicationExport => {
  if (!isRecord(input)) throw new TypeError('La exportación debe ser un objeto.')
  exactFields(input, EXPORT_FIELDS, 'La exportación')
  if (input.schemaVersion !== 1) throw new TypeError('La versión de esquema de la exportación no es válida.')
  if (!exactIso(input.exportedAt)) throw new TypeError('La fecha de exportación no es válida.')
  validHash(input.artifactHash, 'El hash del artefacto')
  validHash(input.bundleHash, 'El hash del paquete')
  validHash(input.reviewHash, 'El hash de la revisión')
  const storedHash = validHash(input.hash, 'El hash de la exportación')
  if (!Number.isInteger(input.pageCount) || (input.pageCount as number) < 1 || (input.pageCount as number) > 100) throw new TypeError('El recuento de páginas de la exportación no es válido.')
  if (!Array.isArray(input.pages) || input.pages.length !== input.pageCount) throw new TypeError('El recuento de páginas de la exportación no coincide.')

  const pageIds = new Set<string>()
  const slugs = new Set<string>()
  input.pages.forEach((page, position) => {
    if (!isRecord(page)) throw new TypeError('Cada página exportada debe ser un objeto.')
    exactFields(page, PAGE_FIELDS, 'La página exportada')
    if (page.position !== position) throw new TypeError('La posición no coincide con el orden de la exportación.')
    const pageId = textValue(page.pageId, 'La página', 200)
    const sourceVersionId = textValue(page.sourceVersionId, 'La versión de origen', 300)
    if (pageIds.has(pageId)) throw new TypeError('La exportación contiene una página duplicada.')
    pageIds.add(pageId)
    const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: pageId, versionId: sourceVersionId }, state: page.state })
    if (validHash(page.draftHash, 'El hash del borrador') !== capsule.hash) throw new TypeError('El hash del borrador no coincide con el estado exportado.')
    validHash(page.previewHash, 'El hash visual')
    const slug = (capsule.state as DraftPageState).slug
    if (slugs.has(slug)) throw new TypeError('La exportación contiene un slug duplicado.')
    slugs.add(slug)
  })

  const { hash, ...withoutHash } = input
  const expected = digest(withoutHash)
  if (storedHash !== expected || hash !== expected) throw new TypeError('El hash no coincide con la exportación de publicación.')
  return input as unknown as PublicationExport
}
