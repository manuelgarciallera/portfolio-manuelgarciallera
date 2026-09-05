import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { createFigmaImportExecution } from '../connectors/figma/import-execution'

const immutableError = () => new APIError('Las importaciones ejecutadas de Figma son inmutables.', 403)

export const prepareFigmaImportExecution: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  let canonical
  try {
    canonical = createFigmaImportExecution({
      contentHash: data.contentHash, importedAt: data.importedAt, importedBy: data.importedBy,
      mediaId: data.media, mimeType: data.mimeType, placementId: data.placement, planHash: data.planHash, planId: data.plan,
      reviewHash: data.reviewHash, reviewId: data.review, size: data.size,
    })
  } catch { throw new APIError('La evidencia de importación de Figma no es válida.', 400) }
  if (String(data.importedBy) !== String(req.user.id) || data.executionHash !== canonical.hash || data.schemaVersion !== canonical.schemaVersion) {
    throw new APIError('El hash o la procedencia de la importación no coincide.', 400)
  }
  return data
}

export const enforceFigmaImportExecutionDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const FigmaImportExecutions: CollectionConfig = {
  slug: 'figma-import-executions',
  admin: { defaultColumns: ['media', 'plan', 'review', 'importedAt'], useAsTitle: 'executionHash' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [prepareFigmaImportExecution], beforeDelete: [enforceFigmaImportExecutionDelete] },
  fields: [
    { name: 'review', type: 'relationship', relationTo: 'figma-import-reviews', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'reviewHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'plan', type: 'relationship', relationTo: 'figma-import-plans', required: true, index: true, admin: { readOnly: true } },
    { name: 'planHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'media', type: 'relationship', relationTo: 'media', required: true, unique: true, admin: { readOnly: true } },
    { name: 'placement', type: 'relationship', relationTo: 'media-placements', required: true, unique: true, admin: { readOnly: true } },
    { name: 'contentHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'mimeType', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'size', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'importedBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
    { name: 'importedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'executionHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
  ],
}
