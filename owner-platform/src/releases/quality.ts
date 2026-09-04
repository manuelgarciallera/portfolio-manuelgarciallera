export const RELEASE_QUALITY_SOURCES = ['lighthouse', 'manual'] as const
export const RELEASE_QUALITY_VIEWPORTS = ['desktop', 'mobile'] as const

export type ReleaseQuality = {
  accessibility: number
  id?: string | null
  measuredAt: string
  performance: number
  source: (typeof RELEASE_QUALITY_SOURCES)[number]
  usability: number
  viewport: (typeof RELEASE_QUALITY_VIEWPORTS)[number]
}

const QUALITY_FIELDS = new Set<keyof ReleaseQuality>([
  'accessibility',
  'id',
  'measuredAt',
  'performance',
  'source',
  'usability',
  'viewport',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const score = (name: string, value: unknown): number => {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) {
    throw new Error(`${name} debe ser un entero entre 0 y 100.`)
  }
  return value as number
}

const memberOf = <T extends string>(name: string, value: unknown, choices: readonly T[]): T => {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new Error(`${name} no pertenece al catálogo permitido.`)
  }
  return value as T
}

const isoTimestamp = (value: unknown): string => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('measuredAt debe ser una fecha ISO válida.')
  }
  const normalized = new Date(value).toISOString()
  if (value !== normalized) throw new Error('measuredAt debe incluir fecha, hora y zona UTC en formato ISO.')
  return normalized
}

export const normalizeReleaseQuality = (input: unknown): ReleaseQuality => {
  if (!isRecord(input)) throw new Error('La medición de calidad debe ser un objeto.')
  const unknownField = Object.keys(input).find((key) => !QUALITY_FIELDS.has(key as keyof ReleaseQuality))
  if (unknownField) throw new Error(`Campo no permitido en la medición: ${unknownField}.`)

  if (
    input.id !== undefined &&
    input.id !== null &&
    (typeof input.id !== 'string' || !input.id.trim() || input.id.length > 100)
  ) {
    throw new Error('id no es un identificador de fila válido.')
  }

  return {
    accessibility: score('accessibility', input.accessibility),
    ...(input.id !== undefined ? { id: input.id as string | null } : {}),
    measuredAt: isoTimestamp(input.measuredAt),
    performance: score('performance', input.performance),
    source: memberOf('source', input.source, RELEASE_QUALITY_SOURCES),
    usability: score('usability', input.usability),
    viewport: memberOf('viewport', input.viewport, RELEASE_QUALITY_VIEWPORTS),
  }
}
