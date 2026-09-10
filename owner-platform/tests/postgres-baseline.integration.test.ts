import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig, getPayload, type Payload } from 'payload'
import { Pool } from 'pg'
import { expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
vi.mock('server-only', () => ({}))
import { createOwnerConfig } from '../src/payload.config'

it.skipIf(process.env.OWNER_INTEGRATION_ENGINE !== 'postgres')('installs the active CMS using migrations, preserves edits on repeat, and records its applied baseline', async () => {
  const selected = await editorialDatabaseConfig(process.env, { cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)) })
  if (selected.engine !== 'postgres') throw new Error('Isolated PostgreSQL required')
  const database = `baseline_${randomUUID().replaceAll('-', '')}`
  const control = new Pool(selected.pool)
  try { await control.query(`CREATE DATABASE "${database}"`) } finally { await control.end() }
  const root = path.join(process.env.OWNER_INTEGRATION_DIRECTORY!, database)
  await mkdir(root)
  const migrationDir = fileURLToPath(new URL('../database/baseline', import.meta.url))
  const config = createOwnerConfig()
  let payload: Payload | undefined
  let pool: Pool | undefined
  try {
    payload = await getPayload({ key: database, config: await buildConfig({
      ...config,
      typescript: { ...config.typescript, autoGenerate: false },
      collections: config.collections?.map(collection => collection.slug !== 'media' ? collection : {
        ...collection, upload: { ...(typeof collection.upload === 'object' ? collection.upload : {}), staticDir: root },
      }),
      db: postgresAdapter({ pool: { ...selected.pool, database }, push: false, disableCreateDatabase: true, migrationDir }),
    }) })
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
    expect(applied.docs).toHaveLength(1)
    expect(applied.docs[0].batch).toBe(1)
    await payload.db.migrate({ migrations })
    expect(await payload.find({ collection: 'payload-migrations', limit: 100 })).toEqual(applied)
    expect(await payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })).toEqual(saved)
    expect(await payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })).toEqual(versions)
    expect(await readFile(path.join(root, media.filename!))).toEqual(image)
  } finally {
    await payload?.destroy()
    // The adapter retains a checked-out reconnect client. The existing isolated
    // controller waits for Vitest exit, verifies sessions, then stops the cluster.
  }
}, 60_000)
