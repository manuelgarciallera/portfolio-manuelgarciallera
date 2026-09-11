import { randomUUID } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig, getPayload, type Payload } from 'payload'
import type { MigrateDownArgs, MigrateUpArgs, PostgresAdapter } from '@payloadcms/db-postgres'
import { Pool } from 'pg'
import { expect, it, vi } from 'vitest'
import { recoveryPostgresAdapter } from '../src/auth/recovery-postgres'
import { createRecoveryAdmissionStore } from '../src/auth/recovery-admission'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
import { migrations as beforeMigrations } from '../database/object-storage'
import { migrations as afterMigrations } from '../database/recovery-admission'
vi.mock('server-only', () => ({}))
import { createOwnerConfig } from '../src/payload.config'
import { configureMediaStorage } from '../src/config/media-storage'

const nativeMigrations = (migrations: typeof afterMigrations) => migrations.map(migration => ({ name: migration.name,
  up: (args: unknown) => migration.up(args as MigrateUpArgs), down: (args: unknown) => migration.down(args as MigrateDownArgs),
}))

it.skipIf(process.env.OWNER_INTEGRATION_ENGINE !== 'postgres')('adds admission to an existing owner database without rewriting content or migration history', async () => {
  const selected = await editorialDatabaseConfig(process.env, { cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)) })
  if (selected.engine !== 'postgres') throw new Error('Isolated PostgreSQL required')
  const database = `admission_${randomUUID().replaceAll('-', '')}`
  const control = new Pool(selected.pool)
  try { await control.query(`CREATE DATABASE "${database}"`) } finally { await control.end() }
  const scratch = path.join(process.env.OWNER_INTEGRATION_DIRECTORY!, database)
  await mkdir(scratch)
  const secret = randomUUID() + randomUUID()
  const migrationDir = fileURLToPath(new URL('../database/recovery-admission', import.meta.url))
  const open = async () => {
    // Payload sanitization mutates nested raw configuration. Rebuild it for each
    // instance so reopening tests the application factory, not an invalid reuse.
    const config = await configureMediaStorage(createOwnerConfig(), { NODE_ENV: 'test', OWNER_MEDIA_MODE: 'objects',
    OWNER_MEDIA_ENDPOINT: 'http://127.0.0.1:1', OWNER_MEDIA_REGION: 'auto', OWNER_MEDIA_BUCKET: 'test-bucket',
    OWNER_MEDIA_PREFIX: 'cms-media', OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic-key', OWNER_MEDIA_SECRET_ACCESS_KEY: 'synthetic-secret',
    OWNER_MEDIA_SCRATCH_DIR: scratch, OWNER_SERVER_URL: 'http://127.0.0.1:12346' })
    return getPayload({ key: randomUUID(), config: buildConfig({ ...config, secret, telemetry: false,
    typescript: { ...config.typescript, autoGenerate: false },
    db: recoveryPostgresAdapter({ pool: { ...selected.pool, database }, push: false, disableCreateDatabase: true, migrationDir }),
    }) })
  }
  let payload: Payload | undefined
  try {
    payload = await open()
    await payload.db.migrate({ migrations: nativeMigrations(beforeMigrations) })
    const pool = (payload.db as unknown as PostgresAdapter).pool
    const limiter = createRecoveryAdmissionStore({ pool, secret, schemaName: 'public' })
    await expect(limiter.admit('owner@example.invalid')).rejects.toThrow('Recovery admission unavailable')
    const owner = await payload.create({ collection: 'users', data: { role: 'owner', email: 'upgrade@example.invalid', password: randomUUID() + randomUUID() } })
    const page = await payload.create({ collection: 'pages', user: owner, overrideAccess: false, draft: true, depth: 0,
      data: { title: 'Before security migration', slug: 'before-security', layout: [{ blockType: 'hero', heading: 'Keep this design' }] } })
    const saved = await payload.update({ collection: 'pages', id: page.id, user: owner, overrideAccess: false, draft: true, depth: 0,
      data: { title: 'Edited before security migration' } })
    const versions = await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })
    const previousLedger = await payload.find({ collection: 'payload-migrations', sort: 'id', limit: 100 })
    expect(previousLedger.docs).toHaveLength(2)

    await payload.db.migrate({ migrations: nativeMigrations(afterMigrations) })
    const ledger = await payload.find({ collection: 'payload-migrations', sort: 'id', limit: 100 })
    expect(ledger.docs).toHaveLength(3)
    expect(ledger.docs.slice(0, 2)).toEqual(previousLedger.docs)
    expect(ledger.docs[2]).toMatchObject({ name: '20260911_062311_recovery_admission', batch: 2 })
    expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
    expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
    expect(await limiter.admit('owner@example.invalid')).toBe(true)
    expect(await limiter.admit('owner@example.invalid')).toBe(false)

    const schema = payload.db as unknown as { schema: unknown; requireDrizzleKit(): {
      generateDrizzleJson(schema: unknown): Promise<unknown>; generateMigration(before: unknown, after: unknown): Promise<string[]>;
    } }
    const kit = schema.requireDrizzleKit()
    const snapshot = JSON.parse(await readFile(path.join(migrationDir, '20260911_062311_recovery_admission.json'), 'utf8'))
    expect(await kit.generateMigration(snapshot, await kit.generateDrizzleJson(schema.schema))).toEqual([])
    await payload.db.migrate({ migrations: nativeMigrations(afterMigrations) })
    expect(await payload.find({ collection: 'payload-migrations', sort: 'id', limit: 100 })).toEqual(ledger)
    await payload.destroy()
    payload = undefined
    payload = await open()
    const reopened = createRecoveryAdmissionStore({ pool: (payload.db as unknown as PostgresAdapter).pool, secret, schemaName: 'public' })
    expect(await reopened.admit('owner@example.invalid')).toBe(false)
    expect(await payload.find({ collection: 'payload-migrations', sort: 'id', limit: 100 })).toEqual(ledger)
    expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
    expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
    expect(payload.collections).not.toHaveProperty('owner_recovery_admissions')
  } finally { await payload?.destroy() }
}, 60_000)
