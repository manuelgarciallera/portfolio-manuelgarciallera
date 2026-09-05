import { APIError } from 'payload'

import { isOwner } from '../../access/owner'
import { recordAuditEvent } from '../../collections/AuditEvents'
import { createFigmaImportPlan } from './import-plan'
import type { FigmaReadProvider } from './types'
import { parseFigmaSource } from './url'

type ImportPayload = { create(args: Record<string, unknown>): Promise<Record<string, unknown>> }

const relationId = (value: Record<string, unknown>): string | number => {
  if (typeof value.id === 'string' || typeof value.id === 'number') return value.id
  throw new APIError('El plan creado no tiene identificador.', 500)
}

export const createOwnerFigmaImportPlan = async ({
  candidateId, confirmation, now = new Date().toISOString(), payload, provider, req, source,
}: {
  candidateId: string
  confirmation: string
  now?: string
  payload: ImportPayload
  provider: FigmaReadProvider
  req: { user?: unknown }
  source: string
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'PREPARAR IMPORTACIÓN FIGMA') throw new APIError('La confirmación no coincide.', 400)
  let parsed
  try { parsed = parseFigmaSource(source) } catch { throw new APIError('La fuente de Figma no es válida.', 400) }
  const result = await provider.discover(parsed)
  if (!result.ok) throw new APIError('No se pudo verificar de nuevo el candidato de Figma.', result.code === 'rate_limited' ? 429 : result.code === 'disabled' ? 503 : 502)
  const candidate = result.candidates.find((entry) => entry.id === candidateId)
  if (!candidate) throw new APIError('El candidato de Figma ya no está disponible.', 404)
  let plan
  try { plan = createFigmaImportPlan({ candidate, file: result.file, observedAt: now, source: parsed }) }
  catch { throw new APIError('La evidencia del candidato de Figma no es válida.', 400) }
  const created = await payload.create({
    collection: 'figma-import-plans',
    data: {
      candidateName: plan.candidate.name,
      candidateType: plan.candidate.type,
      createdBy: req.user.id,
      nodeId: plan.candidate.id,
      plan,
      planHash: plan.hash,
      schemaVersion: plan.schemaVersion,
      sourceFileKey: plan.source.fileKey,
      status: 'pending',
    },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'figma.plan.created',
      metadata: { candidateType: plan.candidate.type, nodeId: plan.candidate.id, planHash: plan.hash },
      outcome: 'success',
      subject: { collection: 'figma-import-plans', id: relationId(created) },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return created
}
