import { createHash, createHmac } from 'node:crypto'
import type { PostgresAdapter } from '@payloadcms/db-postgres'

const tableName = (schemaName: string) => {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schemaName)) throw new Error('Invalid recovery admission schema')
  return `"${schemaName}"."owner_recovery_admissions"`
}

// Explicit installation only. The admission path never creates its own schema.
// Candidate until schema registration, migration and HTTP acceptance are proved.
export const recoveryAdmissionDDL = (schemaName: string): string => {
  const table = tableName(schemaName)
  return `CREATE TABLE ${table} (
    key text PRIMARY KEY CHECK (key = 'global' OR key ~ '^r:[a-f0-9]{64}$'),
    attempts integer NOT NULL CHECK (attempts BETWEEN 1 AND 30),
    window_started_at timestamptz NOT NULL,
    last_admitted_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL
  );
  CREATE INDEX owner_recovery_admissions_expiry_idx ON ${table} (expires_at);`
}

type Options = { pool: PostgresAdapter['pool']; secret: string; schemaName: string }

// Caller must configure bounded pool acquisition. This transaction is separate
// from token creation: a provider failure must not roll back spent mail budget.
export const createRecoveryAdmissionStore = ({ pool, secret, schemaName }: Options): { admit(email: string): Promise<boolean> } => {
  const table = tableName(schemaName)
  if (secret.length < 32) throw new Error('Recovery admission secret must contain at least 32 characters')
  const lockKey = createHash('sha256').update(`owner-recovery-admission-v1\0${schemaName}`).digest().readBigInt64BE().toString()
  const connect = () => pool.connect() // Select the promise overload, not the callback overload.

  return {
    async admit(email) {
      const normalized = email.trim().toLowerCase()
      if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Invalid recovery email')
      const key = 'r:' + createHmac('sha256', secret).update('owner-recovery-admission-v1\0').update(normalized).digest('hex')
      let client: Awaited<ReturnType<typeof connect>> | undefined
      let broken = false
      try {
        client = await connect()
        await client.query('BEGIN')
        await client.query("SET LOCAL statement_timeout = '2000ms'")
        await client.query("SET LOCAL lock_timeout = '100ms'")
        const locked = await client.query('SELECT pg_try_advisory_xact_lock($1::bigint) AS acquired', [lockKey])
        if (locked.rows[0]?.acquired !== true) {
          if (locked.rows[0]?.acquired !== false) throw new Error('Unexpected admission lock result')
          await client.query('COMMIT')
          return false
        }
        const clock = await client.query('SELECT clock_timestamp()::text AS now')
        const now: unknown = clock.rows[0]?.now
        if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) throw new Error('Invalid database clock')
        const global = await client.query(`INSERT INTO ${table} AS budget
          (key, attempts, window_started_at, last_admitted_at, expires_at)
          VALUES ('global', 1, $1, $1, $1::timestamptz + interval '3600 seconds')
          ON CONFLICT (key) DO UPDATE SET
            attempts = CASE WHEN budget.window_started_at <= $1::timestamptz - interval '60 seconds' THEN 1 ELSE budget.attempts + 1 END,
            window_started_at = CASE WHEN budget.window_started_at <= $1::timestamptz - interval '60 seconds' THEN $1::timestamptz ELSE budget.window_started_at END,
            last_admitted_at = $1, expires_at = $1::timestamptz + interval '3600 seconds'
          WHERE budget.window_started_at <= $1::timestamptz - interval '60 seconds' OR budget.attempts < 30
          RETURNING key`, [now])
        if (global.rowCount === 0) {
          await client.query('COMMIT')
          return false
        }
        if (global.rowCount !== 1 || global.rows[0]?.key !== 'global') throw new Error('Unexpected global admission result')

        // Global admission precedes allocation and cleanup: arbitrary addresses
        // cannot grow the table without spending the bounded global budget.
        await client.query(`DELETE FROM ${table} WHERE key <> 'global' AND expires_at <= $1`, [now])
        const recipient = await client.query(`INSERT INTO ${table} AS budget
          (key, attempts, window_started_at, last_admitted_at, expires_at)
          VALUES ($1, 1, $2, $2, $2::timestamptz + interval '3600 seconds')
          ON CONFLICT (key) DO UPDATE SET
            attempts = CASE WHEN budget.window_started_at <= $2::timestamptz - interval '900 seconds' THEN 1 ELSE budget.attempts + 1 END,
            window_started_at = CASE WHEN budget.window_started_at <= $2::timestamptz - interval '900 seconds' THEN $2::timestamptz ELSE budget.window_started_at END,
            last_admitted_at = $2, expires_at = $2::timestamptz + interval '3600 seconds'
          WHERE budget.last_admitted_at <= $2::timestamptz - interval '60 seconds'
            AND (budget.window_started_at <= $2::timestamptz - interval '900 seconds' OR budget.attempts < 3)
          RETURNING key`, [key, now])
        if (recipient.rowCount !== 0 && (recipient.rowCount !== 1 || recipient.rows[0]?.key !== key)) throw new Error('Unexpected recipient admission result')
        // Commit even a recipient rejection: it has consumed the global budget.
        await client.query('COMMIT')
        return recipient.rowCount === 1
      } catch {
        if (client) {
          try { await client.query('ROLLBACK') } catch { broken = true }
        }
        throw new Error('Recovery admission unavailable')
      } finally {
        client?.release(broken)
      }
    },
  }
}
