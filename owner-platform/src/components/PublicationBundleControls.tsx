'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { reviewPublicationBundle } from '@/publication/client'
import { DocumentActionGroup } from './DocumentActionGroup'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const PublicationBundleControls = () => {
  const { id } = useDocumentInfo()
  const bundleId = identifier(id)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La revisión registra una decisión; no publica ni despliega.')
  const [reviewHref, setReviewHref] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [note, setNote] = useState('')
  if (bundleId === null) return null

  const submit = async () => {
    if (pending || reviewHref !== null) return
    setPending(true)
    setReviewHref(null)
    try {
      const result = await reviewPublicationBundle(bundleId, {
        confirmation,
        decision,
        note,
      })
      setReviewHref(result.href)
      setMessage(result.decision === 'approved' ? 'Paquete aprobado como evidencia. Aún no está publicado.' : 'Paquete rechazado. No se ha modificado la web pública.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la revisión.')
    } finally { setPending(false) }
  }

  const phrase = decision === 'approved' ? 'APROBAR PAQUETE' : 'RECHAZAR PAQUETE'
  return (
    <aside className={styles.panel}>
      <strong>Revisión owner del paquete</strong>
      <p>Comprueba el contenido y registra una única decisión inmutable.</p>
      <DocumentActionGroup label="Revisión del paquete" disabled={pending || reviewHref !== null} onAction={submit}>
        <label><span>Decisión</span><select value={decision} onChange={(event) => setDecision(event.currentTarget.value as 'approved' | 'rejected')}><option value="approved">Aprobar</option><option value="rejected">Rechazar</option></select></label>
        <label><span>Nota opcional</span><textarea name="note" maxLength={1000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label><span>Escribe {phrase}</span><input name="confirmation" type="text" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        <button type="button" onClick={submit} disabled={pending || reviewHref !== null}>{pending ? 'Registrando…' : 'Registrar decisión'}</button>
      </DocumentActionGroup>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {reviewHref && <Link href={reviewHref}>Ver revisión inmutable</Link>}
    </aside>
  )
}
