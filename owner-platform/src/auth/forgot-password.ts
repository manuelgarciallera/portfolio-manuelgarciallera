import { addDataAndFileToRequest, APIError, type PayloadHandler } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { OwnerEmailDeliveryError } from '../config/email'
import { createRecoveryAdmissionStore, normalizeRecoveryEmail } from './recovery-admission'

// Keep native token validation and transaction rollback. Only the REST receipt
// is neutralized; local callers still receive delivery failures.
export const ownerForgotPassword: PayloadHandler = async req => {
  await addDataAndFileToRequest(req)
  let email: string
  try { email = normalizeRecoveryEmail(req.data?.email) }
  catch { throw new APIError('Invalid recovery email', 400) }
  const receipt = () => Response.json({ message: req.t('general:success') }, {
    headers: { 'Cache-Control': 'no-store' },
  })
  try {
    if (req.payload.db.name === 'postgres') {
      const adapter = req.payload.db as unknown as PostgresAdapter
      const timeout = adapter.poolOptions.connectionTimeoutMillis
      if (!Number.isInteger(timeout) || !timeout || timeout < 1 || timeout > 10_000) throw new Error('Unbounded recovery pool')
      const allowed = await createRecoveryAdmissionStore({ pool: adapter.pool,
        secret: req.payload.config.secret, schemaName: adapter.schemaName ?? 'public' }).admit(email)
      if (!allowed) return receipt()
    } else if (req.payload.db.name !== 'sqlite') throw new Error('Unsupported recovery database')
    // SQLite is development-only; production configuration requires PostgreSQL.
  } catch {
    req.payload.logger.warn({ event: 'owner.auth.recovery.admission_unavailable' }, 'Owner recovery admission unavailable')
    return Response.json({ errors: [{ message: 'Recovery temporarily unavailable.' }] }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    })
  }
  try {
    await req.payload.forgotPassword({
      collection: 'users',
      overrideAccess: false,
      data: { email },
      req,
    })
  } catch (error) {
    if (!(error instanceof OwnerEmailDeliveryError)) throw error
    req.payload.logger.warn({ event: 'owner.auth.recovery.delivery_failed' }, 'Owner recovery delivery unavailable')
  }
  return receipt()
}
