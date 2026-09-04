/** The schema version is intentionally a literal so incompatible documents cannot be accepted silently. */
export const PORTFOLIO_SCHEMA_VERSION = 1 as const

export type JsonPrimitive = string | number | boolean | null
export interface JsonObject {
  [key: string]: JsonValue
}
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

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
}

export interface MediaPlacement {
  assetId: string
  focalX: number
  focalY: number
  zoom: number
  fit: MediaFit
  frame?: MediaFrame
  breakpointOverrides?: Record<string, MediaPlacementOverride>
}

export type MediaPlacementInput = {
  assetId: string
  focalX?: number
  focalY?: number
  zoom?: number
  fit?: MediaFit | string
  frame?: MediaFrame
  breakpointOverrides?: Record<string, MediaPlacementOverride>
}

export interface MediaAsset {
  id: string
  src?: string
  url?: string
  alt?: string
  mimeType?: string
  width?: number
  height?: number
}

export interface PortfolioBlock {
  id: string
  kind: PortfolioBlockKind
  order: number
  assetId?: string
  placement?: MediaPlacement
  data?: JsonValue
}

export interface PortfolioDocument {
  schemaVersion: typeof PORTFOLIO_SCHEMA_VERSION
  assets: MediaAsset[]
  blocks: PortfolioBlock[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

const fail = (message: string): never => {
  throw new TypeError(message)
}

const clamp = (value: unknown, fallback: number, minimum: number, maximum: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(maximum, Math.max(minimum, value))
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const requireFiniteNumber = (value: unknown, path: string): number => {
  if (!isFiniteNumber(value)) throw new TypeError(`${path} must be a finite number.`)
  return value
}

const requireFit = (value: unknown, path: string): MediaFit => {
  if (value !== 'cover' && value !== 'contain') throw new TypeError(`${path} is unsupported.`)
  return value
}

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== 'string') throw new TypeError(`${path} must be a string.`)
  return value
}

const requireJsonValue = (value: unknown, path: string): JsonValue => {
  if (!isJsonValue(value)) throw new TypeError(`${path} must be JSON serializable.`)
  return value
}

const assertKnownKeys = (value: Record<string, unknown>, keys: readonly string[], path: string): void => {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail(`${path} contains unsupported field "${key}".`)
  }
}

const validateFrame = (value: unknown, path: string): MediaFrame => {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object.`)
  assertKnownKeys(value, ['aspectRatio', 'preset'], path)
  const frame: MediaFrame = {}
  if (hasOwn(value, 'aspectRatio')) {
    const aspectRatio = value.aspectRatio
    if (typeof aspectRatio === 'number') {
      if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
        fail(`${path}.aspectRatio must be a positive finite number.`)
      }
      frame.aspectRatio = aspectRatio
    } else if (typeof aspectRatio === 'string' && aspectRatio.length > 0) {
      frame.aspectRatio = aspectRatio
    } else {
      fail(`${path}.aspectRatio must be a non-empty string or positive number.`)
    }
  }
  if (hasOwn(value, 'preset')) {
    const preset = value.preset
    const validPreset = requireString(preset, `${path}.preset`)
    if (validPreset.length === 0) {
      fail(`${path}.preset must be a non-empty string.`)
    }
    frame.preset = validPreset
  }
  if (Object.keys(frame).length === 0) fail(`${path} requires an aspect ratio or preset.`)
  return frame
}

const parseOverride = (
  value: unknown,
  path: string,
  shouldClamp: boolean,
): MediaPlacementOverride => {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object.`)
  assertKnownKeys(value, ['focalX', 'focalY', 'zoom', 'fit', 'frame'], path)
  const override: MediaPlacementOverride = {}
  if (hasOwn(value, 'focalX')) {
    const focalX = requireFiniteNumber(value.focalX, `${path}.focalX`)
    if (!shouldClamp && (focalX < 0 || focalX > 1)) {
      fail(`${path}.focalX must be between 0 and 1.`)
    }
    override.focalX = shouldClamp ? clamp(focalX, 0.5, 0, 1) : focalX
  }
  if (hasOwn(value, 'focalY')) {
    const focalY = requireFiniteNumber(value.focalY, `${path}.focalY`)
    if (!shouldClamp && (focalY < 0 || focalY > 1)) {
      fail(`${path}.focalY must be between 0 and 1.`)
    }
    override.focalY = shouldClamp ? clamp(focalY, 0.5, 0, 1) : focalY
  }
  if (hasOwn(value, 'zoom')) {
    const zoom = requireFiniteNumber(value.zoom, `${path}.zoom`)
    if (!shouldClamp && (zoom < 1 || zoom > 4)) {
      fail(`${path}.zoom must be between 1 and 4.`)
    }
    override.zoom = shouldClamp ? clamp(zoom, 1, 1, 4) : zoom
  }
  if (hasOwn(value, 'fit')) {
    override.fit = requireFit(value.fit, `${path}.fit`)
  }
  if (hasOwn(value, 'frame')) override.frame = validateFrame(value.frame, `${path}.frame`)
  return override
}

const parseOverrides = (
  value: unknown,
  path: string,
  shouldClamp: boolean,
): Record<string, MediaPlacementOverride> => {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object.`)
  const overrides: Record<string, MediaPlacementOverride> = {}
  for (const [name, override] of Object.entries(value)) {
    overrides[name] = parseOverride(override, `${path}.${name} breakpoint override`, shouldClamp)
  }
  return overrides
}

const parsePlacement = (value: unknown, path: string, shouldClamp: boolean): MediaPlacement => {
  if (!isRecord(value)) throw new TypeError(`${path} must be an object.`)
  assertKnownKeys(value, ['assetId', 'focalX', 'focalY', 'zoom', 'fit', 'frame', 'breakpointOverrides'], path)
  const assetId = requireString(value.assetId, `${path}.assetId`)
  if (assetId.length === 0) {
    fail(`${path}.assetId must be a non-empty string.`)
  }
  const focalX = requireFiniteNumber(value.focalX, `${path}.focalX`)
  const focalY = requireFiniteNumber(value.focalY, `${path}.focalY`)
  const zoom = requireFiniteNumber(value.zoom, `${path}.zoom`)
  const fit = requireFit(value.fit, `${path}.fit`)
  if (!shouldClamp) {
    if (focalX < 0 || focalX > 1) fail(`${path}.focalX must be between 0 and 1.`)
    if (focalY < 0 || focalY > 1) fail(`${path}.focalY must be between 0 and 1.`)
    if (zoom < 1 || zoom > 4) fail(`${path}.zoom must be between 1 and 4.`)
  }

  const placement: MediaPlacement = {
    assetId,
    focalX: shouldClamp ? clamp(focalX, 0.5, 0, 1) : focalX,
    focalY: shouldClamp ? clamp(focalY, 0.5, 0, 1) : focalY,
    zoom: shouldClamp ? clamp(zoom, 1, 1, 4) : zoom,
    fit,
  }
  if (hasOwn(value, 'frame')) placement.frame = validateFrame(value.frame, `${path}.frame`)
  if (hasOwn(value, 'breakpointOverrides')) {
    placement.breakpointOverrides = parseOverrides(
      value.breakpointOverrides,
      `${path}.breakpointOverrides`,
      shouldClamp,
    )
  }
  return placement
}

/** Normalize reversible presentation settings while leaving the source asset untouched. */
export function normalizeMediaPlacement(input: MediaPlacementInput): MediaPlacement {
  if (!isRecord(input)) fail('Media placement must be an object.')
  if (typeof input.assetId !== 'string' || input.assetId.length === 0) {
    fail('Media placement requires a non-empty asset ID.')
  }
  const prepared: Record<string, unknown> = {
    assetId: input.assetId,
    focalX: clamp(input.focalX, 0.5, 0, 1),
    focalY: clamp(input.focalY, 0.5, 0, 1),
    zoom: clamp(input.zoom, 1, 1, 4),
    fit: input.fit === 'contain' || input.fit === 'cover' ? input.fit : 'cover',
  }
  if (hasOwn(input, 'frame')) prepared.frame = input.frame
  if (hasOwn(input, 'breakpointOverrides')) prepared.breakpointOverrides = input.breakpointOverrides
  return parsePlacement(prepared, 'Media placement', true)
}

const isBlockKind = (value: unknown): value is PortfolioBlockKind => {
  switch (value) {
    case 'hero':
    case 'richText':
    case 'projectGrid':
    case 'media':
    case 'customFeature':
      return true
    default:
      return false
  }
}

const requireBlockKind = (value: unknown, path: string): PortfolioBlockKind => {
  if (!isBlockKind(value)) throw new TypeError(`${path} is unsupported.`)
  return value
}

const isJsonValue = (value: unknown, seen = new WeakSet<object>()): value is JsonValue => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)
  const valid = Array.isArray(value)
    ? value.every((item) => isJsonValue(item, seen))
    : isRecord(value) && Object.values(value).every((item) => isJsonValue(item, seen))
  seen.delete(value)
  return valid
}

const parseAsset = (value: unknown, index: number): MediaAsset => {
  if (!isRecord(value)) throw new TypeError(`Portfolio asset at index ${index} must be an object.`)
  const id = requireString(value.id, `Portfolio asset at index ${index} ID`)
  if (id.length === 0) {
    fail(`Portfolio asset at index ${index} must have a non-empty ID.`)
  }
  const asset: MediaAsset = { id }
  for (const key of ['src', 'url', 'alt', 'mimeType'] as const) {
    if (hasOwn(value, key)) {
      asset[key] = requireString(value[key], `Portfolio asset ${id}.${key}`)
    }
  }
  for (const key of ['width', 'height'] as const) {
    if (hasOwn(value, key)) {
      const dimension = requireFiniteNumber(value[key], `Portfolio asset ${id}.${key}`)
      if (dimension < 0) {
        fail(`Portfolio asset ${id}.${key} must be a non-negative number.`)
      }
      asset[key] = dimension
    }
  }
  return asset
}

/** Validate untrusted JSON and return a fully constructed typed document. */
export function assertPortfolioDocument(input: unknown): PortfolioDocument {
  if (!isRecord(input)) throw new TypeError('Portfolio document must be an object.')
  if (input.schemaVersion !== PORTFOLIO_SCHEMA_VERSION) {
    fail(`Unsupported portfolio schema version; expected ${PORTFOLIO_SCHEMA_VERSION}.`)
  }
  const rawAssets = input.assets
  const rawBlocks = input.blocks
  if (!Array.isArray(rawAssets)) throw new TypeError('Portfolio document assets must be an array.')
  if (!Array.isArray(rawBlocks)) throw new TypeError('Portfolio document blocks must be an array.')

  const assets: MediaAsset[] = []
  const assetIds = new Set<string>()
  for (const [index, value] of rawAssets.entries()) {
    const asset = parseAsset(value, index)
    if (assetIds.has(asset.id)) fail(`Duplicate media asset ID "${asset.id}".`)
    assetIds.add(asset.id)
    assets.push(asset)
  }

  const blocks: PortfolioBlock[] = []
  const blockIds = new Set<string>()
  for (const [index, value] of rawBlocks.entries()) {
    if (!isRecord(value)) throw new TypeError(`Portfolio block at index ${index} must be an object.`)
    const id = requireString(value.id, `Portfolio block at index ${index} ID`)
    if (id.length === 0) {
      fail(`Portfolio block at index ${index} must have a non-empty ID.`)
    }
    if (blockIds.has(id)) fail(`Duplicate portfolio block ID "${id}".`)
    blockIds.add(id)
    const kind = requireBlockKind(value.kind, `Unsupported portfolio block kind at index ${index}`)
    const order = requireFiniteNumber(value.order, `Portfolio block "${id}" order`)
    if (!Number.isInteger(order) || order < 0) {
      fail(`Portfolio block "${id}" has an invalid order; expected a non-negative integer.`)
    }
    const block: PortfolioBlock = { id, kind, order }
    if (hasOwn(value, 'data')) {
      block.data = requireJsonValue(value.data, `Portfolio block "${id}" data`)
    }
    if (hasOwn(value, 'assetId')) {
      const assetId = requireString(value.assetId, `Portfolio block "${id}" assetId`)
      if (assetId.length === 0) {
        fail(`Portfolio block "${id}" assetId must be a non-empty string.`)
      }
      block.assetId = assetId
    }
    if (hasOwn(value, 'placement')) {
      if (kind !== 'media') fail(`Only media blocks may contain a placement.`)
      block.placement = parsePlacement(value.placement, `Media block "${id}" placement`, false)
    }

    if (kind === 'media') {
      const directAssetId = block.assetId
      const placementAssetId = block.placement?.assetId
      if (directAssetId !== undefined && !assetIds.has(directAssetId)) {
        fail(`Media block "${id}" references a missing asset.`)
      }
      if (placementAssetId !== undefined && !assetIds.has(placementAssetId)) {
        fail(`Media block "${id}" placement references a missing asset.`)
      }
      if (directAssetId !== undefined && placementAssetId !== undefined && directAssetId !== placementAssetId) {
        fail(`Media block "${id}" has conflicting asset references.`)
      }
      if (directAssetId === undefined && placementAssetId === undefined) {
        fail(`Media block "${id}" references a missing asset.`)
      }
    }
    blocks.push(block)
  }

  return { schemaVersion: PORTFOLIO_SCHEMA_VERSION, assets, blocks }
}
