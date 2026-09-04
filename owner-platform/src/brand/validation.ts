import {
  BRAND_COLOR_ROLES,
  MOTION_EASINGS,
  REDUCED_MOTION_BEHAVIORS,
  type BrandColorRole,
  type BrandProfileInput,
  type MotionSettings,
  type SemanticColor,
  type UsageWeight,
} from './model'

const HEX_COLOR = /^#?([\da-f]{3}|[\da-f]{6})$/i

export const normalizeHex = (value: string): string => {
  const match = value.trim().match(HEX_COLOR)
  if (!match) throw new Error(`El color "${value}" no es un hexadecimal RGB válido.`)
  const digits = match[1].length === 3 ? [...match[1]].map((digit) => digit.repeat(2)).join('') : match[1]
  return `#${digits.toUpperCase()}`
}

const duplicateErrors = <T extends { role: string }>(
  entries: readonly T[],
  message: (role: string) => string,
): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const { role } of entries) {
    if (seen.has(role)) duplicates.add(role)
    seen.add(role)
  }
  return [...duplicates].map(message)
}

export const validateSemanticColors = (entries: readonly SemanticColor[]): string[] => {
  const errors = duplicateErrors(entries, (role) => `El rol semántico "${role}" está repetido.`)
  for (const entry of entries) {
    if (!BRAND_COLOR_ROLES.includes(entry.role)) errors.push(`El rol semántico "${entry.role}" no está permitido.`)
    try {
      normalizeHex(entry.value)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'El color no es válido.')
    }
  }
  return errors
}

export const validateUsageWeights = (entries: readonly UsageWeight[]): string[] => {
  const errors = duplicateErrors(entries, (role) => `El peso del rol "${role}" está repetido.`)
  let total = 0
  for (const entry of entries) {
    if (!BRAND_COLOR_ROLES.includes(entry.role)) errors.push(`El rol de uso "${entry.role}" no está permitido.`)
    if (!Number.isFinite(entry.weight) || entry.weight < 0 || entry.weight > 100) {
      errors.push(`El porcentaje de "${entry.role}" debe estar entre 0 y 100.`)
    }
    total += entry.weight
  }
  if (total !== 100) errors.push(`Los porcentajes de uso deben sumar exactamente 100 (actual: ${total}).`)
  return errors
}

const channelLuminance = (channel: number): number => {
  const normalized = channel / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

const luminance = (value: string): number => {
  const color = normalizeHex(value)
  const channels = [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)].map((part) =>
    channelLuminance(Number.parseInt(part, 16)),
  )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export const contrastRatio = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export const validateMotion = (motion: Partial<MotionSettings>): string[] => {
  const errors: string[] = []
  if (!Number.isFinite(motion.duration) || motion.duration! < 150 || motion.duration! > 1600)
    errors.push('La duración debe estar entre 150 y 1600 ms.')
  if (!Number.isFinite(motion.stagger) || motion.stagger! < 0 || motion.stagger! > 500)
    errors.push('El escalonado debe estar entre 0 y 500 ms.')
  if (!Number.isFinite(motion.travel) || motion.travel! < 0 || motion.travel! > 80)
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

export const validateBrandProfile = (profile: BrandProfileInput): string[] => {
  const colors = profile.colors ?? []
  const errors = [...validateSemanticColors(colors), ...validateUsageWeights(profile.usageWeights ?? [])]
  const presentRoles = new Set(colors.map(({ role }) => role))
  for (const role of BRAND_COLOR_ROLES) {
    if (!presentRoles.has(role)) errors.push(`Falta el rol semántico obligatorio "${role}".`)
  }
  const colorMap = new Map(colors.map(({ role, value }) => [role, value]))
  for (const error of [
    contrastError(colorMap, 'text', 'background', 4.5),
    contrastError(colorMap, 'text', 'surface', 4.5),
    contrastError(colorMap, 'mutedText', 'background', 3),
  ]) {
    if (error) errors.push(error)
  }
  errors.push(...validateMotion(profile.motion ?? {}))
  return errors
}
