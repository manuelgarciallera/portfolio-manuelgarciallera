import { createHash } from 'node:crypto'

export const PUBLICATION_REVIEW_SCHEMA_VERSION = 1 as const
export const PUBLICATION_REVIEW_DECISIONS = ['approved', 'rejected'] as const
export type PublicationReviewDecision = (typeof PUBLICATION_REVIEW_DECISIONS)[number]

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/
const FIELDS = new Set(['bundleHash', 'bundleId', 'decision', 'decidedAt', 'decidedBy', 'note'])

export type PublicationReview = Readonly<{
  bundleHash: string
  bundleId: string | number
  decision: PublicationReviewDecision
  decidedAt: string
  decidedBy: string | number
  hash: string
  note?: string
  schemaVersion: typeof PUBLICATION_REVIEW_SCHEMA_VERSION
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) throw new TypeError(`${label} no es válido.`)
  return value
}

const canonicalStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`).join(',')}}`
}

const digest = (value: unknown): string => `sha256:${createHash('sha256').update(canonicalStringify(value)).digest('hex')}`

export const createPublicationReview = (input: unknown): PublicationReview => {
  if (!isRecord(input)) throw new TypeError('La revisión debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => !FIELDS.has(key))
  if (unknown) throw new TypeError(`La revisión contiene un campo no permitido: ${unknown}.`)
  if (typeof input.bundleHash !== 'string' || !HASH_PATTERN.test(input.bundleHash)) throw new TypeError('El hash del paquete no es válido.')
  if (!PUBLICATION_REVIEW_DECISIONS.includes(input.decision as PublicationReviewDecision)) throw new TypeError('La decisión no es válida.')
  if (typeof input.decidedAt !== 'string' || Number.isNaN(Date.parse(input.decidedAt))) throw new TypeError('La fecha de decisión no es válida.')
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.trim().length > 1_000)) throw new TypeError('La nota no es válida.')
  const withoutHash = {
    bundleHash: input.bundleHash,
    bundleId: relation(input.bundleId, 'El paquete'),
    decision: input.decision as PublicationReviewDecision,
    decidedAt: new Date(input.decidedAt).toISOString(),
    decidedBy: relation(input.decidedBy, 'El owner'),
    ...(typeof input.note === 'string' && input.note.trim() ? { note: input.note.trim() } : {}),
    schemaVersion: PUBLICATION_REVIEW_SCHEMA_VERSION,
  }
  return Object.freeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationReview = (review: PublicationReview): string => {
  const { hash, ...withoutHash } = review
  const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con la revisión de publicación.')
  return expected
}
