'use client'

import { TextField, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

import { normalizeHex } from '@/brand/validation'
import styles from './HexColorField.module.css'

const safePickerValue = (value: unknown): string => {
  try { return normalizeHex(value) } catch { return '#000000' }
}

export const HexColorField = (props: TextFieldClientProps) => {
  const { setValue, value } = useField<string>({ path: props.path })
  return (
    <div className={styles.field}>
      <TextField {...props} />
      <label className={styles.picker}>
        <span>Selector visual</span>
        <input
          aria-label="Seleccionar color"
          disabled={props.readOnly}
          type="color"
          value={safePickerValue(value)}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
        />
      </label>
    </div>
  )
}
