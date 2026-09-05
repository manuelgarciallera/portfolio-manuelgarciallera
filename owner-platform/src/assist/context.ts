import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { ASSIST_CAPABILITIES, type AssistCapabilitySwitches } from './contracts'

const MAX_CONTEXT_BYTES = 256 * 1024
const sensitiveKey = /(?:secret|token|password|authorization|credential|private[-_]?key|api[-_]?key|cookie|session)/i

const assertNoSensitiveKeys = (value: unknown): void => {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) { for (const child of value) assertNoSensitiveKeys(child); return }
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKey.test(key)) throw new TypeError('El contexto contiene una clave sensible.')
    assertNoSensitiveKeys(child)
  }
}

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

export const buildAssistanceContextPackage = (manifest: PreviewManifest, switches: Partial<AssistCapabilitySwitches>) => {
  const hash = hashPreviewManifest(manifest)
  assertNoSensitiveKeys(manifest.brandTokens)
  assertNoSensitiveKeys(manifest.pageBlocks)
  assertNoSensitiveKeys(manifest.mediaReferences)
  const candidate = {
    schemaVersion: 1 as const,
    contentTrust: 'untrusted-editorial-data' as const,
    snapshot: { hash, source: manifest.source },
    permissions: {
      apply: false as const,
      capabilities: ASSIST_CAPABILITIES.filter((capability) => switches[capability] === true),
      deploy: false as const,
      publish: false as const,
    },
    context: {
      brand: manifest.brandTokens,
      media: manifest.mediaReferences,
      page: { layout: manifest.pageBlocks },
    },
  }
  const serialized = JSON.stringify(candidate)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CONTEXT_BYTES) throw new TypeError('El contexto exportable es demasiado grande.')
  return deepFreeze(JSON.parse(serialized) as typeof candidate)
}
