'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { runPublicationPreflight } from '../publication/client'
import { DocumentActionGroup } from './DocumentActionGroup'
import styles from './PublicationBundleControls.module.css'

const safeId = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(value)) ? value : null

export const PublicationArtifactControls = () => {
  const { id } = useDocumentInfo()
  const artifactId = safeId(id)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La validación solo genera evidencia owner; no cambia la web pública.')
  const [preflightHref, setPreflightHref] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState('')
  if (artifactId === null) return null
  const submit = async () => {
    if (pending || preflightHref !== null) return
    setPending(true)
    setPreflightHref(null)
    try {
      const result = await runPublicationPreflight(artifactId, confirmation)
      setPreflightHref(result.href)
      setMessage(result.status === 'blocked' ? `Validación bloqueada con ${result.issueCount} incidencias.` : result.issueCount ? `Preparado con ${result.issueCount} avisos.` : 'Preparado sin incidencias.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo validar el artefacto.') }
    finally { setPending(false) }
  }
  return <aside className={styles.panel}>
    <strong>Exportación revisable</strong>
    <p>Descarga un JSON íntegro para validación externa. No escribe, publica ni despliega la web.</p>
    <DocumentActionGroup label="Validar artefacto" disabled={pending || preflightHref !== null} onAction={submit}>
      <label><span>Escribe VALIDAR ARTEFACTO</span><input name="confirmation" type="text" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      <button type="button" onClick={submit} disabled={pending || preflightHref !== null}>{pending ? 'Validando…' : 'Validar preparación'}</button>
    </DocumentActionGroup>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
    {preflightHref && <Link href={preflightHref}>Ver informe inmutable</Link>}
    <br />
    <a href={`/api/owner/publication-artifacts/${encodeURIComponent(String(artifactId))}/export`} download>Descargar paquete JSON</a>
  </aside>
}
