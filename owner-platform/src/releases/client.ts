import { normalizeReleaseQuality, type ReleaseQuality } from './quality'

type ReleaseTransport = (url: string, init: RequestInit) => Promise<Response>
type SnapshotRow = { createdAt: string; id: string | number; sourceDocumentId: string; sourceVersionId: string }

export type ReleaseEvidence = Readonly<{
  createdAt: string
  draftSnapshot: string | number
  label: string
  previewSnapshot: string | number
}>

type ReleaseRegistration = {
  changeSummary: string
  confirmation: string
  draftSnapshot: string | number
  gitCommit: string
  name: string
  previewSnapshot: string | number
  quality: ReleaseQuality[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const snapshotFailure = (): never => { throw new Error('No se pudieron cargar los snapshots.') }
const releaseFailure = (): never => { throw new Error('No se pudo registrar la versión.') }

const loadSnapshots = async (collection: 'preview-snapshots' | 'draft-snapshots', request: ReleaseTransport): Promise<SnapshotRow[]> => {
  const response = await request(`/api/${collection}?depth=0&limit=100&sort=-createdAt`, { credentials: 'same-origin' })
  if (!response.ok) return snapshotFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return snapshotFailure() }
  if (!isRecord(result) || !Array.isArray(result.docs) || result.docs.length > 100) return snapshotFailure()
  return result.docs.map((value) => {
    if (!isRecord(value)) return snapshotFailure()
    const { createdAt, id, sourceDocumentId, sourceVersionId } = value
    if (!safeId(id) || typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt)) || typeof sourceDocumentId !== 'string' || !sourceDocumentId.trim() || sourceDocumentId.length > 100 || typeof sourceVersionId !== 'string' || !sourceVersionId.trim() || sourceVersionId.length > 200) return snapshotFailure()
    return { createdAt, id, sourceDocumentId: sourceDocumentId.trim(), sourceVersionId: sourceVersionId.trim() }
  })
}

export const listReleaseEvidence = async (request: ReleaseTransport = fetch): Promise<ReleaseEvidence[]> => {
  const [previews, drafts] = await Promise.all([loadSnapshots('preview-snapshots', request), loadSnapshots('draft-snapshots', request)])
  const draftsBySource = new Map(drafts.map((snapshot) => [`${snapshot.sourceDocumentId}\u0000${snapshot.sourceVersionId}`, snapshot]))
  return previews.flatMap((preview) => {
    const draft = draftsBySource.get(`${preview.sourceDocumentId}\u0000${preview.sourceVersionId}`)
    if (!draft) return []
    return [{
      createdAt: new Date(Math.max(Date.parse(preview.createdAt), Date.parse(draft.createdAt))).toISOString(),
      draftSnapshot: draft.id,
      label: `Página ${preview.sourceDocumentId} · ${preview.sourceVersionId}`,
      previewSnapshot: preview.id,
    }]
  })
}

export const registerOwnerRelease = async (
  input: ReleaseRegistration,
  request: ReleaseTransport = fetch,
): Promise<{ href: string }> => {
  if (input.confirmation !== 'REGISTRAR VERSIÓN') throw new TypeError('Escribe REGISTRAR VERSIÓN para continuar.')
  const name = input.name.trim()
  const changeSummary = input.changeSummary.trim()
  if (!name || name.length > 120) throw new TypeError('El nombre de la versión no es válido.')
  if (!changeSummary || changeSummary.length > 500) throw new TypeError('El resumen de cambios no es válido.')
  if (!/^[a-f0-9]{40}$/.test(input.gitCommit)) throw new TypeError('El commit no es válido.')
  if (!safeId(input.previewSnapshot) || !safeId(input.draftSnapshot)) throw new TypeError('El snapshot no es válido.')
  if (!Array.isArray(input.quality) || input.quality.length < 1 || input.quality.length > 4) throw new TypeError('Las métricas no son válidas.')
  let quality: ReleaseQuality[]
  try { quality = input.quality.map(normalizeReleaseQuality) } catch { throw new TypeError('Las métricas no son válidas.') }
  const response = await request('/api/owner/releases', {
    body: JSON.stringify({ changeSummary, confirmation: 'REGISTRAR VERSIÓN', draftSnapshot: input.draftSnapshot, gitCommit: input.gitCommit, name, previewSnapshot: input.previewSnapshot, quality }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return releaseFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return releaseFailure() }
  const release = isRecord(result) && isRecord(result.release) ? result.release : undefined
  if (!safeId(release?.id)) return releaseFailure()
  return { href: `/admin/collections/releases/${encodeURIComponent(String(release.id))}` }
}
