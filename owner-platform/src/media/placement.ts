export const MEDIA_FITS = ['cover', 'contain'] as const
export const MEDIA_FRAMES = ['auto', '16:9', '4:3', '1:1', '9:16'] as const
export const MEDIA_BREAKPOINTS = ['mobile', 'tablet'] as const

type MediaFit = (typeof MEDIA_FITS)[number]
type MediaFrame = (typeof MEDIA_FRAMES)[number]
type MediaBreakpoint = (typeof MEDIA_BREAKPOINTS)[number]

export type MediaPlacementOverride = {
  fit?: MediaFit
  focalX?: number
  focalY?: number
  frame?: MediaFrame
  zoom?: number
}

export type MediaPlacement = {
  asset: string | number
  fit: MediaFit
  focalX: number
  focalY: number
  frame: MediaFrame
  overrides: Partial<Record<MediaBreakpoint, MediaPlacementOverride>>
  zoom: number
}

const PLACEMENT_FIELDS = new Set(['asset', 'fit', 'focalX', 'focalY', 'frame', 'overrides', 'zoom'])
const OVERRIDE_FIELDS = new Set(['fit', 'focalX', 'focalY', 'frame', 'zoom'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const exactFields = (value: Record<string, unknown>, fields: Set<string>, path: string): void => {
  const unknown = Object.keys(value).find((key) => !fields.has(key))
  if (unknown) throw new Error(`${path}.${unknown} no está permitido.`)
}

const bounded = (value: unknown, fallback: number, min: number, max: number, path: string): number => {
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${path} debe estar entre ${min} y ${max}.`)
  }
  return value
}

const catalogValue = <T extends string>(
  value: unknown,
  fallback: T,
  options: readonly T[],
  path: string,
): T => {
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'string' || !options.includes(value as T)) {
    throw new Error(`${path} no pertenece al catálogo permitido.`)
  }
  return value as T
}

const normalizeOverride = (value: unknown, path: string): MediaPlacementOverride => {
  if (!isRecord(value)) throw new Error(`${path} debe ser un objeto.`)
  exactFields(value, OVERRIDE_FIELDS, path)
  const result: MediaPlacementOverride = {}
  if (value.fit !== undefined && value.fit !== null) {
    result.fit = catalogValue(value.fit, 'cover', MEDIA_FITS, `${path}.fit`)
  }
  if (value.focalX !== undefined && value.focalX !== null) {
    result.focalX = bounded(value.focalX, 0.5, 0, 1, `${path}.focalX`)
  }
  if (value.focalY !== undefined && value.focalY !== null) {
    result.focalY = bounded(value.focalY, 0.5, 0, 1, `${path}.focalY`)
  }
  if (value.frame !== undefined && value.frame !== null) {
    result.frame = catalogValue(value.frame, 'auto', MEDIA_FRAMES, `${path}.frame`)
  }
  if (value.zoom !== undefined && value.zoom !== null) {
    result.zoom = bounded(value.zoom, 1, 1, 4, `${path}.zoom`)
  }
  return result
}

export const normalizeMediaPlacement = (input: unknown): MediaPlacement => {
  if (!isRecord(input)) throw new Error('La colocación de medios debe ser un objeto.')
  exactFields(input, PLACEMENT_FIELDS, 'placement')
  if (
    (typeof input.asset !== 'string' && typeof input.asset !== 'number') ||
    String(input.asset).trim() === ''
  ) {
    throw new Error('placement.asset es obligatorio.')
  }

  const overrides: MediaPlacement['overrides'] = {}
  if (input.overrides !== undefined && input.overrides !== null) {
    if (!isRecord(input.overrides)) throw new Error('placement.overrides debe ser un objeto.')
    const unknownBreakpoint = Object.keys(input.overrides).find(
      (key) => !MEDIA_BREAKPOINTS.includes(key as MediaBreakpoint),
    )
    if (unknownBreakpoint) throw new Error(`placement.overrides.${unknownBreakpoint} no está permitido.`)
    for (const breakpoint of MEDIA_BREAKPOINTS) {
      const value = input.overrides[breakpoint]
      if (value !== undefined && value !== null) {
        overrides[breakpoint] = normalizeOverride(value, `placement.overrides.${breakpoint}`)
      }
    }
  }

  return {
    asset: input.asset,
    fit: catalogValue(input.fit, 'cover', MEDIA_FITS, 'placement.fit'),
    focalX: bounded(input.focalX, 0.5, 0, 1, 'placement.focalX'),
    focalY: bounded(input.focalY, 0.5, 0, 1, 'placement.focalY'),
    frame: catalogValue(input.frame, 'auto', MEDIA_FRAMES, 'placement.frame'),
    overrides,
    zoom: bounded(input.zoom, 1, 1, 4, 'placement.zoom'),
  }
}
