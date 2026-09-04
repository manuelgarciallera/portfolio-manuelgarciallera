import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { hashAnalyticsSnapshot, type AnalyticsSnapshot } from '../analytics/snapshot'
import { isOwner, ownerOnly } from '../access/owner'

const immutableError = () => new APIError('Los snapshots analíticos son inmutables.', 403)

export const prepareAnalyticsSnapshot: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const snapshot = data.snapshot as AnalyticsSnapshot
  let snapshotHash: string
  try { snapshotHash = hashAnalyticsSnapshot(snapshot) } catch { throw new APIError('El snapshot analítico no supera la verificación de hash.', 400) }
  if (
    data.snapshotHash !== snapshotHash || data.schemaVersion !== snapshot.schemaVersion || data.source !== snapshot.source ||
    data.capturedAt !== snapshot.capturedAt || data.periodFrom !== snapshot.period.from || data.periodTo !== snapshot.period.to ||
    data.routeCount !== snapshot.routes.length || String(data.createdBy) !== String(req.user.id)
  ) throw new APIError('La procedencia o el recuento de rutas del snapshot no coincide.', 400)
  return data
}

export const enforceAnalyticsSnapshotDelete: CollectionBeforeDeleteHook = async () => { throw immutableError() }

export const AnalyticsSnapshots: CollectionConfig = {
  slug: 'analytics-snapshots',
  admin: { defaultColumns: ['source', 'periodFrom', 'periodTo', 'routeCount', 'capturedAt'], useAsTitle: 'snapshotHash' },
  access: { create: () => false, read: ownerOnly, update: () => false, delete: () => false },
  hooks: { beforeChange: [prepareAnalyticsSnapshot], beforeDelete: [enforceAnalyticsSnapshotDelete] },
  fields: [
    { name: 'source', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'periodFrom', type: 'date', required: true, index: true, admin: { readOnly: true } },
    { name: 'periodTo', type: 'date', required: true, index: true, admin: { readOnly: true } },
    { name: 'capturedAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'routeCount', type: 'number', required: true, min: 0, max: 250, admin: { readOnly: true } },
    { name: 'snapshot', type: 'json', required: true, admin: { readOnly: true } },
    { name: 'snapshotHash', type: 'text', required: true, unique: true, index: true, admin: { readOnly: true } },
    { name: 'schemaVersion', type: 'number', required: true, admin: { readOnly: true } },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true, admin: { readOnly: true } },
  ],
}
