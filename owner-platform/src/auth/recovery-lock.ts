import { createHash } from 'node:crypto'
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { APIError, type PayloadRequest } from 'payload'

// Payload starts the reset transaction before beforeOperation. Serialize token
// consumption across processes, not just requests inside one Node instance.
export const lockRecoveryToken = async (req: PayloadRequest, token: unknown): Promise<void> => {
  if (req.payload.db.name === 'sqlite') return // Local adapter; not a distributed guarantee.
  if (req.payload.db.name !== 'postgres') throw new APIError('Recovery temporarily unavailable.', 503)
  if (typeof token !== 'string' || !token) throw new APIError('Token is either invalid or has expired.', 403)
  const transactionID = await req.transactionID
  const adapter = req.payload.db as unknown as PostgresAdapter
  const transaction = transactionID == null ? undefined : adapter.sessions?.[transactionID]?.db
  if (!transaction) throw new APIError('Recovery temporarily unavailable.', 503)
  // Domain separation reduces accidental overlap, not mathematical hash64
  // collisions. A denied lock can mean contention OR a collision, not abuse.
  // Preserve this key across mixed-version processes; changing it needs a
  // coordinated migration or old/new processes could consume the same token.
  const key = createHash('sha256').update('owner-password-reset\0').update(token).digest().readBigInt64BE().toString()
  // Never fall back to the connection pool: a transaction-scoped lock on another
  // connection would be released before the native reset reads the token.
  const result = await transaction.execute(sql`select pg_try_advisory_xact_lock(${key}::bigint) as acquired`)
  if (result.rows[0]?.acquired !== true) {
    // Debug only; never attach token, hash, account identity or raw SQL results.
    req.payload.logger.debug({
      event: 'owner.auth.recovery.lock_not_acquired',
      reason: result.rows[0]?.acquired === false ? 'contention_or_collision' : 'unexpected_result',
    }, 'Owner recovery lock not acquired')
    throw new APIError('Token is either invalid or has expired.', 403)
  }
}
