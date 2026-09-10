import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { startMediaHTTPFixture, type MediaHTTPFixture, type MediaHTTPReopenSettings } from './media/http-fixture'
import { editorialDatabaseConfig } from './recovery/postgres-runtime.mjs'
vi.mock('server-only', () => ({}))

let fixture: MediaHTTPFixture | undefined
afterAll(async () => { await fixture?.close() })

it.skipIf(process.env.OWNER_INTEGRATION_ENGINE !== 'postgres')('upgrades pre-pin PostgreSQL pages without rewriting their content or versions', async () => {
  const selected = await editorialDatabaseConfig(process.env, { cache: fileURLToPath(new URL('../node_modules/.cache', import.meta.url)) })
  if (selected.engine !== 'postgres') throw new Error('Isolated PostgreSQL required')
  const root = path.join(process.env.OWNER_INTEGRATION_DIRECTORY!, `schema-${randomUUID()}`)
  const settings: MediaHTTPReopenSettings = {
    root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'scratch'),
    credentials: { email: 'schema@example.invalid', password: randomUUID() + randomUUID() },
    secret: randomUUID() + randomUUID(), seed: true, database: { engine: 'postgres', pool: selected.pool }, fullOwnerConfig: true, schemaName: 'restored_media_schema_fixture',
    transformOwnerCollection: collection => collection.slug !== 'pages' ? collection : {
      ...collection,
      fields: collection.fields.filter(field => !('name' in field) || !['restoredMediaSnapshot', 'useCurrentMedia'].includes(field.name)),
      hooks: { ...collection.hooks, beforeChange: [] },
    },
  }
  fixture = await startMediaHTTPFixture(settings)
  const bytes = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#335577' } }).png().toBuffer()
  const upload = new FormData()
  upload.set('_payload', JSON.stringify({ alt: 'Schema preservation QA' }))
  upload.set('file', new File([new Uint8Array(bytes)], 'schema.png', { type: 'image/png' }))
  const uploaded = await fixture.request('/api/media', { method: 'POST', body: upload })
  expect(uploaded.status).toBe(201)
  const media = (await uploaded.json()).doc
  const response = await fixture.request('/api/pages?draft=true', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Before schema upgrade', slug: 'schema-upgrade', layout: [{ blockType: 'hero', heading: 'Preserve this text', image: media.id }] }) })
  expect(response.status).toBe(201)
  const page = (await response.json()).doc
  const versions = await fixture.payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })
  // Obtain a dedicated connection from the isolated adapter, not environment URLs.
  const pool = (fixture.payload.db as unknown as { pool: { connect(): Promise<{ query(sql: string): Promise<{ rows: Record<string, unknown>[] }>; release(): void }> } }).pool
  const client = await pool.connect()
  try {
    await client.query('SET search_path TO "restored_media_schema_fixture"')
    const before = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='restored_media_schema_fixture' AND table_name='pages'")
    expect(before.rows.some(row => row.column_name === 'restored_media_snapshot_id')).toBe(false)
    const migration = await readFile(new URL('../database/migrations/20260910-restored-page-media.sql', import.meta.url), 'utf8')
    // Fail after the first ALTER; the transaction must not leave half an upgrade.
    await client.query('ALTER TABLE "_pages_v" RENAME TO "_pages_v_unavailable"')
    await expect(client.query(migration)).rejects.toMatchObject({ code: '42P01' })
    await client.query('ROLLBACK')
    const failed = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='restored_media_schema_fixture' AND table_name='pages'")
    expect(failed.rows.some(row => row.column_name === 'restored_media_snapshot_id')).toBe(false)
    await client.query('ALTER TABLE "_pages_v_unavailable" RENAME TO "_pages_v"')
    await client.query(migration)
    const after = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='restored_media_schema_fixture' AND table_name='pages'")
    expect(after.rows.some(row => row.column_name === 'restored_media_snapshot_id')).toBe(true)
    await expect(client.query('UPDATE "pages" SET "restored_media_snapshot_id" = -1')).rejects.toMatchObject({ code: '23503' })
    await expect(client.query('UPDATE "_pages_v" SET "version_restored_media_snapshot_id" = -1')).rejects.toMatchObject({ code: '23503' })
  } finally { await client.query('ROLLBACK'); client.release() }
  await fixture.close()
  fixture = undefined
  fixture = await startMediaHTTPFixture({ ...settings, seed: false, transformOwnerCollection: undefined })
  const current = await fixture.payload.findByID({ collection: 'pages', id: page.id, draft: true, depth: 0 })
  expect(current.title).toBe(page.title)
  expect(current.layout).toEqual(versions.docs[0].version.layout)
  expect(current.updatedAt).toBe(page.updatedAt)
  expect(current.restoredMediaSnapshot).toBeNull()
  const afterVersions = await fixture.payload.findVersions({ collection: 'pages', where: { parent: { equals: page.id } }, depth: 0 })
  expect(afterVersions.docs.map(({ id, version }) => ({ id, title: version.title, layout: version.layout }))).toEqual(versions.docs.map(({ id, version }) => ({ id, title: version.title, layout: version.layout })))
  expect(Buffer.from(await (await fixture.request(media.url)).arrayBuffer())).toEqual(bytes)
}, 60_000)
