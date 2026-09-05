type PublicationTransport = (url: string, init: RequestInit) => Promise<Response>
type Decision = 'approved' | 'rejected'
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const safeId = (value: string | number): string => {
  if (!/^[A-Za-z0-9_-]+$/.test(String(value))) throw new TypeError('El identificador no es válido.')
  return encodeURIComponent(String(value))
}
const failure = (): never => { throw new Error('No se pudo registrar la revisión.') }

export type PublicationCandidate = Readonly<{
  changeSummary: string
  createdAt: string
  id: string | number
  name: string
}>

export const reorderPublicationSelection = <T extends string | number>(
  values: readonly T[],
  value: T,
  direction: -1 | 1,
): T[] => {
  const next = [...values]
  const current = next.findIndex((candidate) => String(candidate) === String(value))
  const target = current + direction
  if (current < 0 || target < 0 || target >= next.length) return next
  ;[next[current], next[target]] = [next[target], next[current]]
  return next
}

export const orderPublicationCandidates = (
  candidates: readonly PublicationCandidate[],
  selected: readonly (string | number)[],
): PublicationCandidate[] => {
  const byId = new Map(candidates.map((candidate) => [String(candidate.id), candidate]))
  const ordered = selected.flatMap((id) => {
    const candidate = byId.get(String(id))
    return candidate ? [candidate] : []
  })
  const selectedIds = new Set(selected.map(String))
  return [...ordered, ...candidates.filter((candidate) => !selectedIds.has(String(candidate.id)))]
}

const candidateFailure = (): never => { throw new Error('No se pudieron cargar las versiones.') }
const bundleFailure = (): never => { throw new Error('No se pudo preparar el paquete.') }

export const listPublicationCandidates = async (
  request: PublicationTransport = fetch,
): Promise<PublicationCandidate[]> => {
  const response = await request('/api/releases?depth=0&limit=100&sort=-createdAt', { credentials: 'same-origin' })
  if (!response.ok) return candidateFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return candidateFailure() }
  if (!isRecord(result) || !Array.isArray(result.docs) || result.docs.length > 100) return candidateFailure()
  return result.docs.map((value) => {
    if (!isRecord(value)) return candidateFailure()
    const { changeSummary, createdAt, id, name } = value
    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      !/^[A-Za-z0-9_-]+$/.test(String(id)) ||
      typeof name !== 'string' || !name.trim() || name.trim().length > 120 ||
      typeof changeSummary !== 'string' || !changeSummary.trim() || changeSummary.trim().length > 500 ||
      typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))
    ) return candidateFailure()
    return { changeSummary: changeSummary.trim(), createdAt, id, name: name.trim() }
  })
}

export const preparePublicationBundle = async (
  input: { confirmation: string; name: string; releaseIds: Array<string | number> },
  request: PublicationTransport = fetch,
): Promise<{ href: string }> => {
  if (input.confirmation !== 'PREPARAR PUBLICACIÓN') throw new TypeError('Escribe PREPARAR PUBLICACIÓN para continuar.')
  const name = input.name.trim()
  if (!name || name.length > 120) throw new TypeError('El nombre del paquete no es válido.')
  if (!Array.isArray(input.releaseIds) || input.releaseIds.length < 1 || input.releaseIds.length > 100) throw new TypeError('Selecciona entre una y cien versiones.')
  if (new Set(input.releaseIds.map(String)).size !== input.releaseIds.length) throw new TypeError('La selección contiene versiones duplicadas.')
  input.releaseIds.forEach(safeId)
  const response = await request('/api/owner/publication-bundles', {
    body: JSON.stringify({ confirmation: 'PREPARAR PUBLICACIÓN', name, releaseIds: input.releaseIds }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return bundleFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return bundleFailure() }
  const bundle = isRecord(result) && isRecord(result.bundle) ? result.bundle : undefined
  const id = bundle?.id
  if ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(id))) return bundleFailure()
  return { href: `/admin/collections/publication-bundles/${encodeURIComponent(String(id))}` }
}

export const reviewPublicationBundle = async (
  bundleId: string | number,
  input: { confirmation: string; decision: Decision; note?: string },
  request: PublicationTransport = fetch,
): Promise<{ decision: Decision; href: string }> => {
  const expected = input.decision === 'approved' ? 'APROBAR PAQUETE' : 'RECHAZAR PAQUETE'
  if (input.confirmation !== expected) throw new TypeError(`Escribe ${expected} para continuar.`)
  const note = input.note?.trim()
  if (note && note.length > 1_000) throw new TypeError('La nota no puede superar 1000 caracteres.')
  const response = await request(`/api/owner/publication-bundles/${safeId(bundleId)}/review`, {
    body: JSON.stringify({ confirmation: expected, decision: input.decision, ...(note ? { note } : {}) }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return failure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return failure() }
  const review = isRecord(result) && isRecord(result.review) ? result.review : undefined
  const id = review?.id
  if (review?.decision !== input.decision || ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(id)))) return failure()
  return { decision: input.decision, href: `/admin/collections/publication-reviews/${encodeURIComponent(String(id))}` }
}

export const generatePublicationArtifact = async (
  reviewId: string | number,
  confirmation: string,
  request: PublicationTransport = fetch,
): Promise<{ href: string }> => {
  if (confirmation !== 'GENERAR ARTEFACTO') throw new TypeError('Escribe GENERAR ARTEFACTO para continuar.')
  const response = await request(`/api/owner/publication-reviews/${safeId(reviewId)}/artifacts`, {
    body: JSON.stringify({ confirmation }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) throw new Error('No se pudo generar el artefacto.')
  let result: unknown
  try { result = await response.json() as unknown } catch { throw new Error('No se pudo generar el artefacto.') }
  const artifact = isRecord(result) && isRecord(result.artifact) ? result.artifact : undefined
  const id = artifact?.id
  if ((typeof id !== 'string' && typeof id !== 'number') || !/^[A-Za-z0-9_-]+$/.test(String(id))) throw new Error('No se pudo generar el artefacto.')
  return { href: `/admin/collections/publication-artifacts/${encodeURIComponent(String(id))}` }
}
