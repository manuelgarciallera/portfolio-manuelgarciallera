'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'

import { executeFigmaImport } from '@/connectors/figma/import-execution-client'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const FigmaImportReviewControls = () => {
  const { data, id } = useDocumentInfo()
  const reviewId = identifier(id)
  const decision = data?.decision
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('La importación crea un medio en borrador; no publica ni modifica ninguna página.')
  const [destinations, setDestinations] = useState<{ executionHref: string; mediaHref: string; placementHref: string } | null>(null)
  if (reviewId === null || (decision !== 'approved' && decision !== 'rejected')) return null
  if (decision === 'rejected') return <aside className={styles.panel}><strong>Importación rechazada</strong><p>Una revisión rechazada no puede crear medios.</p></aside>

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true); setDestinations(null)
    try {
      const result = await executeFigmaImport(reviewId, { alt: String(form.get('alt') ?? ''), confirmation: String(form.get('confirmation') ?? '') })
      setDestinations(result)
      setMessage('PNG importado como medio en borrador. La web pública sigue sin cambios.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo importar la imagen.') }
    finally { setPending(false) }
  }

  return <aside className={styles.panel}>
    <strong>Importar PNG aprobado</strong>
    <p>Figma se verifica de nuevo y el render se limita a 20 MiB antes de guardarse como borrador.</p>
    <form onSubmit={submit}>
      <label><span>Texto alternativo</span><input name="alt" type="text" maxLength={500} required /></label>
      <label><span>Escribe IMPORTAR PNG DE FIGMA</span><input name="confirmation" type="text" autoComplete="off" /></label>
      <button type="submit" disabled={pending || destinations !== null}>{pending ? 'Importando…' : 'Importar como borrador'}</button>
    </form>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
    {destinations && <p><Link href={destinations.placementHref}>Ajustar encuadre</Link> · <Link href={destinations.mediaHref}>Editar medio</Link> · <Link href={destinations.executionHref}>Ver evidencia</Link></p>}
  </aside>
}
