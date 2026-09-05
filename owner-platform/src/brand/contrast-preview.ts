import { BRAND_COLOR_ROLES, type BrandColorRole } from './model'
import { contrastRatio, normalizeHex } from './validation'

type ContrastRow = {
  background: BrandColorRole
  complete: boolean
  foreground: BrandColorRole
  minimum: number
  passes?: boolean
  ratio?: number
}

const pairs = [
  { foreground: 'text', background: 'background', minimum: 4.5 },
  { foreground: 'text', background: 'surface', minimum: 4.5 },
  { foreground: 'mutedText', background: 'background', minimum: 3 },
] as const

const valueOf = (field: unknown): unknown => field && typeof field === 'object' && !Array.isArray(field) ? (field as Record<string, unknown>).value : undefined

export const buildBrandContrastPreview = (fields: Record<string, unknown>): ContrastRow[] => {
  const colors = new Map<BrandColorRole, string>()
  for (const key of Object.keys(fields)) {
    const match = key.match(/^colors\.(\d+)\.role$/)
    if (!match) continue
    const role = valueOf(fields[key])
    if (typeof role !== 'string' || !BRAND_COLOR_ROLES.includes(role as BrandColorRole)) continue
    try { colors.set(role as BrandColorRole, normalizeHex(valueOf(fields[`colors.${match[1]}.value`]))) } catch { /* incomplete draft */ }
  }
  return pairs.map(({ foreground, background, minimum }) => {
    const foregroundColor = colors.get(foreground)
    const backgroundColor = colors.get(background)
    if (!foregroundColor || !backgroundColor) return { complete: false, foreground, background, minimum }
    const ratio = Number(contrastRatio(foregroundColor, backgroundColor).toFixed(2))
    return { complete: true, foreground, background, minimum, passes: ratio >= minimum, ratio }
  })
}
