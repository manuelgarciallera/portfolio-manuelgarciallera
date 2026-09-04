import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { hashDraftCapsule, type DraftCapsule } from '../recovery/capsule'

const immutableError = () => new APIError('Los snapshots de borrador son inmutables.', 403)

export const prepareImmutableDraftSnapshot: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const capsule = data.capsule as DraftCapsule
  let hash: string
  try {
    hash = hashDraftCapsule(capsule)
  } catch {
    throw new APIError('La cápsula de borrador no supera la verificación de hash.', 400)
  }
  if (
    data.capsuleHash !== hash ||
    data.schemaVersion !== capsule.schemaVersion ||
    String(data.sourceDocumentId) !== capsule.source.documentId ||
    String(data.sourceVersionId) !== capsule.source.versionId ||
    String(data.createdBy) !== String(req.user.id)
  ) {
    throw new APIError('La procedencia persistida no coincide con la cápsula.', 400)
  }
  return data
}

export const enforceImmutableDraftSnapshotDelete: CollectionBeforeDeleteHook = async () => {
  throw immutableError()
}

export const DraftSnapshots: CollectionConfig = {
  slug: 'draft-snapshots',
  admin: {
    defaultColumns: ['sourceDocumentId', 'capsuleHash', 'createdAt'],
    useAsTitle: 'capsuleHash',
  },
  access: {
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareImmutableDraftSnapshot],
    beforeDelete: [enforceImmutableDraftSnapshotDelete],
  },
  fields: [
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'sourceDocumentId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceVersionId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'capsule', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'capsuleHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
