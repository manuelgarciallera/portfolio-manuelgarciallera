'use client'

import { FormEvent, useEffect, useState } from 'react'

import { createAssistanceProposal, listAssistanceSnapshots, loadAssistanceContext, parseAssistancePatch, type AssistanceSnapshot } from '@/assist/client'
import styles from './ReleaseRegistration.module.css'

const example = JSON.stringify({
  schemaVersion: 1,
  capability: 'suggestMotion',
  operations: [{ op: 'replace', path: '/brand/motion/duration', value: 800 }],
}, null, 2)

export const AssistancePreparation = () => {
  const [snapshots, setSnapshots] = useState<AssistanceSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [loadingContext, setLoadingContext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [contextJSON, setContextJSON] = useState('')
  const [proposalHref, setProposalHref] = useState<string | null>(null)
  const [message, setMessage] = useState('Importar una propuesta no modifica el borrador ni la web pública.')

  useEffect(() => {
    let active = true
    void listAssistanceSnapshots()
      .then((items) => { if (active) setSnapshots(items) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudieron cargar los snapshots.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const snapshot = snapshots[Number(fields.get('snapshot'))]
    setPending(true)
    setProposalHref(null)
    try {
      if (!snapshot) throw new TypeError('Selecciona un snapshot.')
      const patch = parseAssistancePatch(String(fields.get('patch') ?? ''))
      const proposal = await createAssistanceProposal(snapshot.id, patch)
      setProposalHref(`/admin/collections/assistance-proposals/${encodeURIComponent(String(proposal.id))}`)
      setMessage(`Propuesta ${proposal.capability} creada como pendiente. Revísala antes de decidir.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo crear la propuesta.')
    } finally { setPending(false) }
  }

  const prepareContext = async () => {
    const snapshot = snapshots[selectedIndex]
    setLoadingContext(true)
    try {
      if (!snapshot) throw new TypeError('Selecciona un snapshot.')
      const contextPackage = await loadAssistanceContext(snapshot.id)
      setContextJSON(JSON.stringify(contextPackage, null, 2))
      setMessage('Contexto verificado preparado. Puedes copiarlo a la herramienta que prefieras.')
    } catch (error) {
      setContextJSON('')
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el contexto.')
    } finally { setLoadingContext(false) }
  }

  return (
    <details className={styles.registration}>
      <summary>Importar propuesta asistida</summary>
      <p>Pega un patch JSON generado externamente. El servidor vuelve a validar el snapshot, los permisos y cada operación.</p>
      {loading ? <p role="status">Cargando snapshots…</p> : snapshots.length === 0 ? <p>No hay snapshots de previsualización disponibles.</p> : (
        <form onSubmit={submit}>
          <div className={styles.proposal}>
            <label><span>Snapshot verificado</span><select name="snapshot" required value={selectedIndex} onChange={(event) => { setSelectedIndex(Number(event.target.value)); setContextJSON('') }}>{snapshots.map((snapshot, index) => <option value={index} key={snapshot.id}>{snapshot.label}</option>)}</select></label>
            <button type="button" disabled={loadingContext} onClick={() => void prepareContext()}>{loadingContext ? 'Preparando…' : 'Preparar contexto para IA'}</button>
            {contextJSON && <label className={styles.summary}><span>Contexto exportable (solo lectura)</span><textarea value={contextJSON} rows={12} readOnly spellCheck={false} /></label>}
            <label className={styles.summary}><span>Patch JSON</span><textarea name="patch" defaultValue={example} rows={12} required spellCheck={false} /></label>
            <button type="submit" disabled={pending}>{pending ? 'Validando…' : 'Crear propuesta pendiente'}</button>
          </div>
        </form>
      )}
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {proposalHref && <a href={proposalHref}>Revisar propuesta</a>}
    </details>
  )
}
