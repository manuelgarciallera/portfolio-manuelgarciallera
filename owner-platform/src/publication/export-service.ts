import 'server-only'

import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPublicationArtifact, type PublicationArtifact } from './artifact'
import { hashPublicationBundle, type PublicationBundle } from './bundle'
import { createPublicationExport } from './export'

type Payload = { create(args: Record<string, unknown>): Promise<Record<string, unknown>>; findByID(args: Record<string, unknown>): Promise<Record<string, unknown>> }
const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value && (typeof value.id === 'string' || typeof value.id === 'number')) return value.id
  throw new APIError(`${label} no tiene identificador.`, 409)
}

export const createOwnerPublicationExport = async ({ artifactId, exportedAt = new Date().toISOString(), payload, req }: {
  artifactId: string | number; exportedAt?: string; payload: Payload; req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const artifactDocument = await payload.findByID({ collection: 'publication-artifacts', depth: 0, id: artifactId, overrideAccess: false, req })
  const artifact = artifactDocument.artifact as PublicationArtifact
  let artifactHash: string
  try { artifactHash = hashPublicationArtifact(artifact) } catch { throw new APIError('El artefacto no supera la verificación de integridad.', 409) }
  const bundleId = relationId(artifactDocument.bundle, 'El paquete')
  if (artifactDocument.artifactHash !== artifactHash || artifactDocument.bundleHash !== artifact.bundleHash || String(bundleId) !== String(artifact.bundleId) || artifactDocument.pageCount !== artifact.pageCount) {
    throw new APIError('La procedencia persistida del artefacto no coincide.', 409)
  }
  const bundleDocument = await payload.findByID({ collection: 'publication-bundles', depth: 0, id: bundleId, overrideAccess: false, req })
  const bundle = bundleDocument.bundle as PublicationBundle
  let bundleHash: string
  try { bundleHash = hashPublicationBundle(bundle) } catch { throw new APIError('El paquete no supera la verificación de integridad.', 409) }
  if (bundleDocument.bundleHash !== bundleHash || artifact.bundleHash !== bundleHash || bundleDocument.pageCount !== artifact.pageCount) throw new APIError('El paquete no coincide con el artefacto aprobado.', 409)
  let output
  try { output = createPublicationExport({ artifact, bundle, exportedAt }) } catch { throw new APIError('No se pudo crear una exportación íntegra.', 409) }
  await recordAuditEvent({
    input: { action: 'publication.export.downloaded', metadata: { artifactHash, bundleHash, exportHash: output.hash, pageCount: output.pageCount }, outcome: 'success', subject: { collection: 'publication-artifacts', id: artifactId } },
    payload: payload as never, req, user: req.user,
  })
  return output
}
