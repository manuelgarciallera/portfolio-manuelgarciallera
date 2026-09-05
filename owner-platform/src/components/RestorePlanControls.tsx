'use client'

import { FormEvent, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

import { confirmRestorePlan, executeRestorePlan } from '@/restore/client'
import styles from './RestorePlanControls.module.css'

const relationId = (value: unknown): string | number | null => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const id = (value as Record<string, unknown>).id
    if ((typeof id === 'string' || typeof id === 'number') && String(id).trim()) return id
  }
  return null
}

export const RestorePlanControls = () => {
  const document = useDocumentInfo()
  const planId = relationId(document.id)
  const pageId = relationId(document.data?.targetPage)
  const initialStatus = document.data?.status
  const [status, setStatus] = useState(initialStatus === 'ready' || initialStatus === 'confirmed' || initialStatus === 'conflict' || initialStatus === 'executed' ? initialStatus : null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  if (planId === null || status === null) return null

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pageId === null) return setMessage('La página objetivo no está disponible.')
    const phrase = new FormData(event.currentTarget).get('confirmation')?.toString() ?? ''
    setPending(true)
    try {
      const result = await confirmRestorePlan(planId, pageId, phrase)
      setStatus(result.status)
      setMessage(result.status === 'confirmed' ? 'Plan confirmado. La página sigue sin cambios.' : 'Conflicto detectado. Este plan no puede ejecutarse.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo confirmar la restauración.')
    } finally { setPending(false) }
  }

  const execute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const phrase = new FormData(event.currentTarget).get('confirmation')?.toString() ?? ''
    setPending(true)
    try {
      await executeRestorePlan(planId, phrase)
      setStatus('executed')
      setMessage('Borrador restaurado. No se ha publicado ni desplegado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo ejecutar la restauración.')
    } finally { setPending(false) }
  }

  if (status === 'conflict') return <aside className={styles.panel} data-tone="warning"><strong>Plan con conflicto</strong><p>La página cambió después de preparar el plan. Crea un plan nuevo desde la versión.</p></aside>
  if (status === 'executed') return <aside className={styles.panel} data-tone="success"><strong>Restauración ejecutada</strong><p>El resultado permanece como borrador; no se ha publicado ni desplegado.</p></aside>

  const phrase = status === 'ready' ? 'CONFIRMAR RESTAURACIÓN' : 'EJECUTAR RESTAURACIÓN'
  return (
    <aside className={styles.panel} data-tone={status === 'confirmed' ? 'warning' : 'neutral'}>
      <strong>{status === 'ready' ? 'Confirmar línea base' : 'Restaurar borrador'}</strong>
      <p>{status === 'ready' ? 'Se capturará de nuevo la página. Si cambió, el plan quedará bloqueado.' : 'La ejecución es transaccional y restaura únicamente el borrador.'}</p>
      <form onSubmit={status === 'ready' ? confirm : execute}>
        <label><span>Escribe {phrase}</span><input name="confirmation" type="text" autoComplete="off" /></label>
        <button type="submit" disabled={pending}>{pending ? 'Comprobando…' : status === 'ready' ? 'Comprobar y confirmar' : 'Restaurar como borrador'}</button>
      </form>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
    </aside>
  )
}
