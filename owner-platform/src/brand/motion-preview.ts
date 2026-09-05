import { type MotionSettings } from './model'
import { validateMotion } from './validation'

const defaults: MotionSettings = { duration: 600, easing: 'ease-out', reducedMotion: 'reduce', stagger: 80, travel: 24 }
const valueOf = (field: unknown): unknown => field && typeof field === 'object' && !Array.isArray(field) ? (field as Record<string, unknown>).value : undefined

export const buildBrandMotionPreview = (fields: Record<string, unknown>): MotionSettings & { complete: boolean } => {
  const candidate = {
    duration: valueOf(fields['motion.duration']),
    easing: valueOf(fields['motion.easing']),
    reducedMotion: valueOf(fields['motion.reducedMotion']),
    stagger: valueOf(fields['motion.stagger']),
    travel: valueOf(fields['motion.travel']),
  }
  if (validateMotion(candidate).length > 0) return { complete: false, ...defaults }
  return { complete: true, ...(candidate as MotionSettings) }
}
