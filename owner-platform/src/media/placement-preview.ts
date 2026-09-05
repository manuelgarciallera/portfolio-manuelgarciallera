import { MEDIA_FITS, MEDIA_FRAMES, type MediaPlacement } from './placement'

export type PlacementBreakpoint = 'desktop' | 'mobile' | 'tablet'
export type MediaPlacementPreview = {
  assetId: string | number
  aspectRatio: string
  fit: MediaPlacement['fit']
  focalX: number
  focalY: number
  frame: MediaPlacement['frame']
  zoom: number
}
export type PreviewAsset = { alt: string; height?: number; id: string | number; url: string; width?: number }

const fieldValue = (field: unknown): unknown => field && typeof field === 'object' && !Array.isArray(field)
  ? (field as Record<string, unknown>).value
  : undefined
const bounded = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : undefined
const catalog = <T extends string>(value: unknown, values: readonly T[]): T | undefined =>
  typeof value === 'string' && values.includes(value as T) ? value as T : undefined
const frameRatio = (frame: MediaPlacement['frame']): string => frame === 'auto' ? 'auto' : frame.replace(':', ' / ')

export const buildMediaPlacementPreview = (
  fields: Record<string, unknown>,
  breakpoint: PlacementBreakpoint,
): MediaPlacementPreview | null => {
  const get = (path: string) => fieldValue(fields[path])
  const assetId = get('placement.asset')
  if ((typeof assetId !== 'string' && typeof assetId !== 'number') || !String(assetId).trim()) return null
  const base = 'placement'
  const override = breakpoint === 'desktop' ? undefined : `${base}.overrides.${breakpoint}`
  const resolved = (name: string) => override && get(`${override}.${name}`) != null ? get(`${override}.${name}`) : get(`${base}.${name}`)
  const fit = catalog(resolved('fit'), MEDIA_FITS)
  const focalX = bounded(resolved('focalX'), 0, 1)
  const focalY = bounded(resolved('focalY'), 0, 1)
  const frame = catalog(resolved('frame'), MEDIA_FRAMES)
  const zoom = bounded(resolved('zoom'), 1, 4)
  if (!fit || focalX === undefined || focalY === undefined || !frame || zoom === undefined) return null
  return { assetId, aspectRatio: frameRatio(frame), fit, focalX: focalX * 100, focalY: focalY * 100, frame, zoom }
}

const positiveInteger = (value: unknown): number | undefined =>
  Number.isInteger(value) && Number(value) > 0 && Number(value) <= 20_000 ? Number(value) : undefined

export const presentPreviewAsset = (value: unknown, expectedId: string | number): PreviewAsset => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('El medio no es válido.')
  const media = value as Record<string, unknown>
  if (String(media.id) !== String(expectedId)) throw new TypeError('El medio no coincide con la selección.')
  if (typeof media.url !== 'string' || !media.url.startsWith('/api/media/file/') || media.url.startsWith('//')) {
    throw new TypeError('La URL del medio no es válida.')
  }
  const width = media.width == null ? undefined : positiveInteger(media.width)
  const height = media.height == null ? undefined : positiveInteger(media.height)
  if ((media.width != null && !width) || (media.height != null && !height)) throw new TypeError('Las dimensiones del medio no son válidas.')
  return {
    alt: typeof media.alt === 'string' ? media.alt.trim().slice(0, 300) : '',
    ...(height ? { height } : {}),
    id: expectedId,
    url: media.url,
    ...(width ? { width } : {}),
  }
}
