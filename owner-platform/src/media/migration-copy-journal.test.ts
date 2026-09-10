import { lstat, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMigrationCopyJournal, readMigrationCopyJournal } from './migration-copy-journal'

let root: string
let identity: { dev: number; ino: number }
const revision = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const metadata = { planDigest: '1'.repeat(64), inventoryHash: '2'.repeat(64), destinationId: 'staging-objects', revisions: [revision] }
beforeEach(async () => { root = await mkdtemp(path.join(tmpdir(), 'owner-copy-journal-')); identity = await lstat(root) })
afterEach(async () => {
  const stats = await lstat(root)
  if (path.dirname(root) !== path.resolve(tmpdir()) || !/^owner-copy-journal-[\w-]+$/.test(path.basename(root)) ||
    stats.isSymbolicLink() || stats.dev !== identity.dev || stats.ino !== identity.ino) throw new Error('Unsafe fixture cleanup')
  await rm(root, { recursive: true })
})
it('recovers intent from a process that exits without closing the journal', async () => {
  const moduleURL = new URL('./migration-copy-journal.ts', import.meta.url).href
  const code = `import { createMigrationCopyJournal } from ${JSON.stringify(moduleURL)};
    const journal = await createMigrationCopyJournal(${JSON.stringify(root)}, ${JSON.stringify(metadata)});
    await journal.attempt(${JSON.stringify(revision)});
    process.stdout.write(journal.id, () => process.exit(0));`
  const { stdout } = await promisify(execFile)(process.execPath, ['--import=tsx', '--input-type=module', '-e', code], { timeout: 15000 })
  expect(await readMigrationCopyJournal(root, stdout)).toMatchObject({ uncertain: [revision], verified: [] })
}, 20000)
it('rejects sparse revision inventories before creating a journal', async () => {
  await expect(createMigrationCopyJournal(root, { ...metadata, revisions: new Array(1) })
    .then(async journal => { await journal.close(); return journal })).rejects.toThrow()
})
it('rejects JSON destination identifiers that are not strings', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  await journal.close()
  const filename = path.join(root, `${journal.id}.jsonl`)
  const header = JSON.parse(await readFile(filename, 'utf8'))
  header.destinationId = 123
  await writeFile(filename, JSON.stringify(header) + '\n')
  await expect(readMigrationCopyJournal(root, journal.id)).rejects.toThrow()
})
it('rejects simultaneous append and permits a later verification after the first append settles', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  try {
    const results = await Promise.allSettled([journal.attempt(revision), journal.verified(revision)])
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected'])
    await journal.verified(revision)
    expect(await readMigrationCopyJournal(root, journal.id)).toMatchObject({ verified: [revision], uncertain: [] })
  } finally { await journal.close() }
})
it('poisons the writer after sync failure, retaining the uncertain intent without further append', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  const probe = await open(path.join(root, 'probe'), 'wx')
  const prototype = Object.getPrototypeOf(probe)
  await probe.close()
  const sync = vi.spyOn(prototype, 'sync').mockRejectedValueOnce(new Error('Injected sync failure'))
  try {
    await expect(journal.attempt(revision)).rejects.toThrow()
    sync.mockRestore()
    const before = await readFile(path.join(root, `${journal.id}.jsonl`))
    await expect(journal.verified(revision)).rejects.toThrow()
    await expect(journal.attempt(revision)).rejects.toThrow()
    expect(await readFile(path.join(root, `${journal.id}.jsonl`))).toEqual(before)
    expect(await readMigrationCopyJournal(root, journal.id)).toMatchObject({ uncertain: [revision], verified: [] })
  } finally { sync.mockRestore(); await journal.close() }
})
it('persists an attempt before completion and reconstructs uncertainty after reopening', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  try {
    await journal.attempt(revision)
    expect(await readMigrationCopyJournal(root, journal.id)).toMatchObject({ uncertain: [revision], verified: [], ...metadata })
    await journal.verified(revision)
    expect(await readMigrationCopyJournal(root, journal.id)).toMatchObject({ uncertain: [], verified: [revision] })
  } finally { await journal.close() }
})
it('rejects verification without an attempt and rejects duplicate attempts', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  try {
    await expect(journal.verified(revision)).rejects.toThrow()
    await journal.attempt(revision)
    await expect(journal.attempt(revision)).rejects.toThrow()
    await expect(journal.attempt('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')).rejects.toThrow()
  } finally { await journal.close() }
})
it('refuses truncated records instead of silently interpreting them as no attempted writes', async () => {
  const journal = await createMigrationCopyJournal(root, metadata)
  await journal.attempt(revision)
  await journal.close()
  const filename = path.join(root, `${journal.id}.jsonl`)
  const bytes = await readFile(filename)
  await writeFile(filename, bytes.subarray(0, bytes.length - 3))
  await expect(readMigrationCopyJournal(root, journal.id)).rejects.toThrow()
})
