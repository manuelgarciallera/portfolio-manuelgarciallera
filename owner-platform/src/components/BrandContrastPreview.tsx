'use client'

import { useFormFields } from '@payloadcms/ui'

import { buildBrandContrastPreview } from '@/brand/contrast-preview'
import styles from './BrandContrastPreview.module.css'

const labels: Record<string, string> = { background: 'Fondo', mutedText: 'Texto secundario', surface: 'Superficie', text: 'Texto' }

export const BrandContrastPreview = () => {
  const fields = useFormFields(([formFields]) => formFields)
  const rows = buildBrandContrastPreview(fields as Record<string, unknown>)
  return (
    <section className={styles.preview} aria-labelledby="brand-contrast-preview-title">
      <div className={styles.heading}>
        <h3 id="brand-contrast-preview-title">Contraste esencial</h3>
        <span>WCAG</span>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={`${row.foreground}:${row.background}`} data-result={row.complete ? row.passes ? 'pass' : 'fail' : 'pending'}>
            <span>{labels[row.foreground]} / {labels[row.background]}</span>
            <small>Mínimo {row.minimum}:1</small>
            <strong>{row.complete ? `${row.ratio}:1 · ${row.passes ? 'Correcto' : 'Revisar'}` : 'Pendiente'}</strong>
          </li>
        ))}
      </ul>
      <p>Esta lectura anticipa la validación obligatoria al publicar.</p>
    </section>
  )
}
