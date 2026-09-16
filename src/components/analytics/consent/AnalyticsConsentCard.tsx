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

  function close() {
    setVisibility({ open: false, revision: revision(controller.getSnapshot()) })
    // This persistent button stays mounted, including while the card is open.
    reopen.current?.focus({ preventScroll: true })
  }
  function save(selection: Selection) {
    if (controller.choose(selection)) {
      setMessage(selection.google || selection.umami
        ? 'Preferencias guardadas. Puedes cambiarlas cuando quieras.'
        : 'Analítica rechazada. Puedes seguir navegando con normalidad.')
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
        para conocer las visitas y mejorar este portfolio. Puedes aceptar, rechazar o elegir cada herramienta.</p>
      <a className={styles.link} href="/privacidad">Privacidad y cookies</a>
      {snapshot.privacy ? <p role="status">Tu navegador solicita no ser rastreado. La analítica permanece desactivada.</p> : null}
      <div className={styles.actions}>
        <button type="button" className={styles.choice} disabled={snapshot.privacy}
          onClick={() => save({ google: true, umami: true })}>Aceptar analítica</button>
        <button type="button" className={styles.choice}
          onClick={() => save({ ...NO_ANALYTICS })}>Rechazar analítica</button>
      </div>
      <Preferences key={`${snapshot.consent?.savedAt ?? 'new'}-${snapshot.consent?.google}-${snapshot.consent?.umami}`}
        selection={snapshot.consent ?? NO_ANALYTICS} privacy={snapshot.privacy} save={save} />
      {snapshot.error === 'storage' ? <p role="alert">No se pudo guardar tu elección. La analítica está
        desactivada en esta pestaña. Es posible que debas elegir de nuevo en otra visita.</p> : null}
      {snapshot.error === 'provider' ? <p role="status">Una herramienta de analítica no se ha podido activar.
        Puedes seguir navegando.</p> : null}
    </section> : null}
    <div className={styles.preferences}>
      <button type="button" ref={reopen} onClick={() => {
        controller.refresh()
        setVisibility({ open: true, revision: revision(controller.getSnapshot()) })
        requestAnimationFrame(() => title.current?.focus({ preventScroll: true }))
      }}
        aria-expanded={open} className={styles.link}>Preferencias de analítica</button>
      <p role="status" className={styles.status}>{snapshot.error === 'provider'
        ? 'Una herramienta de analítica no está disponible. Puedes seguir navegando.'
        : snapshot.error === 'storage' ? 'La analítica está desactivada: no se pudo guardar tu elección.' : message}</p>
    </div>
  </div>
}

function Preferences({ selection, privacy, save }: {
  selection: Selection; privacy: boolean; save(selection: Selection): void
}) {
  const [draft, setDraft] = useState<Selection>({ google: selection.google, umami: selection.umami })
  const id = useId()
  return <details className={styles.details}>
    <summary>Detalles y preferencias</summary>
    <p>La finalidad es medir el uso del portfolio. No usamos estas herramientas para publicidad.
      Rechazar no limita el acceso a los contenidos.</p>
    <fieldset>
      <legend>Herramientas de analítica opcionales</legend>
      <label className={styles.option}>
        <input type="checkbox" checked={!privacy && draft.google} disabled={privacy}
          aria-labelledby={`${id}-google`} aria-describedby={`${id}-google-description`}
          onChange={event => setDraft({ ...draft, google: event.target.checked })} />
        <span><span id={`${id}-google`}>Google Analytics</span><small id={`${id}-google-description`}>Visitas y uso de páginas mediante cookies e identificadores.
          Google recibe los datos de medición.</small></span>
      </label>
      <label className={styles.option}>
        <input type="checkbox" checked={!privacy && draft.umami} disabled={privacy}
          aria-labelledby={`${id}-umami`} aria-describedby={`${id}-umami-description`}
          onChange={event => setDraft({ ...draft, umami: event.target.checked })} />
        <span><span id={`${id}-umami`}>Umami</span><small id={`${id}-umami-description`}>Estadísticas de visitas sin cookies de seguimiento.
          Umami Cloud recibe los datos de medición.</small></span>
      </label>
    </fieldset>
    <p>Guardamos esta elección en tu navegador durante 180 días. Puedes retirarla en «Preferencias de analítica».
      Retirarla no borra los datos ya recogidos.</p>
    <button type="button" className={styles.choice} onClick={() => save(privacy ? NO_ANALYTICS : draft)}>Guardar selección</button>
  </details>
}
