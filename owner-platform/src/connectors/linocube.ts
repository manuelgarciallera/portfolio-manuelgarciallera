import { createPreviewManifest, hashPreviewManifest, PREVIEW_LIMITS, type PreviewManifest } from '../preview/manifest'

export const LINOCUBE_MANIFEST_SCHEMA_VERSION = 1 as const
export type PublishedManifest = Readonly<{ schemaVersion: 1; manifestVersion: number; digest: string; manifest: PreviewManifest }>
export type PublishedManifestConsumerResult = Readonly<{ ok: true; receiptId: string }> | Readonly<{ ok: false; code: 'disabled' | 'invalid_manifest' | 'consumer_error' }>

/**
 * Digest validation provides content integrity/addressing only, never sender authenticity.
 * Any future enabled consumer must additionally require a signature or trusted channel.
 */
export interface PublishedManifestConsumer {
  readonly enabled: boolean
  readonly authenticity: 'disabled' | 'signature-or-trusted-channel-required'
  consume(envelope: PublishedManifest): Promise<PublishedManifestConsumerResult>
}

const digestPattern = /^sha256:[a-f0-9]{64}$/
const secretKey = /secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session/i
const exactKeys = (value: Record<string, unknown>, allowed: readonly string[], label: string): void => {
  const actual = Object.keys(value)
  if (actual.length !== allowed.length || actual.some((key) => !allowed.includes(key))) throw new TypeError(`${label} contiene una propiedad no permitida.`)
}
function assertPlainDataRecord(value: unknown, label: string, required: readonly string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} debe ser un objeto plano.`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} debe ser un objeto plano.`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const key of required) if (!Object.hasOwn(descriptors, key)) throw new TypeError(`${label} requiere propiedades propias.`)
  for (const descriptor of Object.values(descriptors)) if (!Object.hasOwn(descriptor, 'value')) throw new TypeError(`${label} solo admite datos planos, no getters.`)
}
function assertPlainArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} debe ser una lista.`)
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} no admite un prototipo personalizado.`)
  if (Object.getOwnPropertySymbols(value).length) throw new TypeError(`${label} no admite propiedades de símbolos.`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (key !== 'length' && !/^(0|[1-9]\d*)$/.test(key)) throw new TypeError(`${label} contiene una propiedad no permitida.`)
    if (key !== 'length' && !Object.hasOwn(descriptor, 'value')) throw new TypeError(`${label} solo admite datos planos, no getters.`)
  }
}
const assertBoundedPlainData = (root: unknown): void => {
  const stack: Array<{ value: unknown; depth: number; ancestors: Set<object> }> = [{ value: root, depth: 0, ancestors: new Set() }]
  let nodes = 0
  while (stack.length) {
    const { value, depth, ancestors } = stack.pop() as (typeof stack)[number]
    if (depth > PREVIEW_LIMITS.maxDepth) throw new TypeError('La profundidad máxima del manifiesto ha sido excedida.')
    nodes += 1
    if (nodes > PREVIEW_LIMITS.maxNodes) throw new TypeError('El manifiesto excede el máximo de nodos.')
    if (typeof value === 'string') { if (value.length > PREVIEW_LIMITS.maxStringLength) throw new TypeError('Texto demasiado largo.'); continue }
    if (value === null || typeof value === 'boolean') continue
    if (typeof value === 'number') { if (!Number.isFinite(value)) throw new TypeError('Número JSON no válido.'); continue }
    if (!value || typeof value !== 'object') throw new TypeError('Solo se admiten datos JSON.')
    if (ancestors.has(value)) throw new TypeError('Referencia cíclica rechazada.')
    const next = new Set(ancestors).add(value)
    if (Array.isArray(value)) {
      assertPlainArray(value, 'La lista del manifiesto')
      if (value.length > PREVIEW_LIMITS.maxArrayLength) throw new TypeError('Lista demasiado larga.')
      for (let index = value.length - 1; index >= 0; index -= 1) stack.push({ value: value[index], depth: depth + 1, ancestors: next })
    } else {
      assertPlainDataRecord(value, 'El contenido', [])
      for (const [key, child] of Object.entries(value)) { if (secretKey.test(key)) throw new TypeError('El manifiesto contiene una clave secreta.'); stack.push({ value: child, depth: depth + 1, ancestors: next }) }
    }
  }
  const serialized = JSON.stringify(root)
  if (Buffer.byteLength(serialized, 'utf8') > PREVIEW_LIMITS.maxSerializedBytes) throw new TypeError('El manifiesto excede el máximo de bytes.')
}
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }

export const validatePublishedManifest = (input: unknown): PublishedManifest => {
  assertPlainDataRecord(input, 'El sobre Linocube', ['schemaVersion', 'manifestVersion', 'digest', 'manifest'])
  exactKeys(input, ['schemaVersion', 'manifestVersion', 'digest', 'manifest'], 'El sobre Linocube')
  if (input.schemaVersion !== LINOCUBE_MANIFEST_SCHEMA_VERSION) throw new TypeError('Versión de schema Linocube no soportada.')
  if (!Number.isSafeInteger(input.manifestVersion) || (input.manifestVersion as number) < 1) throw new TypeError('La versión del manifiesto debe ser un entero positivo.')
  if (typeof input.digest !== 'string' || !digestPattern.test(input.digest)) throw new TypeError('El digest no es válido.')
  assertPlainDataRecord(input.manifest, 'El manifiesto', ['schemaVersion', 'source', 'brandTokens', 'pageBlocks', 'mediaReferences', 'hash'])
  exactKeys(input.manifest, ['schemaVersion', 'source', 'brandTokens', 'pageBlocks', 'mediaReferences', 'hash', ...(Object.hasOwn(input.manifest, 'pageTitle') ? ['pageTitle'] : [])], 'El manifiesto')
  if (input.manifest.schemaVersion !== 1) throw new TypeError('Versión del manifiesto no soportada.')
  assertPlainDataRecord(input.manifest.source, 'Source', ['collection', 'documentId', 'versionId'])
  exactKeys(input.manifest.source, ['collection', 'documentId', 'versionId'], 'Source')
  if (input.manifest.source.collection !== 'pages' || typeof input.manifest.source.documentId !== 'string' || !input.manifest.source.documentId || typeof input.manifest.source.versionId !== 'string' || !input.manifest.source.versionId) throw new TypeError('Source del manifiesto no válido.')
  assertPlainDataRecord(input.manifest.brandTokens, 'Brand tokens', [])
  assertPlainArray(input.manifest.pageBlocks, 'Los bloques')
  assertPlainArray(input.manifest.mediaReferences, 'Los medios')
  if (typeof input.manifest.hash !== 'string' || !digestPattern.test(input.manifest.hash)) throw new TypeError('El hash del manifiesto no es válido.')
  assertBoundedPlainData(input.manifest.brandTokens)
  assertBoundedPlainData(input.manifest.pageBlocks)
  assertBoundedPlainData(input.manifest.mediaReferences)
  const projected = createPreviewManifest({ source: input.manifest.source as PreviewManifest['source'], pageTitle: input.manifest.pageTitle as string | undefined, brandTokens: input.manifest.brandTokens, pageBlocks: input.manifest.pageBlocks, mediaReferences: input.manifest.mediaReferences })
  if (projected.hash !== input.manifest.hash || hashPreviewManifest(input.manifest as unknown as PreviewManifest) !== input.digest) throw new TypeError('El hash no coincide con el manifiesto.')
  if (input.digest !== input.manifest.hash) throw new TypeError('El digest no coincide con el manifiesto.')
  return deepFreeze(structuredClone(input) as PublishedManifest)
}

export const createDisabledLinocubeConsumer = (): PublishedManifestConsumer => Object.freeze({
  enabled: false,
  authenticity: 'disabled',
  async consume(): Promise<PublishedManifestConsumerResult> { return { ok: false, code: 'disabled' } },
})
