import { randomUUID } from 'node:crypto'
import { buildConfig, getPayload } from 'payload'
import { getTableConfig } from '@payloadcms/db-postgres/drizzle/pg-core'
import { expect, it } from 'vitest'
import { recoveryPostgresAdapter } from './recovery-postgres'

it.each([undefined, 'isolated_owner'])('registers private admission schema offline for %s', async schemaName => {
  const observed: string[] = []
  const payload = await getPayload({ key: randomUUID(), disableDBConnect: true,
    config: await buildConfig({ secret: randomUUID() + randomUUID(), telemetry: false,
      typescript: { autoGenerate: false }, collections: [],
      db: recoveryPostgresAdapter({ pool: { host: '127.0.0.1', port: 1 }, schemaName,
        afterSchemaInit: [({ schema }) => { observed.push('existing'); return schema }] }),
    }) })
  try {
    expect(payload.db.pool).toBeUndefined()
    expect(payload.db.poolOptions.connectionTimeoutMillis).toBe(5000)
    expect(observed).toEqual(['existing'])
    expect(payload.collections).not.toHaveProperty('owner_recovery_admissions')
    const table = getTableConfig(payload.db.tables.owner_recovery_admissions)
    expect(table.schema).toBe(schemaName)
    expect(table.columns.map(column => column.name)).toEqual(['key', 'attempts', 'window_started_at', 'last_admitted_at', 'expires_at'])
    expect(table.checks).toHaveLength(2)
    expect(table.indexes).toHaveLength(1)
  } finally { await payload.destroy() }
})

it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 20_000])('rejects unbounded or invalid acquisition timeout %s', connectionTimeoutMillis => {
  expect(() => recoveryPostgresAdapter({ pool: { connectionTimeoutMillis } })).toThrow('Recovery connection timeout')
})

it('rejects a schema name that the store cannot address safely', () => {
  expect(() => recoveryPostgresAdapter({ pool: {}, schemaName: 'invalid.schema' })).toThrow('Invalid recovery admission schema')
})
