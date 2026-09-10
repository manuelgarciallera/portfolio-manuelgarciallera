import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { postgresAdapter, type MigrateUpArgs, type MigrateDownArgs } from '@payloadcms/db-postgres'
import { buildConfig, getPayload, type Payload } from 'payload'
import { Pool } from 'pg'
import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
vi.mock('server-only', () => ({}))
import { createOwnerConfig } from '../src/payload.config'
import { configureMediaStorage } from '../src/config/media-storage'
import { startObjectProviderFixture } from './media/object-provider-fixture'

it.skipIf(process.env.OWNER_INTEGRATION_ENGINE !== 'postgres').each(['legacy', 'objects'] as const)('installs %s CMS using migrations and preserves edits on repeat', async mode => {
  const selected = await editorialDatabaseConfig(process.env, { cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)) })
  if (selected.engine !== 'postgres') throw new Error('Isolated PostgreSQL required')
  const database = `baseline_${randomUUID().replaceAll('-', '')}`
  const control = new Pool(selected.pool)
  try { await control.query(`CREATE DATABASE "${database}"`) } finally { await control.end() }
  const root = path.join(process.env.OWNER_INTEGRATION_DIRECTORY!, database)
  await mkdir(root)
  const migrationDir = fileURLToPath(new URL(`../database/${mode === 'objects' ? 'object-storage' : 'baseline'}`, import.meta.url))
  const provider = mode === 'objects' ? await startObjectProviderFixture() : undefined
  let payload: Payload | undefined
  let pool: Pool | undefined
  const openInstance = async () => {
    let config = createOwnerConfig()
    if (provider) config = await configureMediaStorage(config, { ...provider.environment, OWNER_MEDIA_SCRATCH_DIR: root, OWNER_SERVER_URL: 'http://127.0.0.1:12346' })
    return getPayload({ key: `${database}-${randomUUID()}`, config: await buildConfig({
      ...config,
      typescript: { ...config.typescript, autoGenerate: false },
      collections: config.collections?.map(collection => collection.slug !== 'media' ? collection : {
        ...collection, upload: { ...(typeof collection.upload === 'object' ? collection.upload : {}), staticDir: root },
      }),
      db: postgresAdapter({ pool: { ...selected.pool, database }, push: false, disableCreateDatabase: true, migrationDir }),
    }) })
  }
  try {
    payload = await openInstance()
    pool = (payload.db as unknown as { pool: Pool }).pool
    let files: string[] = []
    try { files = await readdir(migrationDir) } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    const migrations = files.includes('index.ts') ? (await import(pathToFileURL(path.join(migrationDir, 'index.ts')).href)).migrations : []
    await payload.db.migrate({ migrations })
    expect((await pool.query("SELECT to_regclass('public.pages') AS table_name")).rows[0].table_name).toBe('pages')
    const snapshot = JSON.parse(await readFile(path.join(migrationDir, files.find(file => file.endsWith('.json'))!), 'utf8')) as {
      tables: Record<string, { name: string; columns: Record<string, { name: string }> }>
    }
    const expectedColumns = Object.values(snapshot.tables).flatMap(table => Object.values(table.columns).map(column => `${table.name}.${column.name}`)).sort()
    const actualColumns = (await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'")).rows.map(row => `${row.table_name}.${row.column_name}`).sort()
    expect(actualColumns).toEqual(expectedColumns)
    const schemaAdapter = payload.db as unknown as { schema: unknown; requireDrizzleKit(): {
      generateDrizzleJson(schema: unknown): Promise<unknown>;
      generateMigration(before: unknown, after: unknown): Promise<string[]>;
    } }
    const kit = schemaAdapter.requireDrizzleKit()
    // A future schema change must ship a migration, even if this CRUD example
    // does not touch the new collection/field.
    expect(await kit.generateMigration(snapshot, await kit.generateDrizzleJson(schemaAdapter.schema))).toEqual([])
    const owner = await payload.create({ collection: 'users', data: { email: 'baseline@example.invalid', password: randomUUID() + randomUUID(), role: 'owner' } })
    const image = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#335577' } }).png().toBuffer()
    const media = await payload.create({ collection: 'media', user: owner, overrideAccess: false,
      file: { data: image, mimetype: 'image/png', name: 'baseline.png', size: image.length }, data: { alt: 'Baseline QA' } })
    const page = await payload.create({ collection: 'pages', user: owner, overrideAccess: false, draft: true,
      data: { title: 'Installed from migration', slug: 'baseline-qa', layout: [{ blockType: 'hero', heading: 'Preserved', image: media.id }] } })
    const saved = await payload.update({ collection: 'pages', id: page.id, user: owner, overrideAccess: false, draft: true, depth: 0, data: { title: 'Edited after installation' } })
    const versions = await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })
    const applied = await payload.find({ collection: 'payload-migrations', limit: 100 })
    const savedMedia = await payload.findByID({ collection: 'media', id: media.id, depth: 0 })
    expect(applied.docs).toHaveLength(mode === 'objects' ? 2 : 1)
    expect(applied.docs[0].batch).toBe(1)
    await payload.db.migrate({ migrations })
    expect(await payload.find({ collection: 'payload-migrations', limit: 100 })).toEqual(applied)
    expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
    expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
    expect(await payload.findByID({ collection: 'media', id: media.id, depth: 0 })).toEqual(savedMedia)
    // Reopen with a fresh Payload instance, adapter and assembled configuration.
    // This is not a process restart or a provider durability claim.
    const previous = payload
    await previous.destroy()
    payload = undefined
    payload = await openInstance()
    expect(payload).not.toBe(previous)
    expect(payload.db).not.toBe(previous.db)
    pool = (payload.db as unknown as { pool: Pool }).pool
    expect(await payload.find({ collection: 'payload-migrations', limit: 100 })).toEqual(applied)
    expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
    expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
    expect(await payload.findByID({ collection: 'media', id: media.id, depth: 0 })).toEqual(savedMedia)
    await payload.db.migrate({ migrations })
    expect(await payload.find({ collection: 'payload-migrations', limit: 100 })).toEqual(applied)
    if (provider) {
      const revision = (media as unknown as { storageRevision: string }).storageRevision
      expect((await provider.storage.read(revision)).find(file => file.name === media.filename)?.bytes).toEqual(image)
      expect(await readdir(root)).toEqual([])
    } else {
      expect(await readFile(path.join(root, media.filename!))).toEqual(image)
      const beforeMedia = (await pool.query('SELECT * FROM media ORDER BY id')).rows
      const beforeHistory = (await pool.query('SELECT * FROM _media_v ORDER BY id')).rows
      const filenames = (await readdir(root)).sort()
      const beforeFiles = await Promise.all(filenames.map(name => readFile(path.join(root, name))))
      expect(beforeMedia.length).toBeGreaterThan(0)
      expect(beforeHistory.length).toBeGreaterThan(0)
      // Upgrade an already populated legacy installation without enabling objects.
      // No backfill is fabricated: old records must keep a null revision until
      // their physical files and historical references have been migrated.
      const catalog = await import('../database/object-storage')
      // Payload's cross-adapter interface types migration arguments as unknown;
      // this fixture explicitly installs the PostgreSQL adapter above.
      const upgrade = catalog.migrations.map(migration => ({ name: migration.name,
        up: (args: unknown) => migration.up(args as MigrateUpArgs),
        down: (args: unknown) => migration.down(args as MigrateDownArgs),
      }))
      await payload.db.migrate({ migrations: upgrade })
      const upgradedLedger = await payload.find({ collection: 'payload-migrations', limit: 100 })
      expect(upgradedLedger.docs).toHaveLength(2)
      expect(upgradedLedger.docs.find(row => row.name === '20260910_133129_object_storage')?.batch).toBe(2)
      expect(upgradedLedger.docs.find(row => row.id === applied.docs[0].id)).toEqual(applied.docs[0])
      expect((await pool.query('SELECT storage_revision FROM media')).rows.every(row => row.storage_revision === null)).toBe(true)
      expect((await pool.query('SELECT version_storage_revision FROM _media_v')).rows.every(row => row.version_storage_revision === null)).toBe(true)
      const without = (rows: Record<string, unknown>[], key: string) => rows.map(row => { const copy = { ...row }; delete copy[key]; return copy })
      expect(without((await pool.query('SELECT * FROM media ORDER BY id')).rows, 'storage_revision')).toEqual(beforeMedia)
      expect(without((await pool.query('SELECT * FROM _media_v ORDER BY id')).rows, 'version_storage_revision')).toEqual(beforeHistory)
      await payload.db.migrate({ migrations: upgrade })
      expect(await payload.find({ collection: 'payload-migrations', limit: 100 })).toEqual(upgradedLedger)
      expect(await payload.findByID({ collection: 'media', id: media.id, depth: 0 })).toEqual(savedMedia)
      expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
      expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
      expect((await readdir(root)).sort()).toEqual(filenames)
      expect(await Promise.all(filenames.map(name => readFile(path.join(root, name))))).toEqual(beforeFiles)
    }
  } finally {
    try { await payload?.destroy() } finally { await provider?.close() }
    // The adapter retains a checked-out reconnect client. The existing isolated
    // controller waits for Vitest exit, verifies sessions, then stops the cluster.
  }
}, 60_000)
