'use client'

import { FormEvent, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

import { decideAssistanceProposal } from '@/assist/client'
import styles from './PublicationBundleControls.module.css'

const identifier = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? value : null

export const AssistanceProposalControls = () => {
  const { data, id } = useDocumentInfo()
  const proposalId = identifier(id)
  const status = data?.status
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted')
  const [pending, setPending] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState('La decisión clasifica la propuesta; no aplica cambios ni publica.')
  if (proposalId === null || !['pending', 'accepted', 'rejected'].includes(String(status))) return null
  if (status !== 'pending' || completed) return <aside className={styles.panel}><strong>Propuesta {status === 'rejected' || decision === 'rejected' ? 'rechazada' : 'aceptada'}</strong><p>La decisión es inmutable y no ha aplicado el patch a la página.</p></aside>

  const phrase = decision === 'accepted' ? 'ACEPTAR PROPUESTA' : 'RECHAZAR PROPUESTA'
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPending(true)
    try {
      await decideAssistanceProposal(proposalId, {
        confirmation: data.get('confirmation')?.toString() ?? '',
        decision,
        note: data.get('note')?.toString(),
      })
      setCompleted(true)
      setMessage(decision === 'accepted' ? 'Propuesta aceptada como evidencia. No se ha aplicado.' : 'Propuesta rechazada. La página no se ha modificado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la decisión.')
    } finally { setPending(false) }
  }

  return (
    <aside className={styles.panel}>
      <strong>Decisión owner de la propuesta</strong>
      <p>Revisa el patch antes de registrar una decisión única.</p>
      <form onSubmit={submit}>
        <label><span>Decisión</span><select value={decision} onChange={(event) => setDecision(event.currentTarget.value as 'accepted' | 'rejected')}><option value="accepted">Aceptar como propuesta revisada</option><option value="rejected">Rechazar</option></select></label>
        <label><span>Nota opcional</span><textarea name="note" maxLength={1000} rows={2} /></label>
        <label><span>Escribe {phrase}</span><input name="confirmation" type="text" autoComplete="off" /></label>
        <button type="submit" disabled={pending}>{pending ? 'Registrando…' : 'Registrar decisión'}</button>
      </form>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
    </aside>
  )
}
