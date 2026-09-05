import { createHash } from 'node:crypto'

import type { RecoveryJSON } from '../recovery/capsule'
import { hashPublicationArtifact, type PublicationArtifact } from './artifact'
import { hashPublicationBundle, type PublicationBundle } from './bundle'

export type PublicationExportPage = Readonly<{
  draftHash: string
  pageId: string
  position: number
  previewHash: string
  sourceVersionId: string
  state: RecoveryJSON
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
    sourceVersionId: entry.sourceVersionId, state: entry.capsule.state as unknown as RecoveryJSON,
  }))
  const withoutHash = { artifactHash, bundleHash, exportedAt, pageCount: pages.length, pages, reviewHash: artifact.reviewHash, schemaVersion: 1 as const }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationExport = (value: PublicationExport): string => {
  const { hash, ...withoutHash } = value
  if (value.pageCount !== value.pages.length) throw new TypeError('El recuento de páginas de la exportación no coincide.')
  const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con la exportación de publicación.')
  return expected
}
