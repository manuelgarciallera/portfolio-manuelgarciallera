import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { ASSIST_CAPABILITIES, STUDIO_PATCH_LIMITS, type AssistCapability, type AssistCapabilitySwitches } from './contracts'

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

const record = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const buildTargets = (manifest: PreviewManifest, enabled: readonly AssistCapability[]) => {
  const targets: Partial<Record<AssistCapability, string[]>> = {}
  const allowed = new Set(enabled)
  if (allowed.has('suggestCopy')) {
    targets.suggestCopy = [...(typeof manifest.pageTitle === 'string' ? ['/page/title'] : []), ...manifest.pageBlocks.flatMap((value, index) => {
      const block = record(value)
      return ['heading', 'caption'].flatMap((field) => block && Object.hasOwn(block, field) ? [`/page/layout/${index}/${field}`] : [])
    })]
  }
  if (allowed.has('suggestPalette')) {
    const brand = record(manifest.brandTokens)
    const colors = Array.isArray(brand?.colors) ? brand.colors : []
    const weights = Array.isArray(brand?.usageWeights) ? brand.usageWeights : []
    targets.suggestPalette = [
      ...colors.map((_, index) => `/brand/colors/${index}/value`),
      ...weights.map((_, index) => `/brand/usageWeights/${index}/weight`),
    ]
  }
  if (allowed.has('suggestLayout')) targets.suggestLayout = ['/page/layout']
  if (allowed.has('suggestCrop')) {
    const placements = [...new Set(manifest.pageBlocks.flatMap((value) => {
      const placement = record(value)?.placement
      return (typeof placement === 'string' || typeof placement === 'number') && /^[A-Za-z0-9_-]{1,64}$/.test(String(placement)) ? [String(placement)] : []
    }))]
    targets.suggestCrop = placements.flatMap((id) => ['focalX', 'focalY', 'zoom', 'fit', 'frame'].map((field) => `/media-placements/${id}/placement/${field}`))
  }
  if (allowed.has('suggestMotion')) {
    const motion = record(record(manifest.brandTokens)?.motion)
    targets.suggestMotion = ['duration', 'stagger', 'travel', 'easing', 'reducedMotion'].flatMap((field) => motion && Object.hasOwn(motion, field) ? [`/brand/motion/${field}`] : [])
  }
  return targets
}

type TargetRule = Readonly<{
  capability: AssistCapability
  operation: 'replace'
  path: string
  value: Readonly<Record<string, boolean | number | string | readonly string[]>>
}>

const valueRule = (path: string): TargetRule['value'] => {
  if (/\/(?:title|heading|caption)$/.test(path)) return { maxLength: STUDIO_PATCH_LIMITS.maxStringLength, type: 'string' }
  if (/\/colors\/\d+\/value$/.test(path)) return { format: '#RRGGBB', type: 'string' }
  if (/\/usageWeights\/\d+\/weight$/.test(path)) return { atomicSet: true, maximum: 100, minimum: 0, total: 100, type: 'number' }
  if (path === '/page/layout') return { constraint: 'exact-block-reorder', type: 'array' }
  if (/\/(?:focalX|focalY)$/.test(path)) return { maximum: 1, minimum: 0, type: 'number' }
  if (/\/zoom$/.test(path)) return { maximum: 4, minimum: 1, type: 'number' }
  if (/\/fit$/.test(path)) return { enum: ['cover', 'contain'], type: 'string' }
  if (/\/frame$/.test(path)) return { enum: ['auto', '16:9', '4:3', '1:1', '9:16'], type: 'string' }
  if (/\/duration$/.test(path)) return { maximum: 1600, minimum: 150, type: 'number' }
  if (/\/stagger$/.test(path)) return { maximum: 500, minimum: 0, type: 'number' }
  if (/\/travel$/.test(path)) return { maximum: 80, minimum: 0, type: 'number' }
  if (/\/easing$/.test(path)) return { enum: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'], type: 'string' }
  if (/\/reducedMotion$/.test(path)) return { enum: ['reduce', 'disable'], type: 'string' }
  throw new TypeError('La ruta exportable no tiene una regla de valor.')
}

const buildTargetRules = (targets: Partial<Record<AssistCapability, string[]>>): TargetRule[] => ASSIST_CAPABILITIES.flatMap((capability) =>
  (targets[capability] ?? []).map((path) => ({ capability, operation: 'replace' as const, path, value: valueRule(path) })),
)

export const buildAssistanceContextPackage = (manifest: PreviewManifest, switches: Partial<AssistCapabilitySwitches>) => {
  const hash = hashPreviewManifest(manifest)
  assertNoSensitiveKeys(manifest.brandTokens)
  assertNoSensitiveKeys(manifest.pageBlocks)
  assertNoSensitiveKeys(manifest.mediaReferences)
  const enabled = ASSIST_CAPABILITIES.filter((capability) => switches[capability] === true)
  const targets = buildTargets(manifest, enabled)
  const candidate = {
    schemaVersion: 1 as const,
    contentTrust: 'untrusted-editorial-data' as const,
    snapshot: { hash, source: manifest.source },
    permissions: {
      apply: false as const,
      capabilities: enabled,
      deploy: false as const,
      publish: false as const,
    },
    proposalContract: {
      schemaVersion: 1 as const,
      operationLimit: STUDIO_PATCH_LIMITS.maxOperations,
      outputEnvelope: { schemaVersion: 1 as const, capability: 'one-enabled-capability', operations: [{ op: 'replace', path: 'one-listed-target', value: 'type-compatible-value' }] },
      targetRules: buildTargetRules(targets),
      targets,
    },
    context: {
      brand: manifest.brandTokens,
      media: manifest.mediaReferences,
      page: { ...(typeof manifest.pageTitle === 'string' ? { title: manifest.pageTitle } : {}), layout: manifest.pageBlocks },
    },
  }
  const serialized = JSON.stringify(candidate)
  if (new TextEncoder().encode(serialized).byteLength > MAX_CONTEXT_BYTES) throw new TypeError('El contexto exportable es demasiado grande.')
  return deepFreeze(JSON.parse(serialized) as typeof candidate)
}
