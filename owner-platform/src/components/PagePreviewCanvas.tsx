'use client'

import { useState, type ReactNode } from 'react'
import styles from './PagePreview.module.css'

const sizes = { Desktop: 1280, Tablet: 768, Móvil: 390 } as const
export const PagePreviewCanvas = ({ children }: { children: ReactNode }) => {
  const [size, setSize] = useState<keyof typeof sizes>('Desktop')
  return <>
    <div className={styles.controls} role="group" aria-label="Tamaño de vista previa">
      {(Object.keys(sizes) as Array<keyof typeof sizes>).map((label) => <button key={label} type="button" aria-pressed={label === size} onClick={() => setSize(label)}>{label}</button>)}
      <span>Ancho máximo: {sizes[size]} px. Se adapta al espacio disponible.</span>
    </div>
    <div className={styles.surface} style={{ maxWidth: sizes[size] }}>{children}</div>
  </>
}
