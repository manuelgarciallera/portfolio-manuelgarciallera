import { createHash } from 'node:crypto'

export const ANALYTICS_SNAPSHOT_SCHEMA_VERSION = 1 as const
const ROOT_FIELDS = new Set(['capturedAt', 'period', 'routes', 'source', 'totals', 'vitals'])
const TOTAL_FIELDS = new Set(['averageDurationSeconds', 'bounceRatePercent', 'pageViews', 'visitors'])
const VITAL_FIELDS = new Set(['cls', 'inpMilliseconds', 'lcpMilliseconds'])
const ROUTE_FIELDS = new Set(['pageViews', 'path', 'visitors'])
const PERIOD_FIELDS = new Set(['from', 'to'])

type RouteMetric = Readonly<{ pageViews: number; path: string; visitors: number }>
export type AnalyticsSnapshot = Readonly<{
  capturedAt: string
  hash: string
  period: Readonly<{ from: string; to: string }>
  routes: readonly RouteMetric[]
  schemaVersion: typeof ANALYTICS_SNAPSHOT_SCHEMA_VERSION
  source: string
  totals: Readonly<{ averageDurationSeconds?: number; bounceRatePercent?: number; pageViews: number; visitors: number }>
  vitals: Readonly<{ cls?: number; inpMilliseconds?: number; lcpMilliseconds?: number }>
}>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const exact = (value: Record<string, unknown>, fields: Set<string>, label: string) => {
  const unknown = Object.keys(value).find((key) => !fields.has(key)); if (unknown) throw new TypeError(`${label} contiene un campo no permitido: ${unknown}.`)
}
const iso = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} no es válida.`)
  return new Date(value).toISOString()
}
const bounded = (value: unknown, label: string, min: number, max: number, integer = false): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new TypeError(`${label} no es válido.`)
  return value
}
const optional = (value: unknown, label: string, min: number, max: number): number | undefined => value === undefined ? undefined : bounded(value, label, min, max)
const canonicalStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify((value as Record<string, unknown>)[key])}`).join(',')}}`
}
const digest = (value: unknown): string => `sha256:${createHash('sha256').update(canonicalStringify(value)).digest('hex')}`
const deepFreeze = <T>(value: T): T => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }; return value }

export const createAnalyticsSnapshot = (input: unknown): AnalyticsSnapshot => {
  if (!isRecord(input)) throw new TypeError('El snapshot analítico debe ser un objeto.')
  exact(input, ROOT_FIELDS, 'El snapshot')
  if (!isRecord(input.period)) throw new TypeError('El periodo no es válido.'); exact(input.period, PERIOD_FIELDS, 'El periodo')
  const from = iso(input.period.from, 'La fecha inicial'); const to = iso(input.period.to, 'La fecha final')
  if (Date.parse(from) >= Date.parse(to)) throw new TypeError('El periodo analítico no es válido.')
  if (typeof input.source !== 'string' || !/^[a-z][a-z0-9-]{1,31}$/.test(input.source)) throw new TypeError('La fuente no es válida.')
  if (!isRecord(input.totals)) throw new TypeError('Los totales no son válidos.'); exact(input.totals, TOTAL_FIELDS, 'Los totales')
  if (!isRecord(input.vitals)) throw new TypeError('Las métricas web no son válidas.'); exact(input.vitals, VITAL_FIELDS, 'Las métricas web')
  if (!Array.isArray(input.routes) || input.routes.length > 250) throw new TypeError('Las rutas no son válidas.')
  const seen = new Set<string>()
  const routes = input.routes.map((route): RouteMetric => {
    if (!isRecord(route)) throw new TypeError('La ruta no es válida.'); exact(route, ROUTE_FIELDS, 'La ruta')
    if (typeof route.path !== 'string' || !/^\/[A-Za-z0-9/_-]*$/.test(route.path) || route.path.length > 300) throw new TypeError('La ruta no es válida.')
    if (seen.has(route.path)) throw new TypeError('El snapshot contiene una ruta duplicada.'); seen.add(route.path)
    return { pageViews: bounded(route.pageViews, 'Las vistas de ruta', 0, 1e12, true), path: route.path, visitors: bounded(route.visitors, 'Los visitantes de ruta', 0, 1e12, true) }
  })
  const totals = {
    ...(input.totals.averageDurationSeconds !== undefined ? { averageDurationSeconds: optional(input.totals.averageDurationSeconds, 'La duración media', 0, 86400) } : {}),
    ...(input.totals.bounceRatePercent !== undefined ? { bounceRatePercent: optional(input.totals.bounceRatePercent, 'El porcentaje de rebote', 0, 100) } : {}),
    pageViews: bounded(input.totals.pageViews, 'Las páginas vistas', 0, 1e12, true),
    visitors: bounded(input.totals.visitors, 'Los visitantes', 0, 1e12, true),
  }
  const vitals = {
    ...(input.vitals.cls !== undefined ? { cls: optional(input.vitals.cls, 'CLS', 0, 10) } : {}),
    ...(input.vitals.inpMilliseconds !== undefined ? { inpMilliseconds: optional(input.vitals.inpMilliseconds, 'INP', 0, 10000) } : {}),
    ...(input.vitals.lcpMilliseconds !== undefined ? { lcpMilliseconds: optional(input.vitals.lcpMilliseconds, 'LCP', 0, 60000) } : {}),
  }
  const withoutHash = { capturedAt: iso(input.capturedAt, 'La fecha de captura'), period: { from, to }, routes, schemaVersion: ANALYTICS_SNAPSHOT_SCHEMA_VERSION, source: input.source, totals, vitals }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashAnalyticsSnapshot = (snapshot: AnalyticsSnapshot): string => {
  const { hash, ...withoutHash } = snapshot; const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con el snapshot analítico.')
  return expected
}
