'use client'

import { useFormFields } from '@payloadcms/ui'

import { buildBrandPalettePreview } from '@/brand/preview'
import styles from './BrandPalettePreview.module.css'

const roleLabels: Record<string, string> = {
  accent: 'Acento', background: 'Fondo', danger: 'Peligro', interaction: 'Interacción',
  mutedText: 'Texto secundario', success: 'Éxito', surface: 'Superficie', text: 'Texto',
}

export const BrandPalettePreview = () => {
  const fields = useFormFields(([formFields]) => formFields)
  const preview = buildBrandPalettePreview(fields as Record<string, unknown>)
  return (
    <section className={styles.preview} aria-labelledby="brand-palette-preview-title">
      <div className={styles.heading}>
        <h3 id="brand-palette-preview-title">Proporción de color</h3>
        <span data-complete={preview.complete}>{preview.total}%</span>
      </div>
      {preview.segments.length > 0 ? (
        <>
          <div className={styles.bar} role="img" aria-label={`Distribución cromática: ${preview.total}% definido`}>
            {preview.segments.map((segment) => <span key={segment.role} style={{ backgroundColor: segment.color, width: `${segment.weight}%` }} />)}
          </div>
          <ul className={styles.legend}>
            {preview.segments.map((segment) => (
              <li key={segment.role}><i style={{ backgroundColor: segment.color }} /><span>{roleLabels[segment.role] ?? segment.role}</span><strong>{segment.weight}%</strong></li>
            ))}
          </ul>
        </>
      ) : <p>Añade colores y porcentajes para previsualizar la distribución.</p>}
      {!preview.complete && preview.total > 0 && <p className={styles.notice}>La distribución debe sumar 100% y cada rol necesita un color válido.</p>}
    </section>
  )
}
