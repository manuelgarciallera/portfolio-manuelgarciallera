import {
  validateStudioPatch,
  type AssistCapability,
  type AssistCapabilitySwitches,
  type StudioPatch,
  type StudioPatchContext,
} from './contracts'

export const PROPOSAL_STATUSES = ['pending', 'accepted', 'rejected'] as const
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export type AssistanceProposalData = {
  capability: AssistCapability
  createdBy: string | number
  patch: StudioPatch
  provider: string
  sourceSnapshot: string | number
  status: 'pending'
  targetPage: string | number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const relation = (value: unknown, label: string): string | number => {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value).trim()) {
    throw new Error(`${label} no es una relación válida.`)
  }
  return value
}

export const createProposalData = (
  input: unknown,
  actor: { id?: unknown },
  switches: AssistCapabilitySwitches,
  context: StudioPatchContext,
): AssistanceProposalData => {
  if (!isRecord(input)) throw new Error('La propuesta debe ser un objeto.')
  const unknown = Object.keys(input).find(
    (key) => !['patch', 'provider', 'sourceSnapshot', 'targetPage'].includes(key),
  )
  if (unknown) throw new Error(`La propuesta contiene el campo no permitido ${unknown}.`)
  if (typeof input.provider !== 'string' || !/^[a-z][a-z0-9-]{1,31}$/.test(input.provider)) {
    throw new Error('El provider no es válido.')
  }
  const createdBy = relation(actor.id, 'El actor')
  const patch = validateStudioPatch(input.patch, switches, context)
  return {
    capability: patch.capability,
    createdBy,
    patch,
    provider: input.provider,
    sourceSnapshot: relation(input.sourceSnapshot, 'El snapshot'),
    status: 'pending',
    targetPage: relation(input.targetPage, 'La página'),
  }
}

export const decideProposalData = (
  current: { status?: unknown },
  input: { decision?: unknown; note?: unknown },
  actor: { id?: unknown },
  now = new Date().toISOString(),
) => {
  if (current.status !== 'pending') throw new Error('Solo puede decidirse una propuesta pendiente.')
  if (input.decision !== 'accepted' && input.decision !== 'rejected') {
    throw new Error('La decisión debe aceptar o rechazar la propuesta.')
  }
  const decidedBy = relation(actor.id, 'El actor')
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.trim().length > 1_000)) {
    throw new Error('La nota de decisión no es válida.')
  }
  if (Number.isNaN(Date.parse(now)) || new Date(now).toISOString() !== now) {
    throw new Error('La fecha de decisión no es válida.')
  }
  return {
    decidedAt: now,
    decidedBy,
    ...(typeof input.note === 'string' && input.note.trim()
      ? { decisionNote: input.note.trim() }
      : {}),
    status: input.decision,
  }
}
