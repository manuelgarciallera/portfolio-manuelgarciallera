'use client'

import { useEffect, useState } from 'react'
import { loadAssistanceReview } from '@/assist/review-client'
import type { AssistanceReview as Review } from '@/assist/review-types'
import styles from './AssistanceReview.module.css'

const operationNames = { add: 'Añadir', remove: 'Eliminar', replace: 'Sustituir' }

export const AssistanceReview = ({ proposalId }: { proposalId: string | number }) => {
  const [result, setResult] = useState<{ id: string; review?: Review; error?: string } | null>(null)
  const id = String(proposalId)
  useEffect(() => {
    let active = true
    loadAssistanceReview(id).then(
      (review) => { if (active) setResult({ id, review }) },
      () => { if (active) setResult({ id, error: 'No se pudo cargar la comparación. Recarga la página para volver a intentarlo.' }) },
    )
    return () => { active = false }
  }, [id])
  const current = result?.id === id ? result : null

  return (
    <section className={styles.review} aria-label="Cambios propuestos" aria-busy={!current}>
      <h3>Cambios propuestos</h3>
      <p>Comparación con la versión guardada, no con el borrador actual. No aplica cambios ni publica.</p>
      {!current ? <p role="status">Cargando comparación…</p> : current.error ? <p role="alert">{current.error}</p> : current.review ? <>
        <ol className={styles.changes}>
          {current.review.changes.map((change, index) => <li key={`${index}:${change.path}`}>
            <h4>{change.label}</h4>
            <p className={styles.operation}>{operationNames[change.operation]}</p>
            <dl className={styles.values}>
              <div><dt>Antes{index > 0 && current.review!.changes.slice(0, index).some((previous) => previous.path === change.path) ? ' (tras el paso anterior)' : ''}</dt><dd>{change.before.text}</dd></div>
              <div><dt>Propuesto</dt><dd>{change.proposed.text}</dd></div>
            </dl>
          </li>)}
        </ol>
        <details><summary>Referencia de la versión</summary><p className={styles.hash}>{current.review.snapshotHash}</p></details>
      </> : null}
    </section>
  )
}
