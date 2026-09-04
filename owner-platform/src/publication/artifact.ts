import { createHash } from 'node:crypto'

export const PUBLICATION_ARTIFACT_SCHEMA_VERSION = 1 as const
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/
const FIELDS = new Set(['bundleHash', 'bundleId', 'pageCount', 'reviewHash', 'reviewId'])

export type PublicationArtifact = Readonly<{
  bundleHash: string
  bundleId: string | number
  hash: string
  pageCount: number
  reviewHash: string
  reviewId: string | number
  schemaVersion: typeof PUBLICATION_ARTIFACT_SCHEMA_VERSION
}>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) throw new TypeError(`${label} no es válido.`)
  return value
}
const hash = (value: unknown): string => {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) throw new TypeError('El hash no es válido.')
  return value
}
const canonicalStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`).join(',')}}`
}
const digest = (value: unknown): string => `sha256:${createHash('sha256').update(canonicalStringify(value)).digest('hex')}`

export const createPublicationArtifact = (input: unknown): PublicationArtifact => {
  if (!isRecord(input)) throw new TypeError('El artefacto debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => !FIELDS.has(key))
  if (unknown) throw new TypeError(`El artefacto contiene un campo no permitido: ${unknown}.`)
  if (!Number.isInteger(input.pageCount) || (input.pageCount as number) < 1 || (input.pageCount as number) > 100) throw new TypeError('El recuento de páginas no es válido.')
  const withoutHash = {
    bundleHash: hash(input.bundleHash), bundleId: relation(input.bundleId, 'El paquete'), pageCount: input.pageCount as number,
    reviewHash: hash(input.reviewHash), reviewId: relation(input.reviewId, 'La revisión'), schemaVersion: PUBLICATION_ARTIFACT_SCHEMA_VERSION,
  }
  return Object.freeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationArtifact = (artifact: PublicationArtifact): string => {
  const { hash, ...withoutHash } = artifact; const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con el artefacto de publicación.')
  return expected
}
