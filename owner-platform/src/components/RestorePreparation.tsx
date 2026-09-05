'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

import { prepareRestorePlan } from '@/restore/client'
import styles from './RestorePreparation.module.css'

export const RestorePreparation = ({ href, versionName }: { href: string; versionName: string }) => {
  const [message, setMessage] = useState('Preparar no modifica la página.')
  const [pending, setPending] = useState(false)
  const [planHref, setPlanHref] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const confirmation = new FormData(event.currentTarget).get('confirmation')?.toString() ?? ''
    setPending(true)
    setPlanHref(null)
    try {
      const plan = await prepareRestorePlan(href, confirmation)
      setPlanHref(plan.href)
      setMessage('Plan preparado. Revísalo antes de cualquier confirmación.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo preparar la restauración.')
    } finally {
      setPending(false)
    }
  }

  return (
    <details className={styles.restore}>
      <summary>Restaurar esta versión</summary>
      <form onSubmit={submit}>
        <label>
          <span>Escribe <strong>PREPARAR RESTAURACIÓN</strong></span>
          <input name="confirmation" type="text" autoComplete="off" aria-label={`Confirmación para restaurar ${versionName}`} />
        </label>
        <button type="submit" disabled={pending}>{pending ? 'Preparando…' : 'Preparar plan'}</button>
      </form>
      <p role="status" aria-live="polite">{message}</p>
      {planHref && <Link href={planHref}>Revisar plan preparado</Link>}
    </details>
  )
}
