import { randomUUID } from 'node:crypto'
import { execFile, fork, spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { build } from 'esbuild'

import { createPhysicalBackup, restoreVerifiedBackup, snapshotFiles } from '../tests/recovery/backup-manifest.mjs'

const execFileAsync = promisify(execFile)
const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
const workerSource = path.join(ownerRoot, 'tests', 'recovery', 'payload-worker.mjs')
const tempPrefix = path.join(ownerRoot, 'node_modules', '.cache', 'owner-physical-recovery-')
let activeWorkers = 0

const safeEnvironment = () => {
  const keys = process.platform === 'win32'
    ? ['ComSpec', 'NUMBER_OF_PROCESSORS', 'OS', 'Path', 'PATHEXT', 'PROCESSOR_ARCHITECTURE', 'SystemDrive', 'SystemRoot', 'TEMP', 'TMP', 'windir']
    : ['HOME', 'LANG', 'PATH', 'SHELL', 'TMPDIR', 'TZ']
  const env = Object.fromEntries(keys.flatMap((key) => process.env[key] === undefined ? [] : [[key, process.env[key]]]))
  return {
    ...env,
    DATABASE_URL: '',
    FIGMA_PERSONAL_ACCESS_TOKEN: '',
    FIGMA_PLAN: '',
    LOCAL_DATABASE_NAME: '',
    NODE_ENV: 'test',
    OWNER_BOOTSTRAP_SECRET: '',
    PAYLOAD_SECRET: '',
    RESEND_API_KEY: '',
    SMTP_PASS: '',
    SMTP_USER: '',
  }
}

const runUnitTests = () => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(ownerRoot, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--config', 'vitest.recovery.config.ts', 'tests/recovery/backup-manifest.test.mjs'], {
    cwd: ownerRoot,
    env: safeEnvironment(),
    stdio: 'inherit',
  })
  child.once('error', reject)
  child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`Recovery helper tests exited with ${code ?? 1}.`)))
})

const runWorker = (workerPath, input) => new Promise((resolve, reject) => {
  let response
  let spawnError
  let timedOut = false
  let inputSent = false
  const child = fork(workerPath, [], {
    cwd: ownerRoot,
    env: safeEnvironment(),
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  })
  activeWorkers += 1
  const timer = setTimeout(() => {
    timedOut = true
    child.kill()
  }, 120_000)
  child.once('error', (error) => {
    spawnError = error
  })
  child.on('message', (message) => {
    if (message?.ready && !inputSent) {
      inputSent = true
      child.send(input)
    } else if (message?.progress) console.log(`[recovery] ${message.progress}`)
    else response = message
  })
  child.once('close', (code) => {
    clearTimeout(timer)
    activeWorkers -= 1
    if (timedOut) reject(new Error(`Recovery ${input.mode} worker timed out.`))
    else if (spawnError) reject(spawnError)
    else if (code !== 0 || !response?.ok) reject(new Error(response?.error ?? `Recovery ${input.mode} worker exited with ${code ?? 1}.`))
    else resolve(response.result)
  })
})

await runUnitTests()

await mkdir(path.dirname(tempPrefix), { recursive: true })
const taskRoot = await mkdtemp(tempPrefix)
try {
  const workerPath = path.join(taskRoot, 'runtime', 'payload-worker.mjs')
  await build({
    absWorkingDir: ownerRoot,
    bundle: true,
    entryPoints: [workerSource],
    format: 'esm',
    outfile: workerPath,
    packages: 'external',
    platform: 'node',
    target: 'node20',
  })
  const sourceDirectory = path.join(taskRoot, 'source')
  const backupDirectory = path.join(taskRoot, 'backup')
  const invalidBackupDirectory = path.join(taskRoot, 'invalid-backup')
  const invalidRestoreDirectory = path.join(taskRoot, 'invalid-restore')
  const restoreDirectory = path.join(taskRoot, 'restored')
  const credentials = { email: `recovery-${randomUUID()}@example.invalid`, password: randomUUID() + randomUUID() }
  const payloadSecret = randomUUID() + randomUUID()
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot, encoding: 'utf8' })
  const applicationCommit = stdout.trim()

  const seeded = await runWorker(workerPath, {
    mode: 'seed', credentials, payloadSecret,
    databaseDirectory: path.join(sourceDirectory, 'database'),
    mediaDirectory: path.join(sourceDirectory, 'media'),
  })

  const sourceBefore = await snapshotFiles(sourceDirectory)
  const sidecars = sourceBefore.filter((file) => /^database\/owner\.db(?:-wal|-shm|-journal)$/.test(file.path))
  const manifest = await createPhysicalBackup({ applicationCommit, backupDirectory, sourceDirectory })
  const backupBefore = await snapshotFiles(backupDirectory)

  await cp(backupDirectory, invalidBackupDirectory, { recursive: true, errorOnExist: true, force: false })
  const corruptTarget = manifest.files.find((file) => file.path.startsWith('media/'))
  if (!corruptTarget) throw new Error('Recovery fixture did not produce a media backup file.')
  await writeFile(path.join(invalidBackupDirectory, 'data', ...corruptTarget.path.split('/')), Buffer.concat([
    await readFile(path.join(invalidBackupDirectory, 'data', ...corruptTarget.path.split('/'))),
    Buffer.from('corrupt'),
  ]))
  let corruptRejected = false
  try {
    await restoreVerifiedBackup({ backupDirectory: invalidBackupDirectory, restoreDirectory: invalidRestoreDirectory })
  } catch {
    corruptRejected = true
  }
  if (!corruptRejected) throw new Error('Corrupt backup was not rejected.')
  try {
    await stat(invalidRestoreDirectory)
    throw new Error('Invalid restore directory was created before integrity rejection.')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  await restoreVerifiedBackup({ backupDirectory, restoreDirectory })
  const restored = await runWorker(workerPath, {
    mode: 'restore', credentials, payloadSecret, expected: seeded,
    databaseDirectory: path.join(restoreDirectory, 'database'),
    mediaDirectory: path.join(restoreDirectory, 'media'),
  })

  if (JSON.stringify(await snapshotFiles(sourceDirectory)) !== JSON.stringify(sourceBefore)) throw new Error('Restored edit changed the source fixture.')
  if (JSON.stringify(await snapshotFiles(backupDirectory)) !== JSON.stringify(backupBefore)) throw new Error('Restored edit changed the backup.')

  console.log(JSON.stringify({
    recovery: 'passed',
    helperTests: 4,
    workflowChecks: 12,
    applicationCommit,
    backupFiles: manifest.files.length,
    databaseSidecarsIncluded: sidecars.length,
    mediaFilesVerified: restored.restoredMediaFileCount,
    pageVersionsRestored: restored.restoredVersionCount,
    ambientCredentialsIgnored: true,
  }, null, 2))
} finally {
  if (activeWorkers === 0) {
    if (!path.resolve(taskRoot).startsWith(path.resolve(tempPrefix))) throw new Error('Unsafe recovery cleanup path.')
    await rm(taskRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  } else {
    console.error(`Recovery cleanup skipped because ${activeWorkers} child process(es) have not closed. Temporary root retained: ${taskRoot}`)
  }
}
