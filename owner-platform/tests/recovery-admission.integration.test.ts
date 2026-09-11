import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRecoveryAdmissionStore, recoveryAdmissionDDL } from '../src/auth/recovery-admission'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
import { startMediaHTTPFixture, type MediaHTTPFixture } from './media/http-fixture'

vi.mock('server-only', () => ({}))

describe.skipIf(process.env.OWNER_INTEGRATION_ENGINE !== 'postgres')('shared PostgreSQL recovery admission candidate', () => {
  let fixture: MediaHTTPFixture
  let pool: PostgresAdapter['pool']
  let secondPool: PostgresAdapter['pool']
  const secret = randomUUID() + randomUUID()
  const schemaName = 'recovery_admission_fixture'
  const table = '"recovery_admission_fixture"."owner_recovery_admissions"'
  const store = () => createRecoveryAdmissionStore({ pool, secret, schemaName })

  beforeAll(async () => {
    const directory = process.env.OWNER_INTEGRATION_DIRECTORY
    if (!directory || !path.isAbsolute(directory)) throw new Error('Explicit QA directory required')
    const selected = await editorialDatabaseConfig(process.env, { cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)) })
    if (selected.engine !== 'postgres') throw new Error('Isolated PostgreSQL required')
    const root = path.join(directory, `recovery-admission-${randomUUID()}`)
    fixture = await startMediaHTTPFixture({ root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'uploads'),
      credentials: { email: 'admission-owner@example.invalid', password: randomUUID() + randomUUID() },
      secret, seed: true, database: { engine: 'postgres', pool: selected.pool } })
    const adapter = fixture.payload.db as unknown as PostgresAdapter
    pool = adapter.pool
    secondPool = new adapter.pg.Pool(selected.pool)
    await pool.query(`CREATE SCHEMA "recovery_admission_fixture"`)
    await pool.query(recoveryAdmissionDDL(schemaName))
  }, 60_000)

  beforeEach(async () => { await pool.query(`TRUNCATE TABLE ${table}`) })
  afterAll(async () => { await secondPool?.end(); await fixture?.close() })

  it('admits exactly one concurrent attempt for the same recipient', async () => {
    const limiter = store()
    const results = await Promise.all(Array.from({ length: 20 }, () => limiter.admit('same@example.invalid')))
    expect(results.filter(Boolean)).toHaveLength(1)
    expect((await pool.query(`SELECT attempts FROM ${table} WHERE key LIKE 'r:%'`)).rows).toEqual([{ attempts: 1 }])
  })

  it('shares cooldown across independent pools and recreated stores without storing addresses', async () => {
    expect(await store().admit('Owner@Example.Invalid')).toBe(true)
    const other = createRecoveryAdmissionStore({ pool: secondPool, secret, schemaName })
    expect(await other.admit(' owner@example.invalid ')).toBe(false)
    expect(await store().admit('owner@example.invalid')).toBe(false)
    const keys = (await pool.query(`SELECT key FROM ${table} ORDER BY key`)).rows.map(row => row.key)
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe('global')
    expect(keys[1]).toMatch(/^r:[a-f0-9]{64}$/)
    expect(JSON.stringify(keys)).not.toContain('owner@')
  })

  it('enforces three per recipient window even after successive cooldowns expire', async () => {
    const limiter = store()
    for (let attempt = 0; attempt < 3; attempt++) {
      await pool.query(`UPDATE ${table} SET last_admitted_at = clock_timestamp() - interval '61 seconds' WHERE key LIKE 'r:%'`)
      expect(await limiter.admit('limited@example.invalid')).toBe(true)
    }
    await pool.query(`UPDATE ${table} SET last_admitted_at = clock_timestamp() - interval '61 seconds' WHERE key LIKE 'r:%'`)
    expect(await limiter.admit('limited@example.invalid')).toBe(false)
    await pool.query(`UPDATE ${table} SET window_started_at = clock_timestamp() - interval '901 seconds' WHERE key LIKE 'r:%'`)
    expect(await limiter.admit('limited@example.invalid')).toBe(true)
  })

  it('bounds global allocations and reopens an expired global window', async () => {
    const limiter = store()
    for (let index = 0; index < 30; index++) expect(await limiter.admit(`recipient-${index}@example.invalid`)).toBe(true)
    expect(await limiter.admit('overflow@example.invalid')).toBe(false)
    expect((await pool.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count).toBe(31)
    await pool.query(`UPDATE ${table} SET window_started_at = clock_timestamp() - interval '61 seconds' WHERE key = 'global'`)
    expect(await limiter.admit('overflow@example.invalid')).toBe(true)
  })

  it('counts recipient-denied requests against the global budget', async () => {
    expect(await store().admit('repeat@example.invalid')).toBe(true)
    for (let index = 1; index < 30; index++) expect(await store().admit('repeat@example.invalid')).toBe(false)
    expect(await store().admit('different@example.invalid')).toBe(false)
    expect((await pool.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count).toBe(2)
  })

  it('removes expired pseudonymous rows on admission using database time', async () => {
    expect(await store().admit('expired@example.invalid')).toBe(true)
    await pool.query(`UPDATE ${table} SET expires_at = clock_timestamp() - interval '1 second' WHERE key LIKE 'r:%'`)
    expect(await store().admit('fresh@example.invalid')).toBe(true)
    const rows = (await pool.query(`SELECT key, extract(epoch from (expires_at - clock_timestamp())) AS remaining FROM ${table} WHERE key LIKE 'r:%'`)).rows
    expect(rows).toHaveLength(1)
    expect(Number(rows[0].remaining)).toBeGreaterThan(3590)
    expect(Number(rows[0].remaining)).toBeLessThanOrEqual(3600)
  })

  it('fails closed when its table is unavailable, without poisoning the connection', async () => {
    await pool.query(`ALTER TABLE ${table} RENAME TO unavailable_admissions`)
    try { await expect(store().admit('failure@example.invalid')).rejects.toThrow('Recovery admission unavailable') }
    finally { await pool.query('ALTER TABLE "recovery_admission_fixture"."unavailable_admissions" RENAME TO owner_recovery_admissions') }
    expect(await store().admit('failure@example.invalid')).toBe(true)
  })

  it('rolls back a global increment if the recipient write fails afterwards', async () => {
    await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT reject_recipient_fixture CHECK (key = 'global')`)
    try {
      await expect(store().admit('write-failure@example.invalid')).rejects.toThrow('Recovery admission unavailable')
      expect((await pool.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count).toBe(0)
    } finally { await pool.query(`ALTER TABLE ${table} DROP CONSTRAINT reject_recipient_fixture`) }
    expect(await store().admit('write-failure@example.invalid')).toBe(true)
  })

  it('rejects a held cross-pool lock without spending budget, then succeeds after release', async () => {
    const client = await secondPool.connect()
    const key = createHash('sha256').update(`owner-recovery-admission-v1\0${schemaName}`).digest().readBigInt64BE().toString()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [key])
      expect(await store().admit('locked@example.invalid')).toBe(false)
      expect((await pool.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count).toBe(0)
    } finally { await client.query('ROLLBACK'); client.release() }
    expect(await store().admit('locked@example.invalid')).toBe(true)
  })
})
