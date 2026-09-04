import { createHash } from 'node:crypto'

export const PREVIEW_MANIFEST_SCHEMA_VERSION = 1 as const
export const PREVIEW_LIMITS = Object.freeze({
  maxDepth: 32,
  maxNodes: 10_000,
  maxArrayLength: 1_000,
  maxStringLength: 100_000,
  maxSerializedBytes: 1_048_576,
})

type JSONPrimitive = boolean | null | number | string
export type CanonicalJSON = JSONPrimitive | CanonicalJSON[] | { [key: string]: CanonicalJSON }
export type PreviewManifestInput = {
  source: { collection: 'pages'; documentId: string; versionId: string }
  brandTokens: Record<string, unknown>
  pageBlocks: unknown[]
  mediaReferences: unknown[]
}
export type PreviewManifest = {
  schemaVersion: typeof PREVIEW_MANIFEST_SCHEMA_VERSION
  source: { collection: 'pages'; documentId: string; versionId: string }
  brandTokens: Readonly<Record<string, CanonicalJSON>>
  pageBlocks: readonly CanonicalJSON[]
  mediaReferences: readonly CanonicalJSON[]
  hash: string
}

type Budget = { nodes: number }
const canonicalize = (value: unknown, ancestors: Set<object>, path: string, depth: number, budget: Budget): CanonicalJSON => {
  if (depth > PREVIEW_LIMITS.maxDepth) throw new TypeError(`Profundidad máxima excedida en ${path}.`)
  budget.nodes += 1
  if (budget.nodes > PREVIEW_LIMITS.maxNodes) throw new TypeError('El manifiesto excede el máximo de nodos.')
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.length > PREVIEW_LIMITS.maxStringLength) throw new TypeError(`Texto demasiado largo en ${path}.`)
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`El manifiesto solo admite números JSON finitos en ${path}.`)
    return Object.is(value, -0) ? 0 : value
  }
  if (typeof value !== 'object') throw new TypeError(`El manifiesto solo admite valores JSON en ${path}.`)
  if (ancestors.has(value)) throw new TypeError(`Referencia cíclica rechazada en ${path}.`)
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
    throw new TypeError(`El manifiesto solo admite objetos JSON planos en ${path}.`)
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) {
    if (value.length > PREVIEW_LIMITS.maxArrayLength) throw new TypeError(`Lista demasiado larga en ${path}.`)
    return value.map((entry, index) => canonicalize(entry, next, `${path}[${index}]`, depth + 1, budget))
  }
  const result = Object.create(null) as Record<string, CanonicalJSON>
  for (const key of Object.keys(value).sort())
    result[key] = canonicalize((value as Record<string, unknown>)[key], next, `${path}.${key}`, depth + 1, budget)
  return result
}

const stringify = (value: CanonicalJSON): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stringify(value[key])}`).join(',')}}`
}
const canonicalDocument = (value: unknown): CanonicalJSON => canonicalize(value, new Set(), '$', 0, { nodes: 0 })
const serializeBounded = (value: CanonicalJSON): string => {
  const serialized = stringify(value)
  if (Buffer.byteLength(serialized, 'utf8') > PREVIEW_LIMITS.maxSerializedBytes)
    throw new TypeError('El manifiesto excede el máximo de bytes serializados.')
  return serialized
}
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
const digest = (value: CanonicalJSON): string => `sha256:${createHash('sha256').update(serializeBounded(value)).digest('hex')}`

export const createPreviewManifest = (input: PreviewManifestInput): PreviewManifest => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('La entrada debe ser JSON.')
  const candidate = canonicalDocument({
    schemaVersion: PREVIEW_MANIFEST_SCHEMA_VERSION,
    source: input.source,
    brandTokens: input.brandTokens,
    pageBlocks: input.pageBlocks,
    mediaReferences: input.mediaReferences,
  }) as unknown as Omit<PreviewManifest, 'hash'>
  const hash = digest(candidate as unknown as CanonicalJSON)
  return deepFreeze({ ...candidate, hash } as PreviewManifest)
}

export const hashPreviewManifest = (manifest: PreviewManifest): string => {
  const { hash, ...withoutHash } = manifest
  const canonical = canonicalDocument(withoutHash)
  const expected = digest(canonical)
  if (hash !== expected) throw new TypeError('El hash no coincide con el manifiesto canónico.')
  return expected
}
