'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

import {
  listPublicationCandidates,
  orderPublicationCandidates,
  preparePublicationBundle,
  reorderPublicationSelection,
  type PublicationCandidate,
} from '@/publication/client'
import styles from './PublicationPreparation.module.css'

export const PublicationPreparation = () => {
  const [candidates, setCandidates] = useState<PublicationCandidate[]>([])
  const [selected, setSelected] = useState<Array<string | number>>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Selecciona y ordena versiones verificadas. Preparar no publica ni despliega.')
  const [bundleHref, setBundleHref] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void listPublicationCandidates()
      .then((items) => { if (active) setCandidates(items) })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'No se pudieron cargar las versiones.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const toggle = (id: string | number) => setSelected((current) => current.some((value) => String(value) === String(id))
    ? current.filter((value) => String(value) !== String(id))
    : [...current, id])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setPending(true)
    setBundleHref(null)
    try {
      const result = await preparePublicationBundle({
        confirmation: data.get('confirmation')?.toString() ?? '',
        name: data.get('name')?.toString() ?? '',
        releaseIds: selected,
      })
      setBundleHref(result.href)
      setMessage('Paquete preparado como evidencia inmutable. La web pública sigue sin cambios.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo preparar el paquete.')
    } finally { setPending(false) }
  }

  return (
    <details className={styles.preparation}>
      <summary>Preparar paquete de publicación</summary>
      <p>Este paso agrupa versiones verificadas para revisión; no tiene acceso a publicación ni despliegue.</p>
      {loading ? <p role="status">Cargando versiones…</p> : candidates.length === 0 ? <p>No hay versiones verificadas disponibles.</p> : (
        <form onSubmit={submit}>
          <fieldset>
            <legend>Versiones y orden del paquete</legend>
            <ul>
              {orderPublicationCandidates(candidates, selected).map((candidate) => {
                const order = selected.findIndex((value) => String(value) === String(candidate.id))
                return (
                  <li key={candidate.id} data-selected={order >= 0}>
                    <label>
                      <input type="checkbox" checked={order >= 0} onChange={() => toggle(candidate.id)} />
                      <span><strong>{candidate.name}</strong><small>{candidate.changeSummary}</small></span>
                    </label>
                    {order >= 0 && <div aria-label={`Orden de ${candidate.name}`}>
                      <span>{order + 1}</span>
                      <button type="button" disabled={order === 0} onClick={() => setSelected((current) => reorderPublicationSelection(current, candidate.id, -1))} aria-label={`Subir ${candidate.name}`}>↑</button>
                      <button type="button" disabled={order === selected.length - 1} onClick={() => setSelected((current) => reorderPublicationSelection(current, candidate.id, 1))} aria-label={`Bajar ${candidate.name}`}>↓</button>
                    </div>}
                  </li>
                )
              })}
            </ul>
          </fieldset>
          <div className={styles.fields}>
            <label><span>Nombre del paquete</span><input name="name" maxLength={120} required /></label>
            <label><span>Escribe <strong>PREPARAR PUBLICACIÓN</strong></span><input name="confirmation" autoComplete="off" required /></label>
            <button type="submit" disabled={pending || selected.length === 0 || bundleHref !== null}>{pending ? 'Preparando…' : 'Preparar paquete'}</button>
          </div>
        </form>
      )}
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {bundleHref && <Link href={bundleHref}>Revisar paquete inmutable</Link>}
    </details>
  )
}
