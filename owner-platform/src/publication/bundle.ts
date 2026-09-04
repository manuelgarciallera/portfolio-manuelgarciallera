import { createHash } from 'node:crypto'

import { hashDraftCapsule, type DraftCapsule } from '../recovery/capsule'

export const PUBLICATION_BUNDLE_SCHEMA_VERSION = 1 as const
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/
const ENTRY_FIELDS = new Set(['capsule', 'draftHash', 'pageId', 'position', 'previewHash', 'releaseId', 'sourceVersionId'])
const MAX_ENTRIES = 100
const MAX_BYTES = 5 * 1_024 * 1_024

export type PublicationBundleEntry = Readonly<{
  capsule: DraftCapsule
  draftHash: string
  pageId: string
  position: number
  previewHash: string
  releaseId: string | number
  sourceVersionId: string
}>
export type PublicationBundle = Readonly<{
  entries: readonly PublicationBundleEntry[]
  hash: string
  schemaVersion: typeof PUBLICATION_BUNDLE_SCHEMA_VERSION
}>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) throw new TypeError(`${label} no es válido.`)
  return value
}

const hash = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) throw new TypeError(`${label} no es válido.`)
  return value
}

const canonicalStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`).join(',')}}`
}

const digest = (value: unknown): string => {
  const serialized = canonicalStringify(value)
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BYTES) throw new TypeError('El paquete supera el tamaño permitido.')
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`
}

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

export const createPublicationBundle = (input: unknown): PublicationBundle => {
  if (!isRecord(input)) throw new TypeError('El paquete debe ser un objeto.')
  const unknown = Object.keys(input).find((key) => key !== 'entries')
  if (unknown) throw new TypeError(`El paquete contiene un campo no permitido: ${unknown}.`)
  if (!Array.isArray(input.entries) || input.entries.length < 1 || input.entries.length > MAX_ENTRIES) {
    throw new TypeError('El paquete debe contener entre una y cien páginas.')
  }
  const pageIds = new Set<string>()
  const entries = input.entries.map((value, index): PublicationBundleEntry => {
    if (!isRecord(value)) throw new TypeError('Cada entrada debe ser un objeto.')
    const unknownEntry = Object.keys(value).find((key) => !ENTRY_FIELDS.has(key))
    if (unknownEntry) throw new TypeError(`La entrada contiene un campo no permitido: ${unknownEntry}.`)
    if (value.position !== index) throw new TypeError('La posición no coincide con el orden del paquete.')
    const capsule = value.capsule as DraftCapsule
    const draftHash = hashDraftCapsule(capsule)
    if (value.draftHash !== draftHash) throw new TypeError('El hash del borrador no coincide con su cápsula.')
    const pageId = String(relation(value.pageId, 'La página'))
    if (capsule.source.documentId !== pageId) throw new TypeError('La procedencia de la cápsula no coincide con la página.')
    if (value.sourceVersionId !== capsule.source.versionId) throw new TypeError('La revisión de la cápsula no coincide.')
    if (pageIds.has(pageId)) throw new TypeError('El paquete contiene una página duplicada.')
    pageIds.add(pageId)
    return {
      capsule,
      draftHash,
      pageId,
      position: index,
      previewHash: hash(value.previewHash, 'El hash visual'),
      releaseId: relation(value.releaseId, 'La versión'),
      sourceVersionId: capsule.source.versionId,
    }
  })
  const withoutHash = { entries, schemaVersion: PUBLICATION_BUNDLE_SCHEMA_VERSION }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationBundle = (bundle: PublicationBundle): string => {
  const { hash: stored, ...withoutHash } = bundle
  const expected = digest(withoutHash)
  if (stored !== expected) throw new TypeError('El hash no coincide con el paquete de publicación.')
  for (const entry of bundle.entries) hashDraftCapsule(entry.capsule)
  return expected
}
