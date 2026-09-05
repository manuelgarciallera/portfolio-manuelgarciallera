'use client'

import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import styles from './PublicationPreflightSummary.module.css'

type Issue = { blockPosition?: number; code: string; message: string; pageId: string; severity: 'blocker' | 'warning' }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: unknown): string | null => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(value)) ? String(value) : null
const count = (value: unknown): number | null => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null
const parseIssue = (value: unknown): Issue | null => {
  if (!isRecord(value) || !['blocker', 'warning'].includes(String(value.severity)) || typeof value.code !== 'string' || typeof value.message !== 'string' || value.message.length > 500) return null
  const pageId = safeId(value.pageId)
  const blockPosition = value.blockPosition === undefined ? undefined : count(value.blockPosition)
  if (pageId === null || (value.blockPosition !== undefined && blockPosition === null)) return null
  return { ...(typeof blockPosition === 'number' ? { blockPosition } : {}), code: value.code, message: value.message, pageId, severity: value.severity as Issue['severity'] }
}

export const PublicationPreflightSummary = () => {
  const { data } = useDocumentInfo()
  const artifactId = safeId(data?.artifact)
  const issueCount = count(data?.issueCount)
  const pageCount = count(data?.pageCount)
  const report = isRecord(data?.report) ? data.report : null
  const rawIssues = report && Array.isArray(report.issues) && report.issues.length <= 1_000 ? report.issues : null
  const issues = rawIssues?.slice(0, 50).map(parseIssue)
  const status = data?.status
  if (artifactId === null || issueCount === null || pageCount === null || !issues || issues.some((entry) => entry === null) || !['blocked', 'ready', 'ready_with_warnings'].includes(String(status))) return <aside className={styles.panel}><strong>Informe no disponible</strong><p>Los datos del preflight no tienen un formato seguro para mostrarse.</p></aside>
  const label = status === 'blocked' ? 'Publicación bloqueada' : status === 'ready_with_warnings' ? 'Preparada con avisos' : 'Preparada sin incidencias'
  return <aside className={styles.panel} aria-labelledby="preflight-summary-title">
    <header><div><strong id="preflight-summary-title">{label}</strong><p>{issueCount} {issueCount === 1 ? 'incidencia' : 'incidencias'} en {pageCount} {pageCount === 1 ? 'página' : 'páginas'}.</p></div><Link href={`/admin/collections/publication-artifacts/${encodeURIComponent(artifactId)}`}>Ver artefacto</Link></header>
    {issues.length > 0 && <ul>{issues.map((entry, index) => {
      const item = entry as Issue
      return <li key={`${item.code}:${item.pageId}:${item.blockPosition ?? 'page'}:${index}`} data-severity={item.severity}><div><strong>{item.severity === 'blocker' ? 'Bloqueo' : 'Aviso'}</strong><span>Página {item.pageId}{item.blockPosition === undefined ? '' : ` · Bloque ${item.blockPosition + 1}`}</span></div><p>{item.message}</p></li>
    })}</ul>}
    {issueCount > issues.length && <p>Se muestran las primeras {issues.length} incidencias de {issueCount}.</p>}
    <small>Este informe orienta la revisión owner; no publica ni despliega la web.</small>
  </aside>
}
