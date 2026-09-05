'use client'

import { FormEvent, useEffect, useState } from 'react'

import { captureSnapshotPair, listSnapshotPages, type SnapshotPage } from '@/preview/client'
import styles from './ReleaseRegistration.module.css'

export const SnapshotCapture = ({ onCaptured }: { onCaptured: () => void }) => {
  const [pages, setPages] = useState<SnapshotPage[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Capturar no cambia el borrador ni la web pública.')

  useEffect(() => {
    let active = true
    void listSnapshotPages()
      .then((items) => { if (active) setPages(items) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las páginas.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const selected = pages[Number(new FormData(event.currentTarget).get('page'))]
    setPending(true)
    try {
      if (!selected) throw new TypeError('Selecciona una página.')
      await captureSnapshotPair(selected.id)
      setMessage('Par de snapshots creado y auditado. Ya está disponible para registrar una versión.')
      onCaptured()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron crear los snapshots.')
    } finally { setPending(false) }
  }

  return (
    <details className={styles.registration}>
      <summary>Capturar revisión de una página</summary>
      <p>Crea evidencia visual y restaurable del mismo borrador actual.</p>
      {loading ? <p role="status">Cargando páginas…</p> : pages.length === 0 ? <p>No hay páginas disponibles.</p> : (
        <form onSubmit={submit}>
          <div className={styles.confirmation}>
            <label><span>Página</span><select name="page" required>{pages.map((page, index) => <option value={index} key={page.id}>{page.label}</option>)}</select></label>
            <button type="submit" disabled={pending}>{pending ? 'Capturando…' : 'Crear par de snapshots'}</button>
          </div>
        </form>
      )}
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
    </details>
  )
}
