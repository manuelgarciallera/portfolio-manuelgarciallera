import { APIError } from 'payload'

import { isOwner } from '../../access/owner'
import { recordAuditEvent } from '../../collections/AuditEvents'
import { hashFigmaImportPlan, type FigmaImportPlan } from './import-plan'
import { createFigmaImportReview, type FigmaImportDecision } from './import-review'

type Payload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

export const createOwnerFigmaImportReview = async ({ confirmation, decision, note, now, payload, planId, req }: {
  confirmation: string; decision: FigmaImportDecision; note?: string; now?: string; payload: Payload; planId: string | number; req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const expected = decision === 'approved' ? 'APROBAR IMPORTACIÓN FIGMA' : 'RECHAZAR IMPORTACIÓN FIGMA'
  if (confirmation !== expected) throw new APIError('La confirmación no coincide con la decisión.', 400)
  const existing = await payload.find({ collection: 'figma-import-reviews', depth: 0, limit: 1, overrideAccess: false, req, where: { plan: { equals: planId } } })
  if (existing.docs.length) throw new APIError('El plan de Figma ya ha sido revisado.', 409)
  const planDocument = await payload.findByID({ collection: 'figma-import-plans', depth: 0, id: planId, overrideAccess: false, req })
  const storedPlanId = planDocument.id
  if ((typeof storedPlanId !== 'string' && typeof storedPlanId !== 'number') || String(storedPlanId) !== String(planId)) throw new APIError('El plan no coincide con el identificador solicitado.', 409)
  let verifiedHash: string
  try { verifiedHash = hashFigmaImportPlan(planDocument.plan as FigmaImportPlan) } catch { throw new APIError('El plan no supera la verificación de integridad.', 409) }
  if (planDocument.planHash !== verifiedHash) throw new APIError('El hash almacenado del plan no coincide.', 409)
  const review = createFigmaImportReview({ decidedAt: now ?? new Date().toISOString(), decidedBy: req.user.id, decision, note, planHash: verifiedHash, planId: storedPlanId })
  const created = await payload.create({
    collection: 'figma-import-reviews',
    data: { decidedAt: review.decidedAt, decidedBy: req.user.id, decision, note: review.note, plan: storedPlanId, planHash: verifiedHash, reviewHash: review.hash, schemaVersion: review.schemaVersion },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: { action: `figma.plan.${decision}`, metadata: { planHash: verifiedHash, reviewHash: review.hash }, outcome: 'success', subject: { collection: 'figma-import-plans', id: planId } },
    payload: payload as never,
    req,
    user: req.user,
  })
  return created
}
