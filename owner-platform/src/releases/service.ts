import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'

type ReleasePayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new APIError(`${label} no es válido.`, 400)
  }
  return value as Record<string, unknown>
}

const relationId = (value: unknown, label: string): string | number => {
  if (typeof value === 'string' || typeof value === 'number') return value
  const expanded = record(value, label)
  if (typeof expanded.id === 'string' || typeof expanded.id === 'number') return expanded.id
  throw new APIError(`${label} no tiene identificador.`, 400)
}

export const createOwnerRelease = async ({
  input,
  payload,
  req,
}: {
  input: Record<string, unknown>
  payload: ReleasePayload
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const snapshotId = relationId(input.previewSnapshot, 'El snapshot')
  const snapshot = record(await payload.findByID({
    collection: 'preview-snapshots',
    depth: 0,
    id: snapshotId,
    overrideAccess: false,
    req,
  }), 'El snapshot')
  const manifest = snapshot.manifest as PreviewManifest
  let verifiedHash: string
  try {
    verifiedHash = hashPreviewManifest(manifest)
  } catch {
    throw new APIError('El manifiesto del snapshot no supera la verificación de hash.', 400)
  }
  if (snapshot.manifestHash !== verifiedHash) {
    throw new APIError('El snapshot no coincide con su manifiesto.', 400)
  }
  const release = await payload.create({
    collection: 'releases',
    data: { ...input, createdBy: req.user.id, previewSnapshot: snapshotId },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'release.registered',
      metadata: { gitCommit: input.gitCommit, snapshotHash: verifiedHash },
      outcome: 'success',
      subject: { collection: 'releases', id: relationId(release, 'La versión') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return release
}
