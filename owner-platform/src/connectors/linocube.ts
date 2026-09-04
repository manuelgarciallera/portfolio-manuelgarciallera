import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'

export const LINOCUBE_MANIFEST_SCHEMA_VERSION = 1 as const

export type PublishedManifest = Readonly<{
  schemaVersion: typeof LINOCUBE_MANIFEST_SCHEMA_VERSION
  manifestVersion: number
  digest: string
  manifest: PreviewManifest
}>

export type PublishedManifestConsumerResult =
  | Readonly<{ ok: true; receiptId: string }>
  | Readonly<{ ok: false; code: 'disabled' | 'invalid_manifest' | 'consumer_error' }>

export interface PublishedManifestConsumer {
  readonly enabled: boolean
  consume(envelope: PublishedManifest): Promise<PublishedManifestConsumerResult>
}

const digestPattern = /^sha256:[a-f0-9]{64}$/
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

export const validatePublishedManifest = (input: unknown): PublishedManifest => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('El manifiesto publicado debe ser un objeto.')
  const envelope = input as Record<string, unknown>
  if (envelope.schemaVersion !== LINOCUBE_MANIFEST_SCHEMA_VERSION) throw new TypeError('Versión de schema Linocube no soportada.')
  if (!Number.isSafeInteger(envelope.manifestVersion) || (envelope.manifestVersion as number) < 1) throw new TypeError('La versión del manifiesto debe ser un entero positivo.')
  if (typeof envelope.digest !== 'string' || !digestPattern.test(envelope.digest)) throw new TypeError('El digest del manifiesto no es válido.')
  if (!envelope.manifest || typeof envelope.manifest !== 'object' || Array.isArray(envelope.manifest)) throw new TypeError('El contenido del manifiesto no es válido.')
  const actual = hashPreviewManifest(envelope.manifest as PreviewManifest)
  if (actual !== envelope.digest) throw new TypeError('El digest no coincide con el manifiesto.')
  return deepFreeze(structuredClone(input) as PublishedManifest)
}

export const createDisabledLinocubeConsumer = (): PublishedManifestConsumer => Object.freeze({
  enabled: false,
  async consume(): Promise<PublishedManifestConsumerResult> {
    return { ok: false, code: 'disabled' }
  },
})
