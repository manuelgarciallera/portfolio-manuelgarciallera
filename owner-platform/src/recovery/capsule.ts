import { createHash } from 'node:crypto'

export const DRAFT_CAPSULE_SCHEMA_VERSION = 1 as const
export const DRAFT_CAPSULE_LIMITS = Object.freeze({
  maxArrayLength: 1_000,
  maxDepth: 32,
  maxNodes: 10_000,
  maxSerializedBytes: 1_048_576,
  maxStringLength: 100_000,
})

type JSONPrimitive = boolean | null | number | string
export type RecoveryJSON = JSONPrimitive | RecoveryJSON[] | { [key: string]: RecoveryJSON }
export type DraftPageState = Readonly<{
  brandOverrides?: RecoveryJSON
  brandProfile: string | number
  layout: readonly RecoveryJSON[]
  seo?: RecoveryJSON
  slug: string
  title: string
}>
export type DraftCapsule = Readonly<{
  hash: string
  schemaVersion: typeof DRAFT_CAPSULE_SCHEMA_VERSION
  source: Readonly<{ collection: 'pages'; documentId: string; versionId: string }>
  state: DraftPageState
}>

const blockedKey = /(?:^__proto__$|^prototype$|^constructor$|^script$|^javascript$|^html$|^css$|^on[a-z]+$|secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session)/i
const stateFields = new Set(['brandOverrides', 'brandProfile', 'layout', 'seo', 'slug', 'title'])
const sourceFields = new Set(['collection', 'documentId', 'versionId'])
type Budget = { nodes: number }

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const canonicalize = (
  value: unknown,
  ancestors: Set<object>,
  depth: number,
  budget: Budget,
): RecoveryJSON => {
  if (depth > DRAFT_CAPSULE_LIMITS.maxDepth) throw new TypeError('La cápsula supera la profundidad permitida.')
  budget.nodes += 1
  if (budget.nodes > DRAFT_CAPSULE_LIMITS.maxNodes) throw new TypeError('La cápsula supera el máximo de nodos.')
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.length > DRAFT_CAPSULE_LIMITS.maxStringLength) throw new TypeError('La cápsula contiene texto demasiado largo.')
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('La cápsula solo admite números JSON finitos.')
    return Object.is(value, -0) ? 0 : value
  }
  if (!value || typeof value !== 'object') throw new TypeError('La cápsula solo admite datos JSON.')
  if (ancestors.has(value)) throw new TypeError('La cápsula contiene una referencia cíclica.')
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || value.length > DRAFT_CAPSULE_LIMITS.maxArrayLength) {
      throw new TypeError('La lista de la cápsula no está permitida.')
    }
    return value.map((entry) => canonicalize(entry, next, depth + 1, budget))
  }
  if (!isPlainRecord(value)) throw new TypeError('La cápsula solo admite objetos JSON planos.')
  const result = Object.create(null) as Record<string, RecoveryJSON>
  for (const key of Object.keys(value).sort()) {
    if (blockedKey.test(key)) throw new TypeError(`La clave ${key} no está permitida.`)
    result[key] = canonicalize(value[key], next, depth + 1, budget)
  }
  return result
}

const stringify = (value: RecoveryJSON): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stringify(value[key])}`).join(',')}}`
}

const digest = (value: RecoveryJSON): string => {
  const serialized = stringify(value)
  if (Buffer.byteLength(serialized, 'utf8') > DRAFT_CAPSULE_LIMITS.maxSerializedBytes) {
    throw new TypeError('La cápsula supera el máximo de bytes serializados.')
  }
  return `sha256:${createHash('sha256').update(serialized).digest('hex')}`
}

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

const text = (value: unknown, label: string, maxLength: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new TypeError(`${label} no es válido.`)
  }
  return value.trim()
}

const relation = (value: unknown): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) {
    throw new TypeError('El perfil de marca no es una relación válida.')
  }
  return value
}

export const createDraftCapsule = (input: unknown): DraftCapsule => {
  if (!isPlainRecord(input) || !isPlainRecord(input.source) || !isPlainRecord(input.state)) {
    throw new TypeError('La cápsula de borrador no es válida.')
  }
  const unknownSource = Object.keys(input.source).find((key) => !sourceFields.has(key))
  const unknownState = Object.keys(input.state).find((key) => !stateFields.has(key))
  if (unknownSource || unknownState) throw new TypeError(`La cápsula contiene un campo no permitido: ${unknownSource ?? unknownState}.`)
  if (input.source.collection !== 'pages') throw new TypeError('La colección de origen no está permitida.')
  if (!Array.isArray(input.state.layout)) throw new TypeError('El layout debe ser una lista JSON.')
  const canonicalState = canonicalize({
    ...(Object.hasOwn(input.state, 'brandOverrides') ? { brandOverrides: input.state.brandOverrides } : {}),
    brandProfile: relation(input.state.brandProfile),
    layout: input.state.layout,
    ...(Object.hasOwn(input.state, 'seo') ? { seo: input.state.seo } : {}),
    slug: text(input.state.slug, 'El slug', 200),
    title: text(input.state.title, 'El título', 200),
  }, new Set(), 0, { nodes: 0 }) as unknown as DraftPageState
  const withoutHash = canonicalize({
    schemaVersion: DRAFT_CAPSULE_SCHEMA_VERSION,
    source: {
      collection: 'pages',
      documentId: text(input.source.documentId, 'El documento', 200),
      versionId: text(input.source.versionId, 'La versión', 300),
    },
    state: canonicalState,
  }, new Set(), 0, { nodes: 0 }) as unknown as Omit<DraftCapsule, 'hash'>
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash as unknown as RecoveryJSON) } as DraftCapsule)
}

export const hashDraftCapsule = (capsule: DraftCapsule): string => {
  const { hash, ...withoutHash } = capsule
  const expected = digest(canonicalize(withoutHash, new Set(), 0, { nodes: 0 }))
  if (hash !== expected) throw new TypeError('El hash no coincide con la cápsula canónica.')
  return expected
}
