import 'server-only'

import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPublicationArtifact, type PublicationArtifact } from './artifact'
import { hashPublicationBundle, type PublicationBundle } from './bundle'
import { createPublicationExport } from './export'
import { createPublicationPreflight } from './preflight'

type Payload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  find(args: Record<string, unknown>): Promise<{ docs: Record<string, unknown>[]; totalDocs: number }>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}
const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  throw new APIError(`${label} no tiene identificador.`, 409)
}

export const createOwnerPublicationPreflight = async ({ artifactId, checkedAt = new Date().toISOString(), payload, req }: {
  artifactId: string | number; checkedAt?: string; payload: Payload; req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const existing = await payload.find({ collection: 'publication-preflights', depth: 0, limit: 1, overrideAccess: false, req, where: { artifact: { equals: artifactId } } })
  if (existing.totalDocs > 0 && existing.docs[0]) return existing.docs[0]

  const artifactDocument = await payload.findByID({ collection: 'publication-artifacts', depth: 0, id: artifactId, overrideAccess: false, req })
  const artifact = artifactDocument.artifact as PublicationArtifact
  let artifactHash: string
  try { artifactHash = hashPublicationArtifact(artifact) } catch { throw new APIError('El artefacto no supera la verificación de integridad.', 409) }
  const bundleId = relationId(artifactDocument.bundle, 'El paquete')
  if (artifactDocument.artifactHash !== artifactHash || artifactDocument.bundleHash !== artifact.bundleHash || String(bundleId) !== String(artifact.bundleId) || artifactDocument.pageCount !== artifact.pageCount) throw new APIError('La procedencia persistida del artefacto no coincide.', 409)

  const bundleDocument = await payload.findByID({ collection: 'publication-bundles', depth: 0, id: bundleId, overrideAccess: false, req })
  const bundle = bundleDocument.bundle as PublicationBundle
  let bundleHash: string
  try { bundleHash = hashPublicationBundle(bundle) } catch { throw new APIError('El paquete no supera la verificación de integridad.', 409) }
  if (bundleDocument.bundleHash !== bundleHash || artifact.bundleHash !== bundleHash || bundleDocument.pageCount !== artifact.pageCount) throw new APIError('El paquete no coincide con el artefacto aprobado.', 409)

  let exported
  let report
  try {
    exported = createPublicationExport({ artifact, bundle, exportedAt: checkedAt })
    report = createPublicationPreflight(exported, checkedAt)
  } catch { throw new APIError('No se pudo crear un preflight íntegro.', 409) }
  const created = await payload.create({
    collection: 'publication-preflights',
    data: { artifact: artifactId, artifactHash, checkedAt, createdBy: req.user.id, exportHash: exported.hash, issueCount: report.issueCount, pageCount: report.pageCount, preflightHash: report.hash, report, schemaVersion: report.schemaVersion, status: report.status },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: { action: 'publication.preflight.created', metadata: { artifactHash, blockerCount: report.issues.filter(({ severity }) => severity === 'blocker').length, exportHash: exported.hash, issueCount: report.issueCount, preflightHash: report.hash, status: report.status }, outcome: 'success', subject: { collection: 'publication-preflights', id: relationId(created, 'El preflight') } },
    payload: payload as never, req, user: req.user,
  })
  return created
}

