export type TypographySettings = { primaryFamily?: string; secondaryFamily?: string }

const validFamily = (value: unknown): value is string =>
  typeof value === 'string' && /^[\p{L}\p{N} _-]{1,100}$/u.test(value.trim())

export const normalizeTypography = (value: unknown): TypographySettings | undefined => {
  if (value == null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('La tipografía debe ser un objeto.')
  const input = value as Record<string, unknown>
  const result: TypographySettings = {}
  for (const key of ['primaryFamily', 'secondaryFamily'] as const) {
    const family = input[key]
    if (family == null || (typeof family === 'string' && !family.trim())) continue
    if (!validFamily(family)) throw new Error('Cada familia tipográfica debe tener hasta 100 caracteres: letras, números, espacios, guiones o guiones bajos; no CSS ni URL.')
    result[key] = family.trim()
  }
  return Object.keys(result).length ? result : undefined
}

const generics = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math'])

// Names available on the device only. Revalidate historical manifests too.
export const previewFontStack = (family: unknown): string => {
  if (!validFamily(family)) return 'system-ui, sans-serif'
  const name = family.trim()
  return generics.has(name.toLowerCase()) ? name.toLowerCase() : `"${name}", system-ui, sans-serif`
}
