import { createHash } from 'node:crypto'

import { verifyPublicationExport } from './export'

export type PublicationPreflightIssue = Readonly<{
  blockPosition?: number
  code: string
  message: string
  pageId: string
  severity: 'blocker' | 'warning'
}>

export type PublicationPreflight = Readonly<{
  artifactHash: string
  checkedAt: string
  exportHash: string
  hash: string
  issueCount: number
  issues: readonly PublicationPreflightIssue[]
  pageCount: number
  schemaVersion: 1
  status: 'blocked' | 'ready' | 'ready_with_warnings'
}>

const SUPPORTED_BLOCKS = new Set(['customFeature', 'hero', 'media', 'projectGrid', 'richText'])
const FEATURE_KEYS = new Set(['contact-panel', 'project-reel', 'research-index'])
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const hasText = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim())
const hasRelation = (value: unknown): boolean => (typeof value === 'string' || typeof value === 'number') && Boolean(String(value).trim())
const exactIso = (value: unknown): value is string => typeof value === 'string' && (() => { try { return new Date(value).toISOString() === value } catch { return false } })()
const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`
}
const digest = (value: unknown): string => `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child) }
  return value
}
const issue = (code: string, message: string, pageId: string, severity: 'blocker' | 'warning', blockPosition?: number): PublicationPreflightIssue => ({
  ...(blockPosition === undefined ? {} : { blockPosition }), code, message, pageId, severity,
})

const inspectBlock = (value: unknown, pageId: string, blockPosition: number): PublicationPreflightIssue[] => {
  if (!isRecord(value) || !hasText(value.blockType) || !SUPPORTED_BLOCKS.has(value.blockType)) return [issue('unsupported_block', 'El bloque no está soportado por el contrato editorial.', pageId, 'blocker', blockPosition)]
  if (value.blockType === 'hero' && !hasText(value.heading)) return [issue('hero_heading_missing', 'El bloque hero necesita un titular.', pageId, 'blocker', blockPosition)]
  if (value.blockType === 'media' && !hasRelation(value.asset)) return [issue('media_asset_missing', 'El bloque de medios necesita un recurso.', pageId, 'blocker', blockPosition)]
  if (value.blockType === 'richText' && !isRecord(value.content)) return [issue('rich_text_content_missing', 'El bloque de texto necesita contenido.', pageId, 'blocker', blockPosition)]
  if (value.blockType === 'customFeature' && (!hasText(value.featureKey) || !FEATURE_KEYS.has(value.featureKey))) return [issue('custom_feature_invalid', 'La función personalizada no está permitida.', pageId, 'blocker', blockPosition)]
  return []
}

export const createPublicationPreflight = (input: unknown, checkedAt: string): PublicationPreflight => {
  const exported = verifyPublicationExport(input)
  if (!exactIso(checkedAt)) throw new TypeError('La fecha de comprobación no es válida.')
  const issues: PublicationPreflightIssue[] = []
  for (const page of exported.pages) {
    if (page.state.layout.length === 0) issues.push(issue('empty_layout', 'La página no contiene bloques.', page.pageId, 'blocker'))
    else page.state.layout.forEach((block, position) => issues.push(...inspectBlock(block, page.pageId, position)))
    const seo = isRecord(page.state.seo) ? page.state.seo : {}
    if (!hasText(seo.title)) issues.push(issue('seo_title_missing', 'Falta el título SEO.', page.pageId, 'warning'))
    if (!hasText(seo.description)) issues.push(issue('seo_description_missing', 'Falta la descripción SEO.', page.pageId, 'warning'))
    if (seo.noIndex === true) issues.push(issue('seo_no_index', 'La página está marcada para no indexarse.', page.pageId, 'warning'))
  }
  const status: PublicationPreflight['status'] = issues.some(({ severity }) => severity === 'blocker') ? 'blocked' : issues.length ? 'ready_with_warnings' : 'ready'
  const withoutHash = { artifactHash: exported.artifactHash, checkedAt, exportHash: exported.hash, issueCount: issues.length, issues, pageCount: exported.pageCount, schemaVersion: 1 as const, status }
  return deepFreeze({ ...withoutHash, hash: digest(withoutHash) })
}

export const hashPublicationPreflight = (report: PublicationPreflight): string => {
  const { hash, ...withoutHash } = report
  const expected = digest(withoutHash)
  if (hash !== expected) throw new TypeError('El hash no coincide con el informe de preflight.')
  return expected
}
