import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPostgresCluster, preflightTools, runCommand, safeEnvironment } from '../tests/recovery/postgres-runtime.mjs'

const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const cache = path.join(ownerRoot, 'node_modules', '.cache')
// Tool validation runs before a cluster, password or database is created.
const { tools, versions } = await preflightTools(process.env.OWNER_POSTGRES_BIN)
const postgres = await createPostgresCluster({ cache, kind: 'editorial', tools })
let childClosed = true
let failure
let result

try {
  console.log('[postgres-editorial] initialize fresh loopback SCRAM cluster')
  const pool = await postgres.initialize()
  const env = {
    ...safeEnvironment(),
    OWNER_INTEGRATION_ENGINE: 'postgres',
    OWNER_INTEGRATION_DIRECTORY: postgres.root,
    OWNER_INTEGRATION_POSTGRES: JSON.stringify(pool),
  }
  childClosed = false
  let testRun
  try {
    testRun = await runCommand(process.execPath, [
      path.join(ownerRoot, 'node_modules', 'vitest', 'vitest.mjs'),
      'run', '--config', 'vitest.integration.config.ts',
    ], { cwd: ownerRoot, env, secrets: [pool.password], timeout: 180_000 })
  } catch (error) {
    childClosed = error?.childClosed === true
    throw error
  }
  childClosed = testRun.childClosed === true
  if (testRun.stdout) console.log(testRun.stdout)
  if (testRun.stderr) console.error(testRun.stderr)
  assert.equal((await postgres.query('owner_editorial', 'SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND pid <> pg_backend_pid()')).stdout.trim(), '0', 'Editorial test process left a PostgreSQL session open.')
  result = {
    integration: 'passed',
    engine: 'postgres',
    suite: 'tests/editorial.integration.test.ts',
    versions,
    ambientCredentialsIgnored: true,
    testProcessClosed: true,
    databaseSessionsClosed: true,
  }
} catch (error) {
  failure = error
} finally {
  try {
    await postgres.shutdown({ childrenClosed: childClosed })
    console.log('[postgres-editorial] exact cluster stopped; synthetic run root removed')
  } catch (cleanupError) {
    console.error(`Synthetic editorial data retained at ${postgres.root}: ${cleanupError.message}`)
    failure ??= cleanupError
  }
}

if (failure) throw failure
console.log(JSON.stringify({ ...result, cleanup: 'verified shutdown and removed only this run root' }, null, 2))
