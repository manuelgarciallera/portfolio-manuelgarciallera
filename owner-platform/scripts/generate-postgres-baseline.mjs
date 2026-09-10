import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// One-time native code generation, never a database migration runner.
// Invoke with: node --conditions=react-server --import=tsx scripts/generate-postgres-baseline.mjs
const migrationDir = fileURLToPath(new URL('../database/baseline', import.meta.url))
let existing = []
try { existing = await readdir(migrationDir) } catch (error) { if (error.code !== 'ENOENT') throw error }
if (existing.length) throw new Error('Baseline already exists. Do not overwrite migration history; generate a reviewed delta separately.')
await mkdir(migrationDir, { recursive: true })

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = ''
process.env.PAYLOAD_SECRET = randomBytes(32).toString('hex')
process.env.OWNER_EMAIL_API_KEY = ''
process.env.OWNER_EMAIL_FROM = ''
process.env.OWNER_SERVER_URL = 'http://127.0.0.1:3013'
process.env.OWNER_PLATFORM_BUILD_PHASE = ''
process.env.NEXT_PHASE = ''

const { buildConfig, getPayload } = await import('payload')
const { postgresAdapter } = await import('@payloadcms/db-postgres')
const { createOwnerConfig } = await import('../src/payload.config.ts')
const config = createOwnerConfig()
const payload = await getPayload({
  key: `offline-baseline-${randomUUID()}`,
  disableDBConnect: true,
  config: await buildConfig({
    ...config,
    telemetry: false,
    typescript: { ...config.typescript, autoGenerate: false },
    db: postgresAdapter({
      pool: { host: '127.0.0.1', port: 1, database: 'offline_generation', user: 'offline', password: randomUUID() },
      push: false, disableCreateDatabase: true, migrationDir,
    }),
  }),
})
try {
  if (payload.db.pool) throw new Error('Offline generation unexpectedly acquired a database pool.')
  await payload.db.createMigration({ payload, migrationName: 'owner_baseline', forceAcceptWarning: true })
  if (payload.db.pool) throw new Error('Offline generation unexpectedly acquired a database pool.')
  console.log('Generated native PostgreSQL baseline without a database connection. Review before use.')
} finally { await payload.destroy() }
