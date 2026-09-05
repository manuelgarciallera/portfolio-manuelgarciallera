'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import Link from 'next/link'

import { submitAnalyticsImport } from '@/analytics/import-client'
import styles from './AnalyticsImporter.module.css'

export const AnalyticsImporter = () => {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('Importa un agregado JSON; no se cargan datos personales ni se añade tracking.')
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState(false)

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0] ?? null
    setFile(selected)
    setCreated(false)
    setMessage(selected ? `${selected.name} · ${Math.max(1, Math.ceil(selected.size / 1024))} KiB` : 'Selecciona un archivo JSON.')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) return setMessage('Selecciona un archivo JSON.')
    setPending(true)
    setCreated(false)
    setMessage('Verificando e importando…')
    try {
      await submitAnalyticsImport(await file.text())
      setCreated(true)
      setMessage('Snapshot verificado e importado. La analítica del dashboard se actualizará al recargar.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo importar el snapshot analítico.')
    } finally {
      setPending(false)
    }
  }

  return (
    <details className={styles.importer}>
      <summary><span>Importar analítica</span><small>Agregados verificados · sin tracking</small></summary>
      <div className={styles.body}>
        <p>Archivo JSON de hasta 256 KiB con periodo, totales, rutas y Core Web Vitals. El original no se publica ni se conecta a proveedores externos.</p>
        <form onSubmit={submit}>
          <label htmlFor="analytics-import-file">Snapshot analítico</label>
          <div className={styles.controls}>
            <input id="analytics-import-file" name="snapshot" type="file" accept="application/json,.json" onChange={selectFile} />
            <button type="submit" disabled={!file || pending}>{pending ? 'Importando…' : 'Importar snapshot'}</button>
          </div>
        </form>
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        {created && <Link className={styles.history} href="/admin/collections/analytics-snapshots">Ver snapshots importados</Link>}
      </div>
    </details>
  )
}
