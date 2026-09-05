import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { createFigmaImportReview } from '../connectors/figma/import-review'

const immutableError = () => new APIError('Las revisiones de importación de Figma son inmutables.', 403)

export const prepareFigmaImportReview: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  let canonical
  try { canonical = createFigmaImportReview({ decidedAt: data.decidedAt, decidedBy: data.decidedBy, decision: data.decision, note: data.note, planHash: data.planHash, planId: data.plan }) }
  catch { throw new APIError('La revisión de importación de Figma no es válida.', 400) }
  if (String(data.decidedBy) !== String(req.user.id) || data.reviewHash !== canonical.hash || data.schemaVersion !== canonical.schemaVersion) throw new APIError('El hash o la procedencia de la revisión no coincide.', 400)
  return data
}

export const enforceFigmaImportReviewDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const FigmaImportReviews: CollectionConfig = {
  slug: 'figma-import-reviews',
  admin: { defaultColumns: ['plan', 'decision', 'decidedBy', 'decidedAt'], useAsTitle: 'reviewHash' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [prepareFigmaImportReview], beforeDelete: [enforceFigmaImportReviewDelete] },
  fields: [
    { name: 'plan', type: 'relationship', relationTo: 'figma-import-plans', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'planHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'decision', type: 'select', required: true, options: ['approved', 'rejected'], admin: { readOnly: true } },
    { name: 'decidedBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'decidedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'note', type: 'textarea', maxLength: 1_000, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'reviewHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
  ],
}
