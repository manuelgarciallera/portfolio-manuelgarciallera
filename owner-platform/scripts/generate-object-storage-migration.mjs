import { randomBytes, randomUUID } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// One-time offline generation. Never executes a migration or contacts a provider.
const target = fileURLToPath(new URL('../database/object-storage', import.meta.url))
let existing = []
try { existing = await readdir(target) } catch (error) { if (error.code !== 'ENOENT') throw error }
if (existing.length) throw new Error('Object migration catalog already exists; do not rewrite history.')
const cache = fileURLToPath(new URL('../node_modules/.cache/', import.meta.url))
await mkdir(cache, { recursive: true })
const temporary = await mkdtemp(path.join(cache, 'object-schema-generation-'))
const migrationDir = path.join(temporary, 'migrations')
const scratch = path.join(temporary, 'scratch')
await mkdir(migrationDir)
await mkdir(scratch)
await copyFile(new URL('../database/baseline/20260910_123524_owner_baseline.json', import.meta.url), path.join(migrationDir, '00000000_baseline.json'))
for (const key of Object.keys(process.env)) if (key.startsWith('OWNER_MEDIA_')) delete process.env[key]
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', PAYLOAD_SECRET: randomBytes(32).toString('hex'),
  OWNER_EMAIL_API_KEY: '', OWNER_EMAIL_FROM: '', OWNER_SERVER_URL: 'http://127.0.0.1:12346', OWNER_PLATFORM_BUILD_PHASE: '', NEXT_PHASE: '' })
let payload
try {
  const { buildConfig, getPayload } = await import('payload')
  const { postgresAdapter } = await import('@payloadcms/db-postgres')
  const { createOwnerConfig } = await import('../src/payload.config.ts')
  const { configureMediaStorage } = await import('../src/config/media-storage.ts')
  const config = await configureMediaStorage(createOwnerConfig(), { NODE_ENV: 'test', OWNER_MEDIA_MODE: 'objects',
    OWNER_MEDIA_ENDPOINT: 'http://127.0.0.1:1', OWNER_MEDIA_REGION: 'auto', OWNER_MEDIA_BUCKET: 'test-bucket',
    OWNER_MEDIA_PREFIX: 'cms-media', OWNER_MEDIA_ACCESS_KEY_ID: 'synthetic-key', OWNER_MEDIA_SECRET_ACCESS_KEY: 'synthetic-secret',
    OWNER_MEDIA_SCRATCH_DIR: scratch, OWNER_SERVER_URL: 'http://127.0.0.1:12346' })
  payload = await getPayload({ key: `offline-object-schema-${randomUUID()}`, disableDBConnect: true,
    config: await buildConfig({ ...config, telemetry: false, typescript: { ...config.typescript, autoGenerate: false },
      db: postgresAdapter({ pool: { host: '127.0.0.1', port: 1, database: 'offline', user: 'offline', password: randomUUID() },
        push: false, disableCreateDatabase: true, migrationDir }) }) })
  if (payload.db.pool) throw new Error('Offline generation unexpectedly acquired a database pool.')
  await payload.db.createMigration({ payload, migrationName: 'object_storage', forceAcceptWarning: true })
  if (payload.db.pool) throw new Error('Offline generation unexpectedly acquired a database pool.')
  await mkdir(target, { recursive: true })
  for (const file of await readdir(migrationDir)) {
    if (file === '00000000_baseline.json') continue
    if (!/^(?:index\.ts|\d{8}_\d{6}_object_storage\.(?:ts|json))$/.test(file)) throw new Error('Unexpected generated artifact.')
    let content = await readFile(path.join(migrationDir, file), 'utf8')
    if (file === 'index.ts') content = "import { migrations as baseline } from '../baseline';\n" + content.replace('export const migrations = [', 'export const migrations = [\n  ...baseline,')
    else if (file.endsWith('.ts')) content = content.replaceAll('{ db, payload, req }', '{ db }').replaceAll('\t', '  ').replace(/[ ]+(?=\r?$)/gm, '')
    await writeFile(path.join(target, file), content, { flag: 'wx' })
  }
  console.log('Generated optional object schema delta offline; baseline history reused, not rewritten.')
} finally {
  await payload?.destroy()
  const relative = path.relative(cache, temporary)
  if (!relative.startsWith('object-schema-generation-') || relative.includes(path.sep) || path.isAbsolute(relative)) throw new Error('Unsafe generation cleanup path.')
  await rm(temporary, { recursive: true, force: true })
}
