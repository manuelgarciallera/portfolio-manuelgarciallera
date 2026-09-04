import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { createDraftCapsule } from './capsule'

type RecoveryPayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findByID(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new APIError('La página no tiene un estado de borrador válido.', 400)
  return value as Record<string, unknown>
}

const relationId = (value: unknown): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const id = (value as { id?: unknown }).id
    if ((typeof id === 'string' || typeof id === 'number') && String(id).trim()) return id
  }
  throw new APIError('La página no tiene un perfil de marca restorable.', 400)
}

export const createPageDraftSnapshot = async ({
  pageId,
  payload,
  req,
}: {
  pageId: string | number
  payload: RecoveryPayload
  req: { user?: unknown }
}) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const page = record(await payload.findByID({
    collection: 'pages', depth: 0, draft: true, id: pageId, overrideAccess: false, req,
  }))
  let capsule
  try {
    capsule = createDraftCapsule({
      source: {
        collection: 'pages',
        documentId: String(page.id),
        versionId: `current:${String(page.updatedAt)}`,
      },
      state: {
        ...(Object.hasOwn(page, 'brandOverrides') ? { brandOverrides: page.brandOverrides } : {}),
        brandProfile: relationId(page.brandProfile),
        layout: page.layout,
        slug: page.slug,
        title: page.title,
      },
    })
  } catch {
    throw new APIError('La página no tiene un estado de borrador restorable.', 400)
  }
  const snapshot = await payload.create({
    collection: 'draft-snapshots',
    data: {
      capsule,
      capsuleHash: capsule.hash,
      createdBy: req.user.id,
      schemaVersion: capsule.schemaVersion,
      sourceDocumentId: capsule.source.documentId,
      sourceVersionId: capsule.source.versionId,
    },
    overrideAccess: true,
    req,
  })
  await recordAuditEvent({
    input: {
      action: 'draft.snapshot.created',
      metadata: { capsuleHash: capsule.hash, snapshotId: snapshot.id },
      outcome: 'success',
      subject: { collection: 'pages', id: capsule.source.documentId },
    },
    payload: payload as never,
    req,
    user: req.user,
  })
  return snapshot
}
