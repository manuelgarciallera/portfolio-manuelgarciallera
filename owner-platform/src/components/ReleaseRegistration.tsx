'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

import { listReleaseEvidence, registerOwnerRelease, type ReleaseEvidence } from '@/releases/client'
import styles from './ReleaseRegistration.module.css'

export const ReleaseRegistration = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [evidence, setEvidence] = useState<ReleaseEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Registrar crea evidencia restaurable; no publica ni despliega.')
  const [releaseHref, setReleaseHref] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listReleaseEvidence()
      .then((items) => { if (active) setEvidence(items) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los snapshots.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refreshKey])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const selected = evidence[Number(data.get('evidence'))]
    setPending(true)
    setReleaseHref(null)
    try {
      if (!selected) throw new TypeError('Selecciona snapshots coincidentes.')
      const result = await registerOwnerRelease({
        changeSummary: data.get('changeSummary')?.toString() ?? '',
        confirmation: data.get('confirmation')?.toString() ?? '',
        draftSnapshot: selected.draftSnapshot,
        gitCommit: data.get('gitCommit')?.toString() ?? '',
        name: data.get('name')?.toString() ?? '',
        previewSnapshot: selected.previewSnapshot,
        quality: [{
          accessibility: Number(data.get('accessibility')),
          measuredAt: new Date(data.get('measuredAt')?.toString() ?? '').toISOString(),
          performance: Number(data.get('performance')),
          source: data.get('source') === 'manual' ? 'manual' : 'lighthouse',
          usability: Number(data.get('usability')),
          viewport: data.get('viewport') === 'mobile' ? 'mobile' : 'desktop',
        }],
      })
      setReleaseHref(result.href)
      setMessage('Versión registrada y auditada. La web pública sigue sin cambios.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la versión.')
    } finally { setPending(false) }
  }

  return (
    <details className={styles.registration}>
      <summary>Registrar versión verificada</summary>
      <p>Solo aparecen pares visual/restaurable de la misma revisión.</p>
      {loading ? <p role="status">Cargando snapshots…</p> : evidence.length === 0 ? <p>No hay pares de snapshots disponibles.</p> : (
        <form onSubmit={submit}>
          <div className={styles.identity}>
            <label><span>Snapshots coincidentes</span><select name="evidence" required>{evidence.map((item, index) => <option value={index} key={`${item.previewSnapshot}-${item.draftSnapshot}`}>{item.label}</option>)}</select></label>
            <label><span>Nombre</span><input name="name" maxLength={120} required /></label>
            <label><span>Commit Git completo</span><input name="gitCommit" minLength={40} maxLength={40} pattern="[a-f0-9]{40}" required /></label>
            <label className={styles.summary}><span>Resumen de cambios</span><textarea name="changeSummary" maxLength={500} rows={2} required /></label>
          </div>
          <fieldset>
            <legend>Medición de calidad</legend>
            <label><span>Viewport</span><select name="viewport"><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select></label>
            <label><span>Rendimiento</span><input name="performance" type="number" min={0} max={100} required /></label>
            <label><span>Usabilidad</span><input name="usability" type="number" min={0} max={100} required /></label>
            <label><span>Accesibilidad</span><input name="accessibility" type="number" min={0} max={100} required /></label>
            <label><span>Fuente</span><select name="source"><option value="lighthouse">Lighthouse</option><option value="manual">Manual</option></select></label>
            <label><span>Medida en</span><input name="measuredAt" type="datetime-local" required /></label>
          </fieldset>
          <div className={styles.confirmation}>
            <label><span>Escribe <strong>REGISTRAR VERSIÓN</strong></span><input name="confirmation" autoComplete="off" required /></label>
            <button type="submit" disabled={pending || releaseHref !== null}>{pending ? 'Registrando…' : 'Registrar versión'}</button>
          </div>
        </form>
      )}
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {releaseHref && <Link href={releaseHref}>Ver versión inmutable</Link>}
    </details>
  )
}
