import {
  BRAND_COLOR_ROLES,
  MOTION_EASINGS,
  REDUCED_MOTION_BEHAVIORS,
  type BrandColorRole,
  type SemanticColor,
} from './model'

const HEX_COLOR = /^#?([\da-f]{3}|[\da-f]{6})$/i
const BASIS_POINTS_PER_PERCENT = 100
// This epsilon absorbs IEEE-754 representation noise only; authored values still
// need to resolve exactly to two-decimal percentage basis points.
const BASIS_POINT_PRECISION_EPSILON = 1e-8

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const normalizeHex = (value: unknown): string => {
  if (typeof value !== 'string') throw new Error('El color hexadecimal debe ser texto.')
  const match = value.trim().match(HEX_COLOR)
  if (!match) throw new Error(`El color "${value}" no es un hexadecimal RGB válido.`)
  const digits = match[1].length === 3 ? [...match[1]].map((digit) => digit.repeat(2)).join('') : match[1]
  return `#${digits.toUpperCase()}`
}

const duplicateErrors = (entries: readonly unknown[], message: (role: string) => string): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.role !== 'string') continue
    if (seen.has(entry.role)) duplicates.add(entry.role)
    seen.add(entry.role)
  }
  return [...duplicates].map(message)
}

export const validateSemanticColors = (entries: unknown): string[] => {
  if (!Array.isArray(entries)) return ['Los colores semánticos deben ser una lista.']
  const errors = duplicateErrors(entries, (role) => `El rol semántico "${role}" está repetido.`)
  for (const entry of entries) {
    if (!isRecord(entry)) {
      errors.push('Cada color semántico debe ser un objeto con rol y valor.')
      continue
    }
    if (typeof entry.role !== 'string' || !BRAND_COLOR_ROLES.includes(entry.role as BrandColorRole))
      errors.push(`El rol semántico "${String(entry.role)}" no está permitido.`)
    try {
      normalizeHex(entry.value)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'El color no es válido.')
    }
  }
  return errors
}

export const validateUsageWeights = (entries: unknown): string[] => {
  if (!Array.isArray(entries)) return ['Los porcentajes de uso deben ser una lista.']
  const errors = duplicateErrors(entries, (role) => `El peso del rol "${role}" está repetido.`)
  let totalBasisPoints = 0
  for (const entry of entries) {
    if (!isRecord(entry)) {
      errors.push('Cada porcentaje de uso debe ser un objeto con rol y peso.')
      continue
    }
    const role = String(entry.role)
    if (typeof entry.role !== 'string' || !BRAND_COLOR_ROLES.includes(entry.role as BrandColorRole))
      errors.push(`El rol de uso "${role}" no está permitido.`)
    if (typeof entry.weight !== 'number' || !Number.isFinite(entry.weight) || entry.weight < 0 || entry.weight > 100) {
      errors.push(`El porcentaje de "${role}" debe estar entre 0 y 100.`)
      continue
    }
    const scaled = entry.weight * BASIS_POINTS_PER_PERCENT
    const basisPoints = Math.round(scaled)
    if (Math.abs(scaled - basisPoints) > BASIS_POINT_PRECISION_EPSILON) {
      errors.push(`El porcentaje de "${role}" admite como máximo dos decimales.`)
      continue
    }
    totalBasisPoints += basisPoints
  }
  if (totalBasisPoints !== 100 * BASIS_POINTS_PER_PERCENT) {
    const total = Number((totalBasisPoints / BASIS_POINTS_PER_PERCENT).toFixed(2))
    errors.push(`Los porcentajes de uso deben sumar exactamente 100 (actual: ${total}).`)
  }
  return errors
}

const channelLuminance = (channel: number): number => {
  const normalized = channel / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

const luminance = (value: unknown): number => {
  const color = normalizeHex(value)
  const channels = [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)].map((part) =>
    channelLuminance(Number.parseInt(part, 16)),
  )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export const contrastRatio = (foreground: unknown, background: unknown): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export const validateMotion = (motion: unknown): string[] => {
  if (!isRecord(motion)) return ['La configuración de movimiento debe ser un objeto.']
  const errors: string[] = []
  if (typeof motion.duration !== 'number' || !Number.isFinite(motion.duration) || motion.duration < 150 || motion.duration > 1600)
    errors.push('La duración debe estar entre 150 y 1600 ms.')
  if (typeof motion.stagger !== 'number' || !Number.isFinite(motion.stagger) || motion.stagger < 0 || motion.stagger > 500)
    errors.push('El escalonado debe estar entre 0 y 500 ms.')
  if (typeof motion.travel !== 'number' || !Number.isFinite(motion.travel) || motion.travel < 0 || motion.travel > 80)
    errors.push('El desplazamiento debe estar entre 0 y 80 px.')
  if (!MOTION_EASINGS.includes(motion.easing as never)) errors.push('La curva de movimiento no está permitida.')
  if (!REDUCED_MOTION_BEHAVIORS.includes(motion.reducedMotion as never))
    errors.push('El comportamiento de movimiento reducido no está permitido.')
  return errors
}

const contrastError = (
  colors: ReadonlyMap<BrandColorRole, string>,
  foreground: BrandColorRole,
  background: BrandColorRole,
  minimum: number,
): string | undefined => {
  const foregroundColor = colors.get(foreground)
  const backgroundColor = colors.get(background)
  if (!foregroundColor || !backgroundColor) return undefined
  try {
    return contrastRatio(foregroundColor, backgroundColor) < minimum
      ? `El contraste ${foreground}/${background} debe ser al menos ${minimum}:1.`
      : undefined
  } catch {
    return undefined
  }
}

export const validateBrandProfile = (profile: unknown): string[] => {
  if (!isRecord(profile)) return ['El perfil de marca debe ser un objeto.']
  const errors = [...validateSemanticColors(profile.colors), ...validateUsageWeights(profile.usageWeights)]
  const validColors = Array.isArray(profile.colors)
    ? profile.colors.filter(
        (entry): entry is SemanticColor =>
          isRecord(entry) &&
          typeof entry.role === 'string' &&
          BRAND_COLOR_ROLES.includes(entry.role as BrandColorRole) &&
          typeof entry.value === 'string',
      )
    : []
  const presentRoles = new Set(validColors.map(({ role }) => role))
  for (const role of BRAND_COLOR_ROLES) {
    if (!presentRoles.has(role)) errors.push(`Falta el rol semántico obligatorio "${role}".`)
  }
  const colorMap = new Map(validColors.map(({ role, value }) => [role, value]))
  for (const error of [
    contrastError(colorMap, 'text', 'background', 4.5),
    contrastError(colorMap, 'text', 'surface', 4.5),
    contrastError(colorMap, 'mutedText', 'background', 3),
  ]) {
    if (error) errors.push(error)
  }
  errors.push(...validateMotion(profile.motion))
  return errors
}
