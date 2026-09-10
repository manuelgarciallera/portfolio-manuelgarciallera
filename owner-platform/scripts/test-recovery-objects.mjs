import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { createPhysicalBackup, restoreVerifiedBackup, snapshotFiles } from '../tests/recovery/backup-manifest.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'

const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const cache = path.join(ownerRoot, 'node_modules', '.cache')
await mkdir(cache, { recursive: true })
const root = await mkdtemp(path.join(cache, 'owner-object-recovery-'))
try {
  const worker = path.join(root, 'runtime', 'worker.mjs')
  await build({ absWorkingDir: ownerRoot, entryPoints: ['tests/recovery/object-media-worker.mjs'], bundle: true,
    format: 'esm', outfile: worker, packages: 'external', platform: 'node', target: 'node20' })
  const source = path.join(root, 'source'), backup = path.join(root, 'backup'), destination = path.join(root, 'destination')
  const credentials = { email: 'recovery@example.invalid', password: randomUUID() + randomUUID() }
  const payloadSecret = randomUUID() + randomUUID()
  const input = (directory) => ({ credentials, payloadSecret, databaseDirectory: path.join(directory, 'database'), mediaDirectory: path.join(directory, 'media') })
  const seeded = await runWorker(worker, { mode: 'seed', ...input(source) }, ownerRoot)
  assert(workersClosed(), 'Source database and provider process must stop before copying')
  const sourceBefore = await snapshotFiles(source)
  const applicationCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot, encoding: 'utf8' }).trim()
  await createPhysicalBackup({ applicationCommit, sourceDirectory: source, backupDirectory: backup })
  const backupBefore = await snapshotFiles(backup)
  let damageCases = 0
  // Fail before allocating the restored DB or starting its provider process.
  for (const target of ['database/owner.db', `media/${seeded.revisions[0].id}/0.bin`, `media/${seeded.revisions[0].id}/1.bin`]) {
    for (const damage of ['missing', 'corrupt']) {
      const invalid = path.join(root, `invalid-${damageCases++}`)
      const invalidDestination = `${invalid}-destination`
      await cp(backup, invalid, { recursive: true, force: false, errorOnExist: true })
      const file = path.join(invalid, 'data', ...target.split('/'))
      if (damage === 'missing') await unlink(file)
      else await writeFile(file, 'synthetic corruption')
      await assert.rejects(restoreVerifiedBackup({ backupDirectory: invalid, restoreDirectory: invalidDestination }), /integrity/)
      await assert.rejects(stat(invalidDestination), { code: 'ENOENT' })
    }
  }
  await restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: destination })
  const recovered = await runWorker(worker, { mode: 'restore', ...input(destination), expected: seeded }, ownerRoot)
  assert(workersClosed())
  assert.notEqual(recovered.pid, seeded.pid)
  assert.deepEqual(await snapshotFiles(source), sourceBefore, 'Recovered edits leave source unchanged')
  assert.deepEqual(await snapshotFiles(backup), backupBefore, 'Recovered edits leave backup unchanged')
  console.log(JSON.stringify({ recovery: 'passed', engine: 'sqlite', provider: 'synthetic S3 HTTP in separate children', applicationCommit, damageCases, ...recovered }, null, 2))
} finally {
  const relative = path.relative(cache, root)
  if (!relative.startsWith('owner-object-recovery-') || relative.includes(path.sep) || path.isAbsolute(relative)) throw new Error('Unsafe cleanup target')
  if (workersClosed()) await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  else console.error(`Workers still alive; preserving ${root}`)
}
