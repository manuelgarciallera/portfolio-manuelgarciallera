import { useId, useState } from 'react'
import { NO_ANALYTICS, type Selection } from '../../../lib/analytics-consent/policy'
import styles from './consent.module.css'

export default function PreferencesBody({ selection, privacy, save }: {
  selection: Selection; privacy: boolean; save(selection: Selection): void
}) {
  const [draft, setDraft] = useState<Selection>({ google: selection.google, umami: selection.umami })
  const id = useId()
  return <>
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
  </>
}
