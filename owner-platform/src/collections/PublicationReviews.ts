import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { documentPanel } from './document-panel'
import { createPublicationReview } from '../publication/review'

const immutableError = () => new APIError('Las revisiones de publicación son inmutables.', 403)

export const preparePublicationReview: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  let canonical
  try {
    canonical = createPublicationReview({
      bundleHash: data.bundleHash, bundleId: data.bundle, decision: data.decision, decidedAt: data.decidedAt,
      decidedBy: data.decidedBy, note: data.note,
    })
  } catch {
    throw new APIError('La revisión de publicación no es válida.', 400)
  }
  if (
    String(data.decidedBy) !== String(req.user.id) || data.reviewHash !== canonical.hash ||
    data.schemaVersion !== canonical.schemaVersion
  ) throw new APIError('El hash o la procedencia de la revisión no coincide.', 400)
  return data
}

export const enforcePublicationReviewDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const PublicationReviews: CollectionConfig = {
  slug: 'publication-reviews',
  admin: {
    defaultColumns: ['bundle', 'decision', 'decidedBy', 'decidedAt'],
    useAsTitle: 'reviewHash',
  },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [preparePublicationReview], beforeDelete: [enforcePublicationReviewDelete] },
  fields: [
    documentPanel('./components/PublicationReviewControls#PublicationReviewControls'),
    { name: 'bundle', type: 'relationship', relationTo: 'publication-bundles', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'bundleHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'decision', type: 'select', required: true, options: ['approved', 'rejected'], admin: { readOnly: true } },
    { name: 'decidedBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'decidedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'note', type: 'textarea', maxLength: 1_000, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'reviewHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
  ],
}
