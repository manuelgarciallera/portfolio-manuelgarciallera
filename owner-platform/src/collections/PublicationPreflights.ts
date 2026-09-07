import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import { documentPanel } from './document-panel'
import { hashPublicationPreflight, type PublicationPreflight } from '../publication/preflight'

const immutableError = () => new APIError('Los informes de preflight son inmutables.', 403)

export const preparePublicationPreflight: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const report = data.report as PublicationPreflight
  let reportHash: string
  try { reportHash = hashPublicationPreflight(report) } catch { throw new APIError('El informe de preflight no supera la verificación de hash.', 400) }
  if (
    data.preflightHash !== reportHash || data.artifactHash !== report.artifactHash || data.exportHash !== report.exportHash ||
    data.checkedAt !== report.checkedAt || data.issueCount !== report.issueCount || data.pageCount !== report.pageCount ||
    data.schemaVersion !== report.schemaVersion || data.status !== report.status || String(data.createdBy) !== String(req.user.id)
  ) throw new APIError('La procedencia o el contenido del informe de preflight no coincide.', 400)
  return data
}

export const enforcePublicationPreflightDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const PublicationPreflights: CollectionConfig = {
  slug: 'publication-preflights',
  admin: { defaultColumns: ['artifact', 'status', 'issueCount', 'checkedAt'], useAsTitle: 'preflightHash' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [preparePublicationPreflight], beforeDelete: [enforcePublicationPreflightDelete] },
  fields: [
    documentPanel('./components/PublicationPreflightSummary#PublicationPreflightSummary'),
    { name: 'artifact', type: 'relationship', relationTo: 'publication-artifacts' as never, required: true, index: true, admin: { readOnly: true } },
    { name: 'artifactHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'exportHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'status', type: 'select', required: true, options: ['blocked', 'ready_with_warnings', 'ready'], admin: { readOnly: true } },
    { name: 'issueCount', type: 'number', required: true, min: 0, admin: { readOnly: true } },
    { name: 'pageCount', type: 'number', required: true, min: 1, max: 100, admin: { readOnly: true } },
    { name: 'checkedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'report', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'preflightHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
