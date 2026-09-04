import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { hashPreviewManifest, type PreviewManifest } from '../preview/manifest'

const immutableError = () => new APIError('Los snapshots de preview son inmutables.', 403)
const ownerError = () => new APIError('Solo el owner puede crear snapshots de preview.', 403)

export const prepareImmutablePreviewSnapshot: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw ownerError()

  const manifest = data.manifest as PreviewManifest
  const hash = hashPreviewManifest(manifest)
  if (data.manifestHash !== hash) throw new APIError('El hash persistido no coincide con el manifiesto.', 400)
  if (
    data.schemaVersion !== manifest.schemaVersion ||
    data.sourceCollection !== manifest.source.collection ||
    String(data.sourceDocumentId) !== manifest.source.documentId ||
    String(data.sourceVersionId) !== manifest.source.versionId
  ) throw new APIError('La procedencia persistida no coincide con el manifiesto.', 400)
  return data
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
    create: () => false,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [prepareImmutablePreviewSnapshot],
    beforeDelete: [enforceImmutablePreviewDelete],
  },
  fields: [
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'sourceCollection', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceDocumentId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'sourceVersionId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'manifest', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'manifestHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
