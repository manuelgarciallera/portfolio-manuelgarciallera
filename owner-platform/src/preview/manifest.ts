import { createHash } from 'node:crypto'

export const PREVIEW_MANIFEST_SCHEMA_VERSION = 1 as const

type JSONPrimitive = boolean | null | number | string
export type CanonicalJSON = JSONPrimitive | CanonicalJSON[] | { [key: string]: CanonicalJSON }

export type PreviewManifestInput = {
  source: {
    collection: string
    documentId: number | string
    versionId: number | string
  }
  brandTokens: Record<string, unknown>
  pageBlocks: unknown[]
  mediaReferences: Array<number | string>
  motion: Record<string, unknown>
}

export type PreviewManifest = {
  schemaVersion: typeof PREVIEW_MANIFEST_SCHEMA_VERSION
  source: {
    collection: string
    documentId: string
    versionId: string
  }
  brandTokens: Readonly<Record<string, CanonicalJSON>>
  pageBlocks: readonly CanonicalJSON[]
  mediaReferences: readonly string[]
  motion: Readonly<Record<string, CanonicalJSON>>
  hash: string
}

const secretKeys = /(?:secret|password|passphrase|credential|authorization|cookie|session|privatekey|token|apikey)/i
const executableKeys = /(?:html|css|javascript|script|style|srcdoc|dangerouslysetinnerhtml|code)$/i
const prototypeKeys = new Set(['__proto__', 'prototype', 'constructor'])
const activeContent = /(?:<\s*script\b|javascript\s*:|data\s*:\s*text\/html|on(?:click|load|error|mouseover|focus|submit)\s*=)/i

const normalizedKey = (key: string): string => key.replace(/[^a-z0-9]/gi, '').toLowerCase()

const canonicalize = (value: unknown, ancestors: Set<object>, path: string): CanonicalJSON => {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    if (typeof value === 'string' && activeContent.test(value))
      throw new TypeError(`Contenido ejecutable rechazado en ${path}.`)
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`El manifiesto solo admite números JSON finitos en ${path}.`)
    return Object.is(value, -0) ? 0 : value
  }
  if (typeof value !== 'object')
    throw new TypeError(`El manifiesto solo admite valores JSON en ${path}.`)

  if (ancestors.has(value)) throw new TypeError(`Referencia cíclica rechazada en ${path}.`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value))
    throw new TypeError(`El manifiesto solo admite objetos JSON planos en ${path}.`)

  const nextAncestors = new Set(ancestors).add(value)
  if (Array.isArray(value))
    return value.map((entry, index) => canonicalize(entry, nextAncestors, `${path}[${index}]`))

  const result = Object.create(null) as Record<string, CanonicalJSON>
  for (const key of Object.keys(value).sort()) {
    const safeKey = normalizedKey(key)
    if (prototypeKeys.has(key.toLowerCase())) throw new TypeError(`Clave de prototipo rechazada en ${path}.`)
    const isFixedBrandTokenContainer = path === '$' && key === 'brandTokens'
    if (!isFixedBrandTokenContainer && secretKeys.test(safeKey))
      throw new TypeError(`Clave secreta o credencial rechazada en ${path}.${key}.`)
    if (executableKeys.test(safeKey) || /^on[a-z]+$/.test(safeKey))
      throw new TypeError(`Configuración ejecutable rechazada en ${path}.${key}.`)
    result[key] = canonicalize((value as Record<string, unknown>)[key], nextAncestors, `${path}.${key}`)
  }
  return result
}

const canonicalStringify = (value: CanonicalJSON): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
    .join(',')}}`
}

const digest = (manifestWithoutHash: Omit<PreviewManifest, 'hash'>): string =>
  `sha256:${createHash('sha256').update(canonicalStringify(manifestWithoutHash as unknown as CanonicalJSON)).digest('hex')}`

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

const assertNonEmpty = (value: unknown, label: string): string => {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new TypeError(`${label} es obligatorio.`)
  return normalized
}

export const createPreviewManifest = (input: PreviewManifestInput): PreviewManifest => {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TypeError('La entrada del manifiesto debe ser un objeto JSON.')
  if (Object.hasOwn(input, 'hash')) throw new TypeError('El hash se deriva internamente y no puede proporcionarse.')
  if (!input.source || typeof input.source !== 'object') throw new TypeError('La procedencia es obligatoria.')
  if (!Array.isArray(input.pageBlocks) || !Array.isArray(input.mediaReferences))
    throw new TypeError('Los bloques y referencias multimedia deben ser listas JSON.')

  const withoutHash = canonicalize(
    {
      schemaVersion: PREVIEW_MANIFEST_SCHEMA_VERSION,
      source: {
        collection: assertNonEmpty(input.source.collection, 'source.collection'),
        documentId: assertNonEmpty(input.source.documentId, 'source.documentId'),
        versionId: assertNonEmpty(input.source.versionId, 'source.versionId'),
      },
      brandTokens: input.brandTokens,
      pageBlocks: input.pageBlocks,
      mediaReferences: input.mediaReferences.map((value) => assertNonEmpty(value, 'mediaReference')),
      motion: input.motion,
    },
    new Set(),
    '$',
  ) as unknown as Omit<PreviewManifest, 'hash'>
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) } as PreviewManifest)
}

export const hashPreviewManifest = (manifest: PreviewManifest): string => {
  if (!manifest || typeof manifest !== 'object') throw new TypeError('El manifiesto debe ser un objeto JSON.')
  const { hash, ...candidate } = manifest
  const canonical = canonicalize(candidate, new Set(), '$') as unknown as Omit<PreviewManifest, 'hash'>
  const expected = digest(canonical)
  if (hash !== expected) throw new TypeError('El hash del manifiesto no coincide con su contenido canónico.')
  return expected
}
