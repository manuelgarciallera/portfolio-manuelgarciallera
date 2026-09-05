'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { executeFigmaImport } from '@/connectors/figma/import-execution-client'
import { DocumentActionGroup } from './DocumentActionGroup'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const FigmaImportReviewControls = () => {
  const { data, id } = useDocumentInfo()
  const reviewId = identifier(id)
  const decision = data?.decision
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La importación crea un medio en borrador; no publica ni modifica ninguna página.')
  const [destinations, setDestinations] = useState<{ executionHref: string; mediaHref: string; placementHref: string } | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [alt, setAlt] = useState('')
  if (reviewId === null || (decision !== 'approved' && decision !== 'rejected')) return null
  if (decision === 'rejected') return <aside className={styles.panel}><strong>Importación rechazada</strong><p>Una revisión rechazada no puede crear medios.</p></aside>

  const submit = async () => {
    if (pending || destinations !== null) return
    setPending(true); setDestinations(null)
    try {
      const result = await executeFigmaImport(reviewId, { alt, confirmation })
      setDestinations(result)
      setMessage('PNG importado como medio en borrador. La web pública sigue sin cambios.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo importar la imagen.') }
    finally { setPending(false) }
  }

  return <aside className={styles.panel}>
    <strong>Importar PNG aprobado</strong>
    <p>Figma se verifica de nuevo y el render se limita a 20 MiB antes de guardarse como borrador.</p>
    <DocumentActionGroup label="Importar PNG aprobado" disabled={pending || destinations !== null} onAction={submit}>
      <label><span>Texto alternativo</span><input name="alt" type="text" maxLength={500} required value={alt} onChange={(event) => setAlt(event.target.value)} /></label>
      <label><span>Escribe IMPORTAR PNG DE FIGMA</span><input name="confirmation" type="text" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      <button type="button" onClick={submit} disabled={pending || destinations !== null}>{pending ? 'Importando…' : 'Importar como borrador'}</button>
    </DocumentActionGroup>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
    {destinations && <p><Link href={destinations.placementHref}>Ajustar encuadre</Link> · <Link href={destinations.mediaHref}>Editar medio</Link> · <Link href={destinations.executionHref}>Ver evidencia</Link></p>}
  </aside>
}
