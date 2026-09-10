import { createHash } from 'node:crypto'
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { inspectLegacyMediaInventory } from './legacy-media-inventory'
import { createMigrationPlan } from './migration-plan'
import { writeMediaRevision } from './revision-store'
import { startObjectProviderFixture } from '../../tests/media/object-provider-fixture'
import { copyMigrationRevisions } from './migration-revision-copy'

let root: string
let identity: { dev: number; ino: number }
let provider: Awaited<ReturnType<typeof startObjectProviderFixture>> | undefined
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'owner-revision-copy-'))
  identity = await lstat(root)
  provider = await startObjectProviderFixture()
})
afterEach(async () => {
  try { await provider?.close() } finally {
    const stats = await lstat(root)
    if (path.dirname(root) !== path.resolve(tmpdir()) || !/^owner-revision-copy-[\w-]+$/.test(path.basename(root)) ||
      stats.isSymbolicLink() || stats.dev !== identity.dev || stats.ino !== identity.ino) throw new Error('Unowned fixture; preserve it.')
    await rm(root, { recursive: true })
  }
})
async function fixture(count = 1) {
  const legacy = path.join(root, 'legacy')
  const sourceRoot = path.join(root, 'revisions')
  await mkdir(legacy); await mkdir(sourceRoot)
  const bytes = Buffer.from('original image bytes')
  const references = []
  const evidence = []
  const revisions = []
  for (let index = 0; index < count; index++) {
    const filename = index === 0 ? 'hero.png' : `hero${index}.png`
    const id = String(index + 1)
    await writeFile(path.join(legacy, filename), bytes)
    references.push({ kind: 'document' as const, documentId: id, referenceId: id, state: 'published' as const,
      files: [{ variant: 'original', filename, expectedBytes: bytes.length }] })
    const revision = await writeMediaRevision(sourceRoot, [{ name: filename, bytes }])
    revisions.push(revision)
    evidence.push({ kind: 'document', documentId: id, referenceId: id, variant: 'original', filename,
      bytes: bytes.length, sha256: sha(bytes), revision, evidenceHash: '2'.repeat(64) })
  }
  const inventory = await inspectLegacyMediaInventory({ root: legacy, references })
  const plan = createMigrationPlan({ sourceInventoryHash: inventory.hash,
    references: references.map(({ kind, documentId, referenceId }) => ({ kind, documentId, referenceId, variants: ['original'] })), evidence })
  return { revision: revisions[0], revisions, bytes, sourceRoot, serializedPlan: JSON.stringify(plan), serializedInventory: JSON.stringify(inventory),
    expectedInventoryHash: inventory.hash, destination: provider!.storage }
}

it('copies exact bytes and immutable revision identity without mutating source or granting cutover', async () => {
  const input = await fixture()
  const receipt = await copyMigrationRevisions(input)
  expect(receipt).toMatchObject({ status: 'copied-and-verified', canApply: false, revisions: [input.revision], fileCount: 1, totalBytes: 20 })
  expect(await provider!.storage.read(input.revision)).toEqual([{ name: 'hero.png', bytes: input.bytes }])
  expect(await readFile(path.join(input.sourceRoot, input.revision, 'hero.png'))).toEqual(input.bytes)
})
it('rejects an untrusted inventory hash before any destination allocation', async () => {
  const input = await fixture()
  await expect(copyMigrationRevisions({ ...input, expectedInventoryHash: '0'.repeat(64) })).rejects.toMatchObject({ code: 'preflight-failed', attemptedRevisions: [] })
  expect(provider!.objects.size).toBe(0)
})
it('rejects damaged source bytes before any destination allocation', async () => {
  const input = await fixture()
  await writeFile(path.join(input.sourceRoot, input.revision, 'hero.png'), 'corrupt')
  await expect(copyMigrationRevisions(input)).rejects.toMatchObject({ code: 'preflight-failed', attemptedRevisions: [] })
  expect(provider!.objects.size).toBe(0)
})
it('reports the attempted identity on provider failure without leaking provider details', async () => {
  const input = await fixture()
  provider!.failures.writes = true
  const error = await copyMigrationRevisions(input).catch(error => error)
  expect(error).toMatchObject({ code: 'copy-failed', attemptedRevisions: [input.revision] })
  expect(error.cause).toBeUndefined()
  expect(String(error)).not.toContain(root)
})
it('refuses a second copy without overwriting the previously verified destination', async () => {
  const input = await fixture()
  await copyMigrationRevisions(input)
  const before = [...provider!.objects].map(([key, bytes]) => [key, Buffer.from(bytes)])
  await expect(copyMigrationRevisions(input)).rejects.toMatchObject({ code: 'copy-failed', attemptedRevisions: [input.revision] })
  expect([...provider!.objects]).toEqual(before)
})
it('rejects a forged destination identity and records the attempted revision', async () => {
  const input = await fixture()
  const destination = { ...provider!.storage, async restore(...args: Parameters<typeof input.destination.restore>) {
    await provider!.storage.restore(...args)
    return 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  } }
  await expect(copyMigrationRevisions({ ...input, destination })).rejects.toMatchObject({ code: 'copy-failed', attemptedRevisions: [input.revision] })
  expect(await provider!.storage.read(input.revision)).toEqual([{ name: 'hero.png', bytes: input.bytes }])
})
it('rejects a destination reread that disagrees with the copied bytes', async () => {
  const input = await fixture()
  const destination = { ...provider!.storage, async read(revision: string) {
    const files = await provider!.storage.read(revision)
    return files.map(file => ({ ...file, bytes: Buffer.from('wrong') }))
  } }
  await expect(copyMigrationRevisions({ ...input, destination })).rejects.toMatchObject({ code: 'copy-failed', attemptedRevisions: [input.revision] })
})
it('validates later revisions before writing even the first destination', async () => {
  const input = await fixture(2)
  await writeFile(path.join(input.sourceRoot, input.revisions[1], 'hero1.png'), 'corrupt')
  await expect(copyMigrationRevisions(input)).rejects.toMatchObject({ code: 'preflight-failed', attemptedRevisions: [] })
  expect(provider!.objects.size).toBe(0)
})
it('retains the first complete revision and reports both attempts when the second write fails', async () => {
  const input = await fixture(2)
  const destination = { ...provider!.storage, async restore(...args: Parameters<typeof input.destination.restore>) {
    if (args[0] === input.revisions[1]) provider!.failures.writes = true
    return provider!.storage.restore(...args)
  } }
  await expect(copyMigrationRevisions({ ...input, destination })).rejects.toMatchObject({ code: 'copy-failed', attemptedRevisions: input.revisions })
  expect(await provider!.storage.read(input.revision)).toEqual([{ name: 'hero.png', bytes: input.bytes }])
  expect(await readFile(path.join(input.sourceRoot, input.revisions[1], 'hero1.png'))).toEqual(input.bytes)
})
it('rechecks source against candidate after preflight, even if a changed manifest is internally valid', async () => {
  const input = await fixture(2)
  const destination = { ...provider!.storage, async restore(...args: Parameters<typeof input.destination.restore>) {
    const result = await provider!.storage.restore(...args)
    const directory = path.join(input.sourceRoot, input.revisions[1])
    const changed = Buffer.from('different byte value')
    await writeFile(path.join(directory, 'hero1.png'), changed)
    const manifestPath = path.join(directory, 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.files[0].size = changed.length
    manifest.files[0].sha256 = sha(changed)
    await writeFile(manifestPath, JSON.stringify(manifest))
    return result
  } }
  await expect(copyMigrationRevisions({ ...input, destination })).rejects.toMatchObject({ code: 'copy-failed', attemptedRevisions: [input.revision] })
  expect([...provider!.objects.keys()].every(key => key.includes(input.revision))).toBe(true)
})
