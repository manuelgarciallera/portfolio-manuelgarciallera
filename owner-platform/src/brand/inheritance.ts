import type { BrandProfileInput, MotionSettings, SemanticColor, UsageWeight } from './model'
import { normalizeHex, validateBrandProfile, validateMotion, validateUsageWeights } from './validation'

export type PageBrandOverrides = {
  accent?: string | null
  surface?: string | null
  usageWeights?: UsageWeight[] | null
  motion?: Partial<MotionSettings> | null
}

export type ResolvedBrand = {
  colors: SemanticColor[]
  usageWeights: UsageWeight[]
  motion: MotionSettings
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const allowedOverrideKeys = new Set(['accent', 'surface', 'usageWeights', 'motion'])
const allowedMotionKeys = new Set(['duration', 'stagger', 'travel', 'easing', 'reducedMotion'])

const rejectUnknownKeys = (value: Record<string, unknown>, allowed: Set<string>, label: string) => {
  const unknown = Object.keys(value).find((key) => !allowed.has(key))
  if (unknown) throw new Error(`El campo "${label}.${unknown}" no está permitido.`)
}

export const normalizePageBrandOverrides = (value: unknown): PageBrandOverrides | null => {
  if (value === undefined || value === null) return null
  if (!isRecord(value)) throw new Error('Las variaciones de marca deben ser un objeto.')
  rejectUnknownKeys(value, allowedOverrideKeys, 'brandOverrides')

  const result: PageBrandOverrides = {}
  for (const role of ['accent', 'surface'] as const) {
    if (!Object.hasOwn(value, role) || value[role] === undefined) continue
    const color = value[role]
    result[role] = color === null ? null : normalizeHex(color)
  }

  if (Object.hasOwn(value, 'usageWeights') && value.usageWeights !== undefined) {
    // Payload hydrates an unused optional array as []; no rows means inherit.
    if (value.usageWeights === null || (Array.isArray(value.usageWeights) && value.usageWeights.length === 0)) result.usageWeights = null
    else {
      const errors = validateUsageWeights(value.usageWeights)
      if (errors.length) throw new Error(errors.join(' '))
      result.usageWeights = (value.usageWeights as UsageWeight[]).map(({ role, weight }) => ({ role, weight }))
    }
  }

  if (Object.hasOwn(value, 'motion') && value.motion !== undefined) {
    if (value.motion === null) result.motion = null
    else {
      if (!isRecord(value.motion)) throw new Error('La variación de movimiento debe ser un objeto.')
      rejectUnknownKeys(value.motion, allowedMotionKeys, 'brandOverrides.motion')
      result.motion = {}
      for (const key of allowedMotionKeys) {
        if (!Object.hasOwn(value.motion, key)) continue
        const setting = value.motion[key]
        if (setting !== null && setting !== undefined) Object.assign(result.motion, { [key]: setting })
      }
      const errors = validateMotion({
        duration: 600,
        stagger: 80,
        travel: 24,
        easing: 'ease-out',
        reducedMotion: 'reduce',
        ...result.motion,
      })
      if (errors.length) throw new Error(errors.join(' '))
    }
  }
  return result
}

export const resolvePageBrand = (base: unknown, overrides: unknown): ResolvedBrand => {
  if (!isRecord(base)) throw new Error('El perfil de marca base debe ser un objeto.')
  const baseErrors = validateBrandProfile(base)
  if (baseErrors.length) throw new Error(`El perfil de marca base no es válido: ${baseErrors.join(' ')}`)

  const normalizedOverrides = normalizePageBrandOverrides(overrides)
  const profile = base as BrandProfileInput
  const colors = (profile.colors as SemanticColor[]).map(({ role, value }) => ({
    role,
    value: normalizeHex(value),
  }))
  for (const role of ['accent', 'surface'] as const) {
    const value = normalizedOverrides?.[role]
    if (value === undefined || value === null) continue
    const entry = colors.find((color) => color.role === role)
    if (entry) entry.value = value
  }

  const usageWeights = (normalizedOverrides?.usageWeights ?? profile.usageWeights as UsageWeight[]).map(
    ({ role, weight }) => ({ role, weight }),
  )
  const baseMotion = profile.motion as MotionSettings
  const motion = { ...baseMotion, ...(normalizedOverrides?.motion ?? {}) }
  const motionErrors = validateMotion(motion)
  if (motionErrors.length) throw new Error(motionErrors.join(' '))

  const resolved = { colors, usageWeights, motion }
  const errors = validateBrandProfile(resolved)
  if (errors.length) throw new Error(`La marca resuelta no es válida: ${errors.join(' ')}`)
  return resolved
}
