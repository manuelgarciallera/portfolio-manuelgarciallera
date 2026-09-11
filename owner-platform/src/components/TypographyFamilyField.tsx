'use client'

import { useId } from 'react'
import { TextField, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import { previewFontStack } from '../brand/typography'
import styles from './TypographyFamilyField.module.css'

const families = [
  { value: '', label: 'Heredar / fuente del sistema' },
  { value: 'sans-serif', label: 'Sans serif — sin remates' },
  { value: 'serif', label: 'Serif — con remates' },
  { value: 'monospace', label: 'Monoespaciada' },
  { value: 'Arial', label: 'Arial (si está instalada)' },
  { value: 'Georgia', label: 'Georgia (si está instalada)' },
  { value: 'Verdana', label: 'Verdana (si está instalada)' },
]

export const TypographyFamilyField = (props: TextFieldClientProps) => {
  const { disabled, setValue, value } = useField<string>({ path: props.path })
  const id = useId()
  const current = typeof value === 'string' ? value : ''
  const known = families.some((family) => family.value === current)
  const title = typeof props.field.label === 'string' ? props.field.label : 'Familia tipográfica'
  return (
    <div className={styles.field}>
      <TextField {...props} />
      <label htmlFor={id}>Elegir estilo · {title}</label>
      <select id={id} disabled={props.readOnly || disabled} value={current}
        aria-describedby={`${id}-help`}
        onChange={(event) => setValue(event.target.value)}>
        {!known && <option value={current}>Actual: {current}</option>}
        {families.map(({ value: family, label }) => <option key={family} value={family}>{label}</option>)}
      </select>
      <p id={`${id}-help`} className={styles.help}>Puedes elegir una opción o escribir otra familia arriba. La muestra usa las fuentes de este dispositivo; no se descarga ninguna.</p>
      <div className={styles.sample} role="img" aria-label={`Muestra de ${title}: ${current || 'fuente del sistema'}`}
        style={{ fontFamily: previewFontStack(current) }}>
        Diseña con intención<br /><span>Aa Bb Ññ · 0123456789</span>
      </div>
    </div>
  )
}
