import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'
import { hashDraftCapsule, type DraftCapsule } from '../recovery/capsule'
import { confirmRestorePlanData } from './plan'

export type RestorePayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
  update?(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

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

export const verifiedSnapshot = async (
  payload: RestorePayload,
  req: { user?: unknown },
  snapshotId: string | number,
) => {
  const snapshot = record(await payload.findByID({
    collection: 'preview-snapshots', depth: 0, id: snapshotId, overrideAccess: false, req,
  }), 'El snapshot')
  const manifest = snapshot.manifest as PreviewManifest
  let manifestHash: string
  try {
    manifestHash = hashPreviewManifest(manifest)
  } catch {
    throw new APIError('El manifiesto del snapshot no supera la verificación de hash.', 400)
  }
  if (snapshot.manifestHash !== manifestHash) throw new APIError('El snapshot no coincide con su manifiesto.', 400)
  return { id: relationId(snapshot, 'El snapshot'), manifest, manifestHash }
}

export const verifiedDraftSnapshot = async (
  payload: RestorePayload,
  req: { user?: unknown },
  snapshotId: string | number,
) => {
  const snapshot = record(await payload.findByID({
    collection: 'draft-snapshots', depth: 0, id: snapshotId, overrideAccess: false, req,
  }), 'El snapshot de borrador')
  const capsule = snapshot.capsule as DraftCapsule
  let capsuleHash: string
  try {
    capsuleHash = hashDraftCapsule(capsule)
  } catch {
    throw new APIError('La cápsula del borrador no supera la verificación de hash.', 400)
  }
  if (snapshot.capsuleHash !== capsuleHash) throw new APIError('El snapshot de borrador no coincide con su cápsula.', 400)
  return { capsule, capsuleHash, id: relationId(snapshot, 'El snapshot de borrador') }
}

export const createOwnerRestorePlan = async ({
  baselineSnapshot,
  confirmation,
  payload,
  releaseId,
  req,
}: {
  baselineSnapshot: string | number
  confirmation: string
  payload: RestorePayload
  releaseId: string | number
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'PREPARAR RESTAURACIÓN') throw new APIError('La primera confirmación no coincide.', 400)
  const release = record(await payload.findByID({
    collection: 'releases', depth: 0, id: releaseId, overrideAccess: false, req,
  }), 'La versión')
  const target = await verifiedSnapshot(payload, req, relationId(release.previewSnapshot, 'El snapshot objetivo'))
  const targetDraft = await verifiedDraftSnapshot(payload, req, relationId(release.draftSnapshot, 'El snapshot de borrador objetivo'))
  const baseline = await verifiedSnapshot(payload, req, baselineSnapshot)
  if (target.manifest.source.collection !== 'pages' || baseline.manifest.source.collection !== 'pages') {
    throw new APIError('La restauración solo admite snapshots de páginas.', 400)
  }
  if (target.manifest.source.documentId !== baseline.manifest.source.documentId) {
    throw new APIError('El snapshot actual y la versión no pertenecen a la misma página.', 409)
  }
  if (
    targetDraft.capsule.source.documentId !== target.manifest.source.documentId ||
    targetDraft.capsule.source.versionId !== target.manifest.source.versionId
  ) {
    throw new APIError('Los snapshots objetivo no pertenecen a la misma revisión.', 409)
  }
  const plan = await payload.create({
    collection: 'restore-plans',
    data: {
      baselineHash: baseline.manifestHash,
      baselineSnapshot: baseline.id,
      confirmation,
      release: relationId(release, 'La versión'),
      targetHash: target.manifestHash,
      targetCapsuleHash: targetDraft.capsuleHash,
      targetDraftSnapshot: targetDraft.id,
      targetPage: target.manifest.source.documentId,
      targetSnapshot: target.id,
    },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'restore.plan.created',
      metadata: { baselineHash: baseline.manifestHash, targetCapsuleHash: targetDraft.capsuleHash, targetHash: target.manifestHash },
      outcome: 'success',
      subject: { collection: 'restore-plans', id: relationId(plan, 'El plan') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return plan
}

export const confirmOwnerRestorePlan = async ({
  confirmation,
  currentSnapshot,
  now,
  payload,
  planId,
  req,
}: {
  confirmation: string
  currentSnapshot: string | number
  now?: string
  payload: RestorePayload
  planId: string | number
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (!payload.update) throw new APIError('La confirmación de restauración no está disponible.', 500)
  const plan = record(await payload.findByID({
    collection: 'restore-plans', depth: 0, id: planId, overrideAccess: false, req,
  }), 'El plan')
  const current = await verifiedSnapshot(payload, req, currentSnapshot)
  if (current.manifest.source.documentId !== String(relationId(plan.targetPage, 'La página objetivo'))) {
    throw new APIError('El snapshot de confirmación no pertenece a la página objetivo.', 409)
  }
  const data = confirmRestorePlanData(
    { baselineHash: plan.baselineHash, status: plan.status },
    { confirmation, currentHash: current.manifestHash, currentSnapshot: current.id },
    req.user,
    now,
  )
  const updated = await payload.update({
    collection: 'restore-plans', data, id: planId, overrideAccess: true, req,
  })
  await recordAuditEvent({
    input: {
      action: `restore.plan.${data.status}`,
      metadata: { confirmationHash: current.manifestHash },
      outcome: data.status === 'confirmed' ? 'success' : 'denied',
      subject: { collection: 'restore-plans', id: relationId(plan, 'El plan') },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return updated
}
