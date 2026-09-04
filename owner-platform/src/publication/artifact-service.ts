import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { createPublicationArtifact } from './artifact'
import { hashPublicationBundle, type PublicationBundle } from './bundle'
import { hashPublicationReview, type PublicationReview } from './review'

type ArtifactPayload = { create(args: Record<string, unknown>): Promise<Record<string, unknown>>; find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }>; findByID(args: Record<string, unknown>): Promise<Record<string, unknown>> }
const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value) && ('id' in value) && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const createOwnerPublicationArtifact = async ({ confirmation, payload, req, reviewId }: { confirmation: string; payload: ArtifactPayload; req: { user?: unknown }; reviewId: string | number }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'GENERAR ARTEFACTO') throw new APIError('La confirmación no coincide.', 400)
  const existing = await payload.find({ collection: 'publication-artifacts', depth: 0, limit: 1, overrideAccess: false, req, where: { review: { equals: reviewId } } })
  if (existing.docs.length) throw new APIError('El artefacto ya existe para esta revisión.', 409)
  const reviewDoc = await payload.findByID({ collection: 'publication-reviews', depth: 0, id: reviewId, overrideAccess: false, req })
  if (reviewDoc.decision !== 'approved') throw new APIError('La revisión debe estar aprobada.', 409)
  const bundleId = relationId(reviewDoc.bundle, 'El paquete')
  const canonicalReview: PublicationReview = {
    bundleHash: String(reviewDoc.bundleHash), bundleId, decision: 'approved', decidedAt: String(reviewDoc.decidedAt),
    decidedBy: relationId(reviewDoc.decidedBy, 'El owner'), hash: String(reviewDoc.reviewHash),
    ...(typeof reviewDoc.note === 'string' && reviewDoc.note ? { note: reviewDoc.note } : {}), schemaVersion: 1,
  }
  let reviewHash: string
  try { reviewHash = hashPublicationReview(canonicalReview) } catch { throw new APIError('La revisión no supera la verificación de integridad.', 409) }
  const bundleDoc = await payload.findByID({ collection: 'publication-bundles', depth: 0, id: bundleId, overrideAccess: false, req })
  let bundleHash: string
  try { bundleHash = hashPublicationBundle(bundleDoc.bundle as PublicationBundle) } catch { throw new APIError('El paquete no supera la verificación de integridad.', 409) }
  if (bundleHash !== reviewDoc.bundleHash || bundleHash !== bundleDoc.bundleHash) throw new APIError('La revisión no pertenece al paquete verificado.', 409)
  const artifact = createPublicationArtifact({ bundleHash, bundleId, pageCount: bundleDoc.pageCount, reviewHash, reviewId })
  const created = await payload.create({ collection: 'publication-artifacts', data: { artifact, artifactHash: artifact.hash, bundle: bundleId, bundleHash, createdBy: req.user.id, pageCount: artifact.pageCount, review: reviewId, reviewHash, schemaVersion: artifact.schemaVersion }, overrideAccess: true, req })
  await recordAuditEvent({ input: { action: 'publication.artifact.created', metadata: { artifactHash: artifact.hash, bundleHash, reviewHash }, outcome: 'success', subject: { collection: 'publication-artifacts', id: relationId(created, 'El artefacto') } }, payload: payload as never, req, user: req.user })
  return created
}
