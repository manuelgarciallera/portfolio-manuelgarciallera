import { APIError } from 'payload'
import { ReleaseAlreadyRegistered } from './conflict'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { hashDraftCapsule, type DraftCapsule } from '../recovery/capsule'
import { withPublicationTransaction } from '../publication/transaction'

type ReleasePayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

// The database adapter and the compiled route can load distinct Payload class
// instances. Inspect only this narrow validation envelope; a permission-aware
// database lookup below must still confirm the conflicting committed record.
const validatesReleaseCommit = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const value = error as { status?: unknown; data?: { collection?: unknown; errors?: unknown } }
  return value.status === 400 && value.data?.collection === 'releases'
    && Array.isArray(value.data.errors)
    && value.data.errors.some(item => item && typeof item === 'object' && item.path === 'gitCommit')
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
  const draftSnapshotId = relationId(input.draftSnapshot, 'El snapshot de borrador')
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
  const draftSnapshot = record(await payload.findByID({
    collection: 'draft-snapshots',
    depth: 0,
    id: draftSnapshotId,
    overrideAccess: false,
    req,
  }), 'El snapshot de borrador')
  const capsule = draftSnapshot.capsule as DraftCapsule
  let capsuleHash: string
  try {
    capsuleHash = hashDraftCapsule(capsule)
  } catch {
    throw new APIError('La cápsula del borrador no supera la verificación de hash.', 400)
  }
  if (draftSnapshot.capsuleHash !== capsuleHash) {
    throw new APIError('El snapshot de borrador no coincide con su cápsula.', 400)
  }
  if (
    capsule.source.documentId !== manifest.source.documentId ||
    capsule.source.versionId !== manifest.source.versionId
  ) {
    throw new APIError('Los snapshots visual y restorable no pertenecen a la misma revisión.', 409)
  }
  const owner = req.user
  return withPublicationTransaction(req, async () => {
    const release = await payload.create({
      collection: 'releases',
      data: { ...input, createdBy: owner.id, draftSnapshot: draftSnapshotId, previewSnapshot: snapshotId },
      overrideAccess: true,
      req,
    })
    await recordAuditEvent({
      input: {
        action: 'release.registered',
        metadata: { capsuleHash, gitCommit: input.gitCommit, snapshotHash: verifiedHash },
        outcome: 'success',
        subject: { collection: 'releases', id: relationId(release, 'La versión') },
      },
      payload: payload as never,
      req,
      user: owner,
    })
    return release
  }).catch(async (error: unknown) => {
    // Native create has rolled back before rejecting. The unique index remains
    // the arbiter for simultaneous requests; only a confirmed commit conflicts.
    if (validatesReleaseCommit(error)) {
      let existing
      try {
        existing = await payload.find({ collection: 'releases', depth: 0, limit: 1,
          overrideAccess: false, req, where: { gitCommit: { equals: input.gitCommit } } })
      } catch { throw error }
      if (existing.docs.length) throw new ReleaseAlreadyRegistered()
    }
    throw error
  })
}
