type AssistanceTransport = (url: string, init: RequestInit) => Promise<Response>
type AssistanceDecision = 'accepted' | 'rejected'
type AssistCapability = 'suggestCopy' | 'suggestPalette' | 'suggestLayout' | 'suggestCrop' | 'suggestMotion'

export type AssistanceSnapshot = Readonly<{ id: string | number; label: string }>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const failure = (): never => { throw new Error('No se pudo registrar la decisión.') }
const preparationFailure = (): never => { throw new Error('No se pudieron cargar los snapshots.') }
const createFailure = (): never => { throw new Error('No se pudo crear la propuesta.') }
const safeId = (value: unknown): value is string | number => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]+$/.test(String(value))
const capabilities = new Set<AssistCapability>(['suggestCopy', 'suggestPalette', 'suggestLayout', 'suggestCrop', 'suggestMotion'])

export const listAssistanceSnapshots = async (request: AssistanceTransport = fetch): Promise<AssistanceSnapshot[]> => {
  const url = '/api/preview-snapshots?depth=0&limit=50&sort=-createdAt&select[id]=true&select[sourceDocumentId]=true&select[sourceVersionId]=true'
  const response = await request(url, { credentials: 'same-origin' })
  if (!response.ok) return preparationFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return preparationFailure() }
  if (!isRecord(result) || !Array.isArray(result.docs) || result.docs.length > 50) return preparationFailure()
  return result.docs.map((entry) => {
    if (!isRecord(entry) || !safeId(entry.id) || typeof entry.sourceDocumentId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(entry.sourceDocumentId) || typeof entry.sourceVersionId !== 'string' || !/^current:[^\s]{1,128}$/.test(entry.sourceVersionId)) return preparationFailure()
    return { id: entry.id, label: `Página ${entry.sourceDocumentId} · ${entry.sourceVersionId.slice('current:'.length)}` }
  })
}

export const parseAssistancePatch = (source: string): Record<string, unknown> => {
  if (new TextEncoder().encode(source).byteLength > 64 * 1024) throw new TypeError('El JSON de la propuesta es demasiado grande.')
  let parsed: unknown
  try { parsed = JSON.parse(source) as unknown } catch { throw new TypeError('La propuesta no contiene JSON válido.') }
  if (!isRecord(parsed)) throw new TypeError('La propuesta debe ser un objeto JSON.')
  return parsed
}

export const loadAssistanceContext = async (
  sourceSnapshot: string | number,
  request: AssistanceTransport = fetch,
): Promise<Record<string, unknown>> => {
  if (!safeId(sourceSnapshot)) throw new TypeError('El snapshot no es válido.')
  const response = await request(`/api/owner/assist/context?sourceSnapshot=${encodeURIComponent(String(sourceSnapshot))}`, { credentials: 'same-origin' })
  if (!response.ok) throw new Error('No se pudo cargar el contexto.')
  let result: unknown
  try { result = await response.json() as unknown } catch { throw new Error('No se pudo cargar el contexto.') }
  const contextPackage = isRecord(result) && isRecord(result.contextPackage) ? result.contextPackage : undefined
  if (!contextPackage || contextPackage.schemaVersion !== 1 || contextPackage.contentTrust !== 'untrusted-editorial-data' || !isRecord(contextPackage.permissions) || contextPackage.permissions.apply !== false) throw new Error('No se pudo cargar el contexto.')
  return contextPackage
}

export const createAssistanceProposal = async (
  sourceSnapshot: string | number,
  patch: Record<string, unknown>,
  request: AssistanceTransport = fetch,
): Promise<{ capability: AssistCapability; id: string | number }> => {
  if (!safeId(sourceSnapshot)) throw new TypeError('El snapshot no es válido.')
  const response = await request('/api/owner/assist/proposals', {
    body: JSON.stringify({ patch, provider: 'manual', sourceSnapshot }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) return createFailure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return createFailure() }
  const proposal = isRecord(result) && isRecord(result.proposal) ? result.proposal : undefined
  if (!proposal || !safeId(proposal.id) || proposal.status !== 'pending' || typeof proposal.capability !== 'string' || !capabilities.has(proposal.capability as AssistCapability)) return createFailure()
  return { capability: proposal.capability as AssistCapability, id: proposal.id }
}

export const decideAssistanceProposal = async (
  proposalId: string | number,
  input: { confirmation: string; decision: AssistanceDecision; note?: string },
  request: AssistanceTransport = fetch,
): Promise<{ status: AssistanceDecision }> => {
  const id = String(proposalId)
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new TypeError('El identificador no es válido.')
  const confirmation = input.decision === 'accepted' ? 'ACEPTAR PROPUESTA' : 'RECHAZAR PROPUESTA'
  if (input.confirmation !== confirmation) throw new TypeError(`Escribe ${confirmation} para continuar.`)
  const note = input.note?.trim()
  if (note && note.length > 1_000) throw new TypeError('La nota no puede superar 1000 caracteres.')
  const response = await request(`/api/owner/assist/proposals/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ confirmation, decision: input.decision, ...(note ? { note } : {}) }),
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    method: 'PATCH',
  })
  if (!response.ok) return failure()
  let result: unknown
  try { result = await response.json() as unknown } catch { return failure() }
  const proposal = isRecord(result) && isRecord(result.proposal) ? result.proposal : undefined
  if (proposal?.status !== input.decision || String(proposal.id) !== id) return failure()
  return { status: input.decision }
}
