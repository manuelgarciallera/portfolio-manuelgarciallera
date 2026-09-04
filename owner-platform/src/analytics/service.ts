import { APIError } from 'payload'
import { isOwner } from '../access/owner'
import { recordAuditEvent } from '../collections/AuditEvents'
import { createAnalyticsSnapshot } from './snapshot'

type AnalyticsPayload = { create(args: Record<string, unknown>): Promise<Record<string, unknown>> }
export const createOwnerAnalyticsSnapshot = async ({ confirmation, data, now, payload, req }: { confirmation: string; data: unknown; now?: string; payload: AnalyticsPayload; req: { user?: unknown } }) => {
  if (!isOwner(req.user)) throw new APIError('Se requiere una sesión owner.', 403)
  if (confirmation !== 'IMPORTAR ANALÍTICA') throw new APIError('La confirmación no coincide.', 400)
  let snapshot
  try { snapshot = createAnalyticsSnapshot({ ...(data as Record<string, unknown>), capturedAt: now ?? new Date().toISOString() }) } catch (error) { throw new APIError(error instanceof Error ? error.message : 'Los datos analíticos no son válidos.', 400) }
  const created = await payload.create({ collection: 'analytics-snapshots', data: { capturedAt: snapshot.capturedAt, createdBy: req.user.id, periodFrom: snapshot.period.from, periodTo: snapshot.period.to, routeCount: snapshot.routes.length, schemaVersion: snapshot.schemaVersion, snapshot, snapshotHash: snapshot.hash, source: snapshot.source }, overrideAccess: true, req })
  const id = created.id as string | number
  await recordAuditEvent({ input: { action: 'analytics.snapshot.created', metadata: { routeCount: snapshot.routes.length, snapshotHash: snapshot.hash, source: snapshot.source }, outcome: 'success', subject: { collection: 'analytics-snapshots', id } }, payload: payload as never, req, user: req.user })
  return created
}
