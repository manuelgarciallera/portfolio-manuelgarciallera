import { BRAND_COLOR_ROLES, type BrandColorRole } from './model'
import { normalizeHex } from './validation'

type Segment = { color: string; role: BrandColorRole; weight: number }
type PalettePreview = { complete: boolean; segments: Segment[]; total: number }

const fieldValue = (value: unknown): unknown => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return (value as Record<string, unknown>).value
}

export const buildBrandPalettePreview = (fields: Record<string, unknown>): PalettePreview => {
  const colors = new Map<BrandColorRole, string>()
  const weights = new Map<BrandColorRole, number>()
  const indexes = new Set<string>()
  for (const key of Object.keys(fields)) {
    const match = key.match(/^(?:colors|usageWeights)\.(\d+)\./)
    if (match) indexes.add(match[1])
  }
  for (const index of indexes) {
    const colorRole = fieldValue(fields[`colors.${index}.role`])
    const colorValue = fieldValue(fields[`colors.${index}.value`])
    if (typeof colorRole === 'string' && BRAND_COLOR_ROLES.includes(colorRole as BrandColorRole)) {
      try { colors.set(colorRole as BrandColorRole, normalizeHex(colorValue)) } catch { /* incomplete draft */ }
    }
    const weightRole = fieldValue(fields[`usageWeights.${index}.role`])
    const weightValue = fieldValue(fields[`usageWeights.${index}.weight`])
    if (
      typeof weightRole === 'string' &&
      BRAND_COLOR_ROLES.includes(weightRole as BrandColorRole) &&
      typeof weightValue === 'number' && Number.isFinite(weightValue) && weightValue >= 0 && weightValue <= 100
    ) weights.set(weightRole as BrandColorRole, weightValue)
  }
  const total = Number([...weights.values()].reduce((sum, weight) => sum + weight, 0).toFixed(2))
  const segments = [...weights].flatMap(([role, weight]) => {
    const color = colors.get(role)
    return color && weight > 0 ? [{ color, role, weight }] : []
  })
  return { complete: total === 100 && segments.reduce((sum, segment) => sum + segment.weight, 0) === 100, segments, total }
}
