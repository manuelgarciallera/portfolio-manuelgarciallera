/** The schema version is intentionally a literal so incompatible documents cannot be accepted silently. */
export const PORTFOLIO_SCHEMA_VERSION = 1 as const

export type PortfolioBlockKind = 'hero' | 'richText' | 'projectGrid' | 'media' | 'customFeature'
export type MediaFit = 'cover' | 'contain'

export interface MediaFrame {
  aspectRatio?: number | string
  preset?: string
}

export interface MediaPlacementOverride {
  focalX?: number
  focalY?: number
  zoom?: number
  fit?: MediaFit
  frame?: MediaFrame
  frameAspectRatio?: number | string
  framePreset?: string
}

export interface MediaPlacement {
  assetId: string
  focalX: number
  focalY: number
  zoom: number
  fit: MediaFit
  frame?: MediaFrame
  frameAspectRatio?: number | string
  framePreset?: string
  breakpointOverrides?: Record<string, MediaPlacementOverride>
  /** Alias accepted for integrations that call responsive overrides “breakpoints”. */
  breakpoints?: Record<string, MediaPlacementOverride>
}

export type MediaPlacementInput = {
  assetId: string
  focalX?: number
  focalY?: number
  zoom?: number
  fit?: MediaFit | string
  frame?: MediaFrame
  frameAspectRatio?: number | string
  framePreset?: string
  breakpointOverrides?: Record<string, MediaPlacementOverride>
  breakpoints?: Record<string, MediaPlacementOverride>
}

export interface MediaAsset {
  id: string
  src?: string
  url?: string
  alt?: string
  mimeType?: string
  width?: number
  height?: number
  [key: string]: unknown
}

export interface PortfolioBlock {
  id: string
  kind: PortfolioBlockKind
  order: number
  assetId?: string
  placement?: MediaPlacement
  [key: string]: unknown
}

export interface PortfolioDocument {
  schemaVersion: typeof PORTFOLIO_SCHEMA_VERSION
  assets: MediaAsset[]
  blocks: PortfolioBlock[]
  [key: string]: unknown
}

const BLOCK_KINDS: readonly PortfolioBlockKind[] = [
  'hero',
  'richText',
  'projectGrid',
  'media',
  'customFeature',
]

const clamp = (value: unknown, fallback: number, minimum: number, maximum: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(maximum, Math.max(minimum, value))
}

const cloneFrame = (frame: MediaFrame | undefined): MediaFrame | undefined => {
  if (!frame) return undefined
  return { ...frame }
}

const normalizeOverrides = (
  overrides: Record<string, MediaPlacementOverride> | undefined,
): Record<string, MediaPlacementOverride> | undefined => {
  if (!overrides) return undefined

  const normalized: Record<string, MediaPlacementOverride> = {}
  for (const [name, override] of Object.entries(overrides)) {
    const next: MediaPlacementOverride = { ...override }
    if (typeof override.focalX === 'number') next.focalX = clamp(override.focalX, 0.5, 0, 1)
    if (typeof override.focalY === 'number') next.focalY = clamp(override.focalY, 0.5, 0, 1)
    if (typeof override.zoom === 'number') next.zoom = clamp(override.zoom, 1, 1, 4)
    if (override.fit !== 'cover' && override.fit !== 'contain') delete next.fit
    next.frame = cloneFrame(override.frame)
    normalized[name] = next
  }
  return normalized
}

/**
 * Normalize reversible presentation settings while leaving the source asset untouched.
 * The returned object and its nested frame/override values are fresh objects.
 */
export function normalizeMediaPlacement(input: MediaPlacementInput): MediaPlacement {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Media placement must be an object.')
  }
  if (typeof input.assetId !== 'string' || input.assetId.length === 0) {
    throw new TypeError('Media placement requires a non-empty asset ID.')
  }

  const normalized: MediaPlacement = {
    ...input,
    assetId: input.assetId,
    focalX: clamp(input.focalX, 0.5, 0, 1),
    focalY: clamp(input.focalY, 0.5, 0, 1),
    zoom: clamp(input.zoom, 1, 1, 4),
    fit: input.fit === 'contain' || input.fit === 'cover' ? input.fit : 'cover',
  }

  if (input.frame) normalized.frame = cloneFrame(input.frame)
  if (input.breakpointOverrides) {
    normalized.breakpointOverrides = normalizeOverrides(input.breakpointOverrides)
  }
  if (input.breakpoints) normalized.breakpoints = normalizeOverrides(input.breakpoints)
  return normalized
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fail = (message: string): never => {
  throw new TypeError(message)
}

/** Validate and narrow an untrusted JSON document at the domain boundary. */
export function assertPortfolioDocument(input: unknown): PortfolioDocument {
  if (!isRecord(input)) throw new TypeError('Portfolio document must be an object.')
  if (input.schemaVersion !== PORTFOLIO_SCHEMA_VERSION) {
    fail(`Unsupported portfolio schema version; expected ${PORTFOLIO_SCHEMA_VERSION}.`)
  }
  const assets = input.assets
  const blocks = input.blocks
  if (!Array.isArray(assets)) throw new TypeError('Portfolio document assets must be an array.')
  if (!Array.isArray(blocks)) throw new TypeError('Portfolio document blocks must be an array.')

  const assetIds = new Set<string>()
  for (const [index, asset] of assets.entries()) {
    if (!isRecord(asset) || typeof asset.id !== 'string' || asset.id.length === 0) {
      fail(`Portfolio asset at index ${index} must have a non-empty ID.`)
    }
    if (assetIds.has(asset.id)) fail(`Duplicate media asset ID "${asset.id}".`)
    assetIds.add(asset.id)
  }

  const blockIds = new Set<string>()
  for (const [index, block] of blocks.entries()) {
    if (!isRecord(block)) fail(`Portfolio block at index ${index} must be an object.`)
    if (typeof block.id !== 'string' || block.id.length === 0) {
      fail(`Portfolio block at index ${index} must have a non-empty ID.`)
    }
    if (blockIds.has(block.id)) fail(`Duplicate portfolio block ID "${block.id}".`)
    blockIds.add(block.id)
    if (!BLOCK_KINDS.includes(block.kind as PortfolioBlockKind)) {
      fail(`Unsupported portfolio block kind at index ${index}.`)
    }
    if (typeof block.order !== 'number' || !Number.isInteger(block.order) || block.order < 0) {
      fail(`Portfolio block "${block.id}" has an invalid order; expected a non-negative integer.`)
    }

    if (block.kind === 'media') {
      const placement = isRecord(block.placement) ? block.placement : undefined
      const assetId = typeof block.assetId === 'string' ? block.assetId : placement?.assetId
      if (typeof assetId !== 'string' || !assetIds.has(assetId)) {
        fail(`Media block "${block.id}" references a missing asset.`)
      }
      if (placement && placement.fit !== undefined && placement.fit !== 'cover' && placement.fit !== 'contain') {
        fail(`Media block "${block.id}" has an unsupported fit value.`)
      }
    }
  }

  return input as unknown as PortfolioDocument
}
