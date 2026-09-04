import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { verifiedDraftSnapshot, verifiedSnapshot, type RestorePayload } from '../restore/service'
import { createPublicationBundle } from './bundle'

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError(`${label} no es válido.`, 400)
  return value as Record<string, unknown>
}

const relationId = (value: unknown, label: string): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  const expanded = record(value, label)
  if ((typeof expanded.id === 'string' || typeof expanded.id === 'number') && String(expanded.id).trim()) return expanded.id
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const createOwnerPublicationBundle = async ({
  confirmation,
  name,
  payload,
  releaseIds,
  req,
}: {
  confirmation: string
  name: string
  payload: RestorePayload
  releaseIds: Array<string | number>
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'PREPARAR PUBLICACIÓN') throw new APIError('La confirmación de preparación no coincide.', 400)
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) throw new APIError('El nombre del paquete no es válido.', 400)
  if (!Array.isArray(releaseIds) || releaseIds.length < 1 || releaseIds.length > 100) throw new APIError('Selecciona entre una y cien versiones.', 400)
  if (new Set(releaseIds.map(String)).size !== releaseIds.length) throw new APIError('La selección contiene versiones duplicadas.', 400)

  const entries = await Promise.all(releaseIds.map(async (releaseId, position) => {
    const release = record(await payload.findByID({
      collection: 'releases', depth: 0, id: releaseId, overrideAccess: false, req,
    }), 'La versión')
    const draft = await verifiedDraftSnapshot(payload, req, relationId(release.draftSnapshot, 'El snapshot de borrador'))
    const preview = await verifiedSnapshot(payload, req, relationId(release.previewSnapshot, 'El snapshot visual'))
    if (
      draft.capsule.source.documentId !== preview.manifest.source.documentId ||
      draft.capsule.source.versionId !== preview.manifest.source.versionId
    ) throw new APIError('Los snapshots de la versión no pertenecen a la misma revisión.', 409)
    return {
      capsule: draft.capsule,
      draftHash: draft.capsuleHash,
      pageId: draft.capsule.source.documentId,
      position,
      previewHash: preview.manifestHash,
      releaseId: relationId(release, 'La versión'),
      sourceVersionId: draft.capsule.source.versionId,
    }
  }))
  let bundle
  try {
    bundle = createPublicationBundle({ entries })
  } catch (error) {
    throw new APIError(error instanceof Error ? error.message : 'El paquete no es válido.', 400)
  }
  const created = await payload.create({
    collection: 'publication-bundles',
    data: {
      bundle,
      bundleHash: bundle.hash,
      createdBy: req.user.id,
      name: name.trim(),
      pageCount: bundle.entries.length,
      schemaVersion: bundle.schemaVersion,
    },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'publication.bundle.created',
      metadata: { bundleHash: bundle.hash, pageCount: bundle.entries.length },
      outcome: 'success',
      subject: { collection: 'publication-bundles', id: relationId(created, 'El paquete') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return created
}
