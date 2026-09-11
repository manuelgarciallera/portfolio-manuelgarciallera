import { postgresAdapter, sql, type PostgresAdapterArgs } from '@payloadcms/db-postgres'
import { check, index, integer, pgSchema, pgTable, text, timestamp, type PgTableFn } from '@payloadcms/db-postgres/drizzle/pg-core'
import { recoveryAdmissionDDL } from './recovery-admission'

// Candidate adapter until migration and HTTP acceptance gates are complete.
// Internal SQL table only: no Payload collection or owner-editable REST resource.
export const recoveryPostgresAdapter = (args: PostgresAdapterArgs) => {
  recoveryAdmissionDDL(args.schemaName ?? 'public') // Same identifier contract as admission.
  const connectionTimeoutMillis = args.pool.connectionTimeoutMillis ?? 5000
  if (!Number.isInteger(connectionTimeoutMillis) || connectionTimeoutMillis < 1 || connectionTimeoutMillis > 10_000) {
    throw new Error('Recovery connection timeout must be between 1 and 10000 milliseconds')
  }
  const createTable: PgTableFn<string | undefined> = args.schemaName ? pgSchema(args.schemaName).table : pgTable
  return postgresAdapter({
    ...args,
    pool: { ...args.pool, connectionTimeoutMillis },
    afterSchemaInit: [...(args.afterSchemaInit ?? []), ({ schema }) => {
      if (schema.tables.owner_recovery_admissions) throw new Error('Recovery admission table registration conflict')
      const table = createTable('owner_recovery_admissions', {
        key: text('key').primaryKey(),
        attempts: integer('attempts').notNull(),
        window_started_at: timestamp('window_started_at', { withTimezone: true }).notNull(),
        last_admitted_at: timestamp('last_admitted_at', { withTimezone: true }).notNull(),
        expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
      }, table => [
        check('owner_recovery_admissions_key_check', sql`${table.key} = 'global' OR ${table.key} ~ '^r:[a-f0-9]{64}$'`),
        check('owner_recovery_admissions_attempts_check', sql`${table.attempts} BETWEEN 1 AND 30`),
        index('owner_recovery_admissions_expiry_idx').on(table.expires_at),
      ])
      return { ...schema, tables: { ...schema.tables, owner_recovery_admissions: table } }
    }],
  })
}
