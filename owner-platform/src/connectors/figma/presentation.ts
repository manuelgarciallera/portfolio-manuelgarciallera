type CandidateView = { dimensions?: string; id: string; name: string; previewUrl?: string; sourceUrl: string; type: string }
type DiscoveryView = { candidates: CandidateView[]; fileName: string; notice: string | null }

const record = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined
const httpsUrl = (value: unknown, figmaOnly = false): string | undefined => {
  const raw = text(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    if (figmaOnly && url.hostname !== 'figma.com' && url.hostname !== 'www.figma.com') return undefined
    return url.toString()
  } catch { return undefined }
}

export const presentFigmaDiscovery = (value: unknown): DiscoveryView => {
  const result = record(value)
  const file = record(result?.file)
  if (result?.ok !== true || !file || !Array.isArray(result.candidates) || result.candidates.length > 100) throw new TypeError('La respuesta de Figma no es válida.')
  const fileName = text(file.name)
  if (!fileName) throw new TypeError('La respuesta de Figma no es válida.')
  const candidates = result.candidates.map((value): CandidateView => {
    const candidate = record(value)
    const id = text(candidate?.id)
    const name = text(candidate?.name)
    const sourceUrl = httpsUrl(candidate?.sourceUrl, true)
    const type = candidate?.type === 'FRAME' ? 'Frame' : candidate?.type === 'COMPONENT' ? 'Componente' : candidate?.type === 'SECTION' ? 'Sección' : undefined
    if (!id || !name || !sourceUrl || !type) throw new TypeError('La respuesta de Figma no es válida.')
    const preview = record(candidate?.preview)
    const previewUrl = preview?.url === null || preview === undefined ? undefined : httpsUrl(preview.url)
    if (preview && preview.url !== null && !previewUrl) throw new TypeError('La respuesta de Figma no es válida.')
    const width = candidate?.width
    const height = candidate?.height
    const dimensions = typeof width === 'number' && Number.isFinite(width) && width > 0 && typeof height === 'number' && Number.isFinite(height) && height > 0 ? `${Math.round(width)} × ${Math.round(height)}` : undefined
    return { id, name, type, ...(dimensions ? { dimensions } : {}), sourceUrl, ...(previewUrl ? { previewUrl } : {}) }
  })
  return { candidates, fileName, notice: result.truncated === true ? 'Resultados limitados; selecciona un nodo más concreto.' : result.selectedNodeMissing === true ? 'El nodo seleccionado ya no existe en el archivo.' : null }
}
