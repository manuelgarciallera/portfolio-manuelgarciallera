'use client'

import { useFormFields } from '@payloadcms/ui'
import { useState, type CSSProperties } from 'react'

import { buildBrandMotionPreview } from '@/brand/motion-preview'
import styles from './BrandMotionPreview.module.css'

type PreviewStyle = CSSProperties & { '--motion-delay': string; '--motion-travel': string }

export const BrandMotionPreview = () => {
  const fields = useFormFields(([formFields]) => formFields)
  const motion = buildBrandMotionPreview(fields as Record<string, unknown>)
  const [run, setRun] = useState(0)
  return (
    <section className={styles.preview} aria-labelledby="brand-motion-preview-title">
      <div className={styles.heading}>
        <div>
          <h3 id="brand-motion-preview-title">Movimiento</h3>
          <p>{motion.duration} ms · {motion.stagger} ms · {motion.travel} px · {motion.easing}</p>
        </div>
        <button type="button" onClick={() => setRun((value) => value + 1)}>Repetir</button>
      </div>
      <div className={styles.stage} key={run} aria-label="Previsualización de aparición escalonada">
        {[0, 1, 2].map((index) => (
          <span key={index} style={{
            '--motion-delay': `${index * motion.stagger}ms`,
            '--motion-travel': `${motion.travel}px`,
            animationDuration: `${motion.duration}ms`,
            animationTimingFunction: motion.easing,
          } as PreviewStyle} />
        ))}
      </div>
      <p className={styles.note}>{motion.complete ? `Movimiento reducido: ${motion.reducedMotion === 'disable' ? 'desactivar' : 'reducir'}.` : 'Completa valores válidos para representar el movimiento del borrador.'}</p>
    </section>
  )
}
