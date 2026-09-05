'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { reviewPublicationBundle } from '@/publication/client'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const PublicationBundleControls = () => {
  const { id } = useDocumentInfo()
  const bundleId = identifier(id)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La revisión registra una decisión; no publica ni despliega.')
  const [reviewHref, setReviewHref] = useState<string | null>(null)
  if (bundleId === null) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPending(true)
    setReviewHref(null)
    try {
      const result = await reviewPublicationBundle(bundleId, {
        confirmation: data.get('confirmation')?.toString() ?? '',
        decision,
        note: data.get('note')?.toString(),
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
      <form onSubmit={submit}>
        <label><span>Decisión</span><select value={decision} onChange={(event) => setDecision(event.currentTarget.value as 'approved' | 'rejected')}><option value="approved">Aprobar</option><option value="rejected">Rechazar</option></select></label>
        <label><span>Nota opcional</span><textarea name="note" maxLength={1000} rows={2} /></label>
        <label><span>Escribe {phrase}</span><input name="confirmation" type="text" autoComplete="off" /></label>
        <button type="submit" disabled={pending || reviewHref !== null}>{pending ? 'Registrando…' : 'Registrar decisión'}</button>
      </form>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {reviewHref && <Link href={reviewHref}>Ver revisión inmutable</Link>}
    </aside>
  )
}
