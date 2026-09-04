import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
  type CollectionBeforeOperationHook,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { createPreviewManifest, type PreviewManifestInput } from '../preview/manifest'

const immutableError = () => new APIError('Los snapshots de preview son inmutables.', 403)
const ownerError = () => new APIError('Solo el owner puede acceder a snapshots de preview.', 403)

export const enforcePreviewSnapshotOperation: CollectionBeforeOperationHook = async ({ req }) => {
  if (!isOwner(req.user)) throw ownerError()
}

export const prepareImmutablePreviewSnapshot: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  // Payload Local API defaults overrideAccess to true. This hook deliberately repeats
  // authorization so an untrusted local caller cannot bypass owner-only creation.
  if (!isOwner(req.user)) throw ownerError()

  const input = data.input as PreviewManifestInput | undefined
  const manifest = createPreviewManifest(input as PreviewManifestInput)
  return {
    schemaVersion: manifest.schemaVersion,
    sourceCollection: manifest.source.collection,
    sourceDocumentId: manifest.source.documentId,
    sourceVersionId: manifest.source.versionId,
    manifest,
    manifestHash: manifest.hash,
    createdBy: req.user.id,
  }
}

export const enforceImmutablePreviewDelete: CollectionBeforeDeleteHook = async () => {
  throw immutableError()
}

export const PreviewSnapshots: CollectionConfig = {
  slug: 'preview-snapshots',
  admin: {
    defaultColumns: ['sourceCollection', 'sourceDocumentId', 'manifestHash', 'createdAt'],
    useAsTitle: 'manifestHash',
  },
  access: {
    create: ownerOnly,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareImmutablePreviewSnapshot],
    beforeDelete: [enforceImmutablePreviewDelete],
    beforeOperation: [enforcePreviewSnapshotOperation],
  },
  fields: [
    {
      name: 'input',
      type: 'json',
      required: true,
      virtual: true,
      admin: { description: 'Entrada estructurada; se valida y transforma antes de guardar.' },
    },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'sourceCollection', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceDocumentId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceVersionId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'manifest', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'manifestHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
