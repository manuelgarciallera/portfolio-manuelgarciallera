type PreviewTransport = (url: string, init: RequestInit) => Promise<Response>
type SnapshotIdentity = { id: string | number; sourceDocumentId: string; sourceVersionId: string }

export type SnapshotPage = Readonly<{ id: string | number; label: string }>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const pageFailure = (): never => { throw new Error('No se pudieron cargar las páginas.') }
const snapshotFailure = (): never => { throw new Error('No se pudieron crear los snapshots.') }

export const listSnapshotPages = async (request: PreviewTransport = fetch): Promise<SnapshotPage[]> => {
  const response = await request('/api/pages?depth=0&limit=100&sort=title&select[id]=true&select[slug]=true&select[title]=true', { credentials: 'same-origin' })
  if (!response.ok) return pageFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return pageFailure() }
  if (!isRecord(result) || !Array.isArray(result.docs) || result.docs.length > 100) return pageFailure()
  return result.docs.map((value) => {
    if (!isRecord(value) || !safeId(value.id) || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 200 || typeof value.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) return pageFailure()
    return { id: value.id, label: `${value.title.trim()} · /${value.slug}` }
  })
}

const createSnapshot = async (url: string, pageId: string | number, request: PreviewTransport): Promise<SnapshotIdentity> => {
  const response = await request(url, {
    body: JSON.stringify({ pageId, version: 'current-draft' }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return snapshotFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return snapshotFailure() }
  const snapshot = isRecord(result) && isRecord(result.snapshot) ? result.snapshot : undefined
  if (!snapshot || !safeId(snapshot.id) || typeof snapshot.sourceDocumentId !== 'string' || typeof snapshot.sourceVersionId !== 'string' || !snapshot.sourceDocumentId || !snapshot.sourceVersionId) return snapshotFailure()
  return { id: snapshot.id, sourceDocumentId: snapshot.sourceDocumentId, sourceVersionId: snapshot.sourceVersionId }
}

export const captureSnapshotPair = async (
  pageId: string | number,
  request: PreviewTransport = fetch,
): Promise<{ draftSnapshot: string | number; previewSnapshot: string | number }> => {
  if (!safeId(pageId)) throw new TypeError('La página no es válida.')
  const preview = await createSnapshot('/api/owner/preview-snapshots', pageId, request)
  const draft = await createSnapshot('/api/owner/draft-snapshots', pageId, request)
  if (preview.sourceDocumentId !== draft.sourceDocumentId || preview.sourceVersionId !== draft.sourceVersionId) throw new Error('La página cambió durante la captura y los snapshots no coinciden.')
  return { draftSnapshot: draft.id, previewSnapshot: preview.id }
}
