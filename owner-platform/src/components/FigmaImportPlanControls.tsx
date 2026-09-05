'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { reviewFigmaImportPlan } from '@/connectors/figma/import-review-client'
import { DocumentActionGroup } from './DocumentActionGroup'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const FigmaImportPlanControls = () => {
  const { id } = useDocumentInfo()
  const planId = identifier(id)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La revisión no descarga, crea ni sustituye imágenes.')
  const [reviewHref, setReviewHref] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [note, setNote] = useState('')
  if (planId === null) return null

  const phrase = decision === 'approved' ? 'APROBAR IMPORTACIÓN FIGMA' : 'RECHAZAR IMPORTACIÓN FIGMA'
  const submit = async () => {
    if (pending || reviewHref !== null) return
    setPending(true); setReviewHref(null)
    try {
      const result = await reviewFigmaImportPlan(planId, { confirmation, decision, note })
      setReviewHref(result.href)
      setMessage(result.decision === 'approved' ? 'Plan aprobado como evidencia. Aún no se ha descargado ninguna imagen.' : 'Plan rechazado. No se ha modificado ningún medio.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo registrar la revisión.') }
    finally { setPending(false) }
  }

  return <aside className={styles.panel}>
    <strong>Revisión owner de Figma</strong>
    <p>Comprueba la procedencia y registra una única decisión inmutable.</p>
    <DocumentActionGroup label="Revisión de importación Figma" disabled={pending || reviewHref !== null} onAction={submit}>
      <label><span>Decisión</span><select value={decision} onChange={(event) => setDecision(event.currentTarget.value as 'approved' | 'rejected')}><option value="approved">Aprobar</option><option value="rejected">Rechazar</option></select></label>
      <label><span>Nota opcional</span><textarea name="note" maxLength={1000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <label><span>Escribe {phrase}</span><input name="confirmation" type="text" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      <button type="button" onClick={submit} disabled={pending || reviewHref !== null}>{pending ? 'Registrando…' : 'Registrar decisión'}</button>
    </DocumentActionGroup>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
    {reviewHref && <Link href={reviewHref}>Ver revisión inmutable</Link>}
  </aside>
}
