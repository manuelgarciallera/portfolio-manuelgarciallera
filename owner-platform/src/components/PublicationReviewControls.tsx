'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { generatePublicationArtifact } from '@/publication/client'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const PublicationReviewControls = () => {
  const { data, id } = useDocumentInfo()
  const reviewId = identifier(id)
  const decision = data?.decision
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Generar crea un manifiesto interno; no publica ni despliega.')
  const [artifactHref, setArtifactHref] = useState<string | null>(null)
  if (reviewId === null || (decision !== 'approved' && decision !== 'rejected')) return null
  if (decision === 'rejected') return <aside className={styles.panel}><strong>Paquete rechazado</strong><p>Una revisión rechazada no puede generar artefactos.</p></aside>

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const confirmation = new FormData(event.currentTarget).get('confirmation')?.toString() ?? ''
    setPending(true)
    setArtifactHref(null)
    try {
      const artifact = await generatePublicationArtifact(reviewId, confirmation)
      setArtifactHref(artifact.href)
      setMessage('Artefacto interno generado. La web pública sigue sin cambios.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo generar el artefacto.')
    } finally { setPending(false) }
  }

  return (
    <aside className={styles.panel}>
      <strong>Generar artefacto aprobado</strong>
      <p>El manifiesto conserva hashes y procedencia para una futura exportación revisada.</p>
      <form onSubmit={submit}>
        <label><span>Escribe GENERAR ARTEFACTO</span><input name="confirmation" type="text" autoComplete="off" /></label>
        <button type="submit" disabled={pending || artifactHref !== null}>{pending ? 'Generando…' : 'Generar artefacto'}</button>
      </form>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {artifactHref && <Link href={artifactHref}>Ver artefacto inmutable</Link>}
    </aside>
  )
}
