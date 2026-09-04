import { APIError } from 'payload'

import { isOwner } from '../access/owner'
import { hashAnalyticsSnapshot, type AnalyticsSnapshot } from './snapshot'
import { buildAnalyticsSummary } from './summary'

type SummaryPayload = { find(args: Record<string, unknown>): Promise<{ docs: Array<Record<string, unknown>> }> }

export const getOwnerAnalyticsSummary = async ({ payload, req }: { payload: SummaryPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  const result = await payload.find({ collection: 'analytics-snapshots', depth: 0, limit: 2, overrideAccess: false, req, sort: '-periodTo' })
  if (!result.docs.length) throw new APIError('No hay analítica disponible.', 404)
  const snapshots = result.docs.map((doc) => {
    const snapshot = doc.snapshot as AnalyticsSnapshot
    let hash: string
    try { hash = hashAnalyticsSnapshot(snapshot) } catch { throw new APIError('El snapshot analítico no supera la verificación de integridad.', 409) }
    if (doc.snapshotHash !== hash) throw new APIError('El hash almacenado del snapshot analítico no coincide.', 409)
    return snapshot
  })
  return buildAnalyticsSummary(snapshots[0], snapshots[1])
}
