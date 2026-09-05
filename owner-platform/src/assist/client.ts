type AssistanceTransport = (url: string, init: RequestInit) => Promise<Response>
type AssistanceDecision = 'accepted' | 'rejected'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const failure = (): never => { throw new Error('No se pudo registrar la decisión.') }

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
