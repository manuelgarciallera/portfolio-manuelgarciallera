import { createPreviewManifest, hashPreviewManifest, type PreviewManifest } from '../preview/manifest'

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
const assertNoSecretsOrAccessors = (value: unknown, ancestors = new Set<object>()): void => {
  if (!value || typeof value !== 'object') return
  if (ancestors.has(value)) throw new TypeError('Referencia cíclica rechazada.')
  const next = new Set(ancestors).add(value)
  if (Array.isArray(value)) { for (const child of value) assertNoSecretsOrAccessors(child, next); return }
  assertPlainDataRecord(value, 'El contenido', [])
  for (const [key, child] of Object.entries(value)) { if (secretKey.test(key)) throw new TypeError('El manifiesto contiene una clave secreta.'); assertNoSecretsOrAccessors(child, next) }
}
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }

export const validatePublishedManifest = (input: unknown): PublishedManifest => {
  assertPlainDataRecord(input, 'El sobre Linocube', ['schemaVersion', 'manifestVersion', 'digest', 'manifest'])
  exactKeys(input, ['schemaVersion', 'manifestVersion', 'digest', 'manifest'], 'El sobre Linocube')
  if (input.schemaVersion !== LINOCUBE_MANIFEST_SCHEMA_VERSION) throw new TypeError('Versión de schema Linocube no soportada.')
  if (!Number.isSafeInteger(input.manifestVersion) || (input.manifestVersion as number) < 1) throw new TypeError('La versión del manifiesto debe ser un entero positivo.')
  if (typeof input.digest !== 'string' || !digestPattern.test(input.digest)) throw new TypeError('El digest no es válido.')
  assertPlainDataRecord(input.manifest, 'El manifiesto', ['schemaVersion', 'source', 'brandTokens', 'pageBlocks', 'mediaReferences', 'hash'])
  exactKeys(input.manifest, ['schemaVersion', 'source', 'brandTokens', 'pageBlocks', 'mediaReferences', 'hash'], 'El manifiesto')
  if (input.manifest.schemaVersion !== 1) throw new TypeError('Versión del manifiesto no soportada.')
  assertPlainDataRecord(input.manifest.source, 'Source', ['collection', 'documentId', 'versionId'])
  exactKeys(input.manifest.source, ['collection', 'documentId', 'versionId'], 'Source')
  if (input.manifest.source.collection !== 'pages' || typeof input.manifest.source.documentId !== 'string' || !input.manifest.source.documentId || typeof input.manifest.source.versionId !== 'string' || !input.manifest.source.versionId) throw new TypeError('Source del manifiesto no válido.')
  assertPlainDataRecord(input.manifest.brandTokens, 'Brand tokens', [])
  if (!Array.isArray(input.manifest.pageBlocks) || !Array.isArray(input.manifest.mediaReferences)) throw new TypeError('Los bloques y medios deben ser una lista.')
  if (typeof input.manifest.hash !== 'string' || !digestPattern.test(input.manifest.hash)) throw new TypeError('El hash del manifiesto no es válido.')
  assertNoSecretsOrAccessors(input.manifest.brandTokens)
  assertNoSecretsOrAccessors(input.manifest.pageBlocks)
  assertNoSecretsOrAccessors(input.manifest.mediaReferences)
  const projected = createPreviewManifest({ source: input.manifest.source as PreviewManifest['source'], brandTokens: input.manifest.brandTokens, pageBlocks: input.manifest.pageBlocks, mediaReferences: input.manifest.mediaReferences })
  if (projected.hash !== input.manifest.hash || hashPreviewManifest(input.manifest as unknown as PreviewManifest) !== input.digest) throw new TypeError('El hash no coincide con el manifiesto.')
  if (input.digest !== input.manifest.hash) throw new TypeError('El digest no coincide con el manifiesto.')
  return deepFreeze(structuredClone(input) as PublishedManifest)
}

export const createDisabledLinocubeConsumer = (): PublishedManifestConsumer => Object.freeze({
  enabled: false,
  authenticity: 'disabled',
  async consume(): Promise<PublishedManifestConsumerResult> { return { ok: false, code: 'disabled' } },
})
