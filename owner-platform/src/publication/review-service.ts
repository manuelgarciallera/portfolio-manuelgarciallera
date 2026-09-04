import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPublicationBundle, type PublicationBundle } from './bundle'
import { createPublicationReview, type PublicationReviewDecision } from './review'

type ReviewPayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

export const createOwnerPublicationReview = async ({ bundleId, confirmation, decision, note, now, payload, req }: {
  bundleId: string | number; confirmation: string; decision: PublicationReviewDecision; note?: string; now?: string
  payload: ReviewPayload; req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const expected = decision === 'approved' ? 'APROBAR PAQUETE' : 'RECHAZAR PAQUETE'
  if (confirmation !== expected) throw new APIError('La confirmación no coincide con la decisión.', 400)
  const existing = await payload.find({ collection: 'publication-reviews', depth: 0, limit: 1, overrideAccess: false, req, where: { bundle: { equals: bundleId } } })
  if (existing.docs.length) throw new APIError('El paquete ya ha sido revisado y decidido.', 409)
  const bundleDoc = await payload.findByID({ collection: 'publication-bundles', depth: 0, id: bundleId, overrideAccess: false, req })
  let verifiedHash: string
  try { verifiedHash = hashPublicationBundle(bundleDoc.bundle as PublicationBundle) }
  catch { throw new APIError('El paquete no supera la verificación de integridad.', 409) }
  if (bundleDoc.bundleHash !== verifiedHash) throw new APIError('El hash almacenado del paquete no coincide.', 409)
  const review = createPublicationReview({ bundleHash: verifiedHash, bundleId, decision, decidedAt: now ?? new Date().toISOString(), decidedBy: req.user.id, note })
  const created = await payload.create({
    collection: 'publication-reviews',
    data: { bundle: bundleId, bundleHash: verifiedHash, decision, decidedAt: review.decidedAt, decidedBy: req.user.id, note: review.note, reviewHash: review.hash, schemaVersion: review.schemaVersion },
    overrideAccess: true, req,
  })
  await recordAuditEvent({
    input: { action: `publication.bundle.${decision}`, metadata: { bundleHash: verifiedHash, reviewHash: review.hash }, outcome: 'success', subject: { collection: 'publication-bundles', id: bundleId } },
    payload: payload as never, req, user: req.user,
  })
  return created
}
