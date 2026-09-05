'use client'

import { FormEvent, useRef, useState } from 'react'

import { prepareFigmaImportPlan } from '@/connectors/figma/import-client'
import { presentFigmaDiscovery } from '@/connectors/figma/presentation'
import styles from './FigmaExplorer.module.css'

type View = ReturnType<typeof presentFigmaDiscovery>

export const FigmaExplorer = () => {
  const controller = useRef<AbortController | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [source, setSource] = useState('')
  const [message, setMessage] = useState('Solo lectura. No importa ni sustituye archivos.')
  const [pending, setPending] = useState(false)
  const [pendingCandidate, setPendingCandidate] = useState<string | null>(null)
  const [preparedHref, setPreparedHref] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const source = new FormData(event.currentTarget).get('source')?.toString().trim() ?? ''
    if (!source) return setMessage('Pega un enlace válido de Figma.')
    controller.current?.abort()
    const next = new AbortController()
    controller.current = next
    setPending(true)
    setMessage('Leyendo Figma…')
    try {
      const response = await fetch('/api/owner/figma/discover', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source }), signal: next.signal })
      const data = await response.json() as unknown
      if (!response.ok) throw new Error('Discovery failed')
      const result = presentFigmaDiscovery(data)
      setView(result)
      setSource(source)
      setPreparedHref(null)
      setMessage(result.candidates.length ? `${result.candidates.length} candidatos encontrados.` : 'No se encontraron frames, secciones o componentes.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setView(null)
      setMessage('No se pudo leer el enlace. Revisa la configuración y vuelve a intentarlo.')
    } finally { if (controller.current === next) setPending(false) }
  }

  const prepare = async (candidateId: string) => {
    setPendingCandidate(candidateId)
    setPreparedHref(null)
    try {
      const result = await prepareFigmaImportPlan(source, candidateId)
      setPreparedHref(result.href)
      setMessage('Plan inmutable preparado. Aún no se ha descargado ni sustituido ninguna imagen.')
    } catch {
      setMessage('No se pudo preparar el plan. Vuelve a explorar el archivo y reinténtalo.')
    } finally { setPendingCandidate(null) }
  }

  return (
    <details className={styles.explorer}>
      <summary><span>Explorar Figma</span><small>Conector privado · solo lectura</small></summary>
      <div className={styles.body}>
        <form onSubmit={submit}>
          <label htmlFor="figma-source">Enlace de archivo, prototipo o nodo</label>
          <div><input id="figma-source" name="source" type="url" required placeholder="https://www.figma.com/design/…" autoComplete="off" /><button type="submit" disabled={pending}>{pending ? 'Leyendo…' : 'Explorar'}</button></div>
        </form>
        <p role="status" aria-live="polite">{message}</p>
        {view && <section aria-label={`Candidatos de ${view.fileName}`}>
          <h3>{view.fileName}</h3>
          {view.notice && <p>{view.notice}</p>}
          <ul>{view.candidates.map((candidate) => <li key={candidate.id}>
            {/* Temporary signed Figma previews cannot use Next image optimization or become durable media. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {candidate.previewUrl && <img src={candidate.previewUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />}
            <div><strong>{candidate.name}</strong><small>{candidate.type}{candidate.dimensions ? ` · ${candidate.dimensions}` : ''}</small><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Abrir nodo en Figma</a><button type="button" disabled={pendingCandidate !== null} onClick={() => void prepare(candidate.id)}>{pendingCandidate === candidate.id ? 'Verificando…' : 'Preparar importación'}</button></div>
          </li>)}</ul>
          {preparedHref && <p><a href={preparedHref}>Revisar plan preparado</a></p>}
        </section>}
      </div>
    </details>
  )
}
