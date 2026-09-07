import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { documentPanel } from './document-panel'
import { hashPublicationArtifact, type PublicationArtifact } from '../publication/artifact'

const immutableError = () => new APIError('Los artefactos de publicación son inmutables.', 403)

export const preparePublicationArtifact: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const artifact = data.artifact as PublicationArtifact
  let artifactHash: string
  try { artifactHash = hashPublicationArtifact(artifact) } catch { throw new APIError('El artefacto no supera la verificación de hash.', 400) }
  if (
    data.artifactHash !== artifactHash || data.bundleHash !== artifact.bundleHash || String(data.bundle) !== String(artifact.bundleId) ||
    String(data.review) !== String(artifact.reviewId) || data.reviewHash !== artifact.reviewHash || data.pageCount !== artifact.pageCount ||
    data.schemaVersion !== artifact.schemaVersion || String(data.createdBy) !== String(req.user.id)
  ) throw new APIError('La procedencia o el recuento de páginas del artefacto no coincide.', 400)
  return data
}

export const enforcePublicationArtifactDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const PublicationArtifacts: CollectionConfig = {
  slug: 'publication-artifacts',
  admin: { defaultColumns: ['bundle', 'review', 'pageCount', 'createdAt'], useAsTitle: 'artifactHash' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [preparePublicationArtifact], beforeDelete: [enforcePublicationArtifactDelete] },
  fields: [
    documentPanel('./components/PublicationArtifactControls#PublicationArtifactControls'),
    { name: 'review', type: 'relationship', relationTo: 'publication-reviews' as never, required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'reviewHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'bundle', type: 'relationship', relationTo: 'publication-bundles', required: true, index: true, admin: { readOnly: true } },
    { name: 'bundleHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'pageCount', type: 'number', required: true, min: 1, max: 100, admin: { readOnly: true } },
    { name: 'artifact', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'artifactHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
