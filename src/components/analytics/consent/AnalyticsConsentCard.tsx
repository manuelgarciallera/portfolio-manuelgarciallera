'use client'

import { useId, useRef, useState, useSyncExternalStore } from 'react'
import type { ConsentController, ConsentSnapshot } from '../../../lib/analytics-consent/controller'
import { NO_ANALYTICS, type Selection } from '../../../lib/analytics-consent/policy'
import styles from './consent.module.css'

const SERVER_SNAPSHOT: ConsentSnapshot = { consent: null, privacy: false, error: null }
const revision = (snapshot: ConsentSnapshot) => JSON.stringify(snapshot.consent)

export function AnalyticsConsentCard({ controller }: { controller: ConsentController }) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => SERVER_SNAPSHOT)
  const [visibility, setVisibility] = useState<{ open: boolean; revision: string } | null>(null)
  const [message, setMessage] = useState('')
  const reopen = useRef<HTMLButtonElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const heading = useId()
  const open = visibility?.revision === revision(snapshot) ? visibility.open : !snapshot.consent
  const error = snapshot.error === 'storage'
    ? 'No se pudo guardar tu elección. Analítica desactivada en esta pestaña; deberás elegir de nuevo en otras visitas.'
    : snapshot.error === 'provider' ? 'Analítica no disponible. Puedes seguir navegando.' : ''

  function close() {
    setVisibility({ open: false, revision: revision(controller.getSnapshot()) })
    // This persistent button stays mounted, including while the card is open.
    reopen.current?.focus({ preventScroll: true })
  }
  function save(selection: Selection) {
    if (controller.choose(selection)) {
      setMessage(selection.google || selection.umami
        ? 'Preferencias guardadas.'
        : 'Analítica rechazada.')
      close()
    }
  }

  return <div className={styles.root}>
    {open ? <section className={styles.card} aria-labelledby={heading}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close() } }}>
      <div className={styles.header}>
        <h2 id={heading} ref={title} tabIndex={-1}>Tu privacidad, tu elección</h2>
        <button type="button" className={styles.close} onClick={close}
          aria-label="Cerrar preferencias sin cambiar la elección">×</button>
      </div>
      <p>Con tu permiso, Manuel García-Llera Añón usa Google Analytics (cookies) y Umami
        para medir visitas y mejorar el portfolio.</p>
      <a className={styles.link} href="/privacidad">Privacidad y cookies</a>
      {snapshot.privacy ? <p role="status">No rastrear activado: analítica desactivada.</p> : null}
      <div className={styles.actions}>
        <button type="button" className={styles.choice} disabled={snapshot.privacy}
          onClick={() => save({ google: true, umami: true })}>Aceptar analítica</button>
        <button type="button" className={styles.choice}
          onClick={() => save({ ...NO_ANALYTICS })}>Rechazar analítica</button>
      </div>
      <Preferences key={revision(snapshot)}
        selection={snapshot.consent ?? NO_ANALYTICS} privacy={snapshot.privacy} save={save} />
      {error ? <p role="alert">{error}</p> : null}
    </section> : null}
    <div className={styles.preferences}>
      <button type="button" ref={reopen} onClick={() => {
        controller.refresh()
        setVisibility({ open: true, revision: revision(controller.getSnapshot()) })
        requestAnimationFrame(() => title.current?.focus({ preventScroll: true }))
      }}
        aria-expanded={open} className={styles.link}>Preferencias de analítica</button>
      <p role="status" className={styles.status}>{open ? '' : error || message}</p>
    </div>
  </div>
}

function Preferences({ selection, privacy, save }: {
  selection: Selection; privacy: boolean; save(selection: Selection): void
}) {
  const [state, setState] = useState<{ Body?: typeof import('./PreferencesBody').default; loading?: boolean; error?: boolean }>({})
  function load() {
    if (state.Body || state.loading) return
    setState({ loading: true })
    void import('./PreferencesBody').then(module => setState({ Body: module.default }))
      .catch(() => setState({ error: true }))
  }
  return <details className={styles.details} onToggle={event => { if (event.currentTarget.open) load() }}>
    <summary>Detalles y preferencias</summary>
    {state.Body ? <state.Body selection={selection} privacy={privacy} save={save} /> : state.error
      ? <><p role="alert">No se pudieron cargar las preferencias. Puedes reintentar o rechazar.</p>
        <button type="button" className={styles.choice} onClick={load}>Reintentar</button></>
      : state.loading ? <p role="status">Cargando preferencias…</p> : null}
  </details>
}
