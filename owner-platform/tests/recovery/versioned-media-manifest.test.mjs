import { mkdtemp, mkdir, readFile, readdir, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { createPhysicalBackup, verifyPhysicalBackup } from './backup-manifest.mjs'

import { restoreVersionedBackup, snapshotRevisionInventory } from './versioned-media-manifest.mjs'

const roots = []
const complete = '11111111-1111-4111-8111-111111111111'
const empty = '22222222-2222-4222-8222-222222222222'
const commit = '0123456789abcdef0123456789abcdef01234567'
const fixture = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-versioned-recovery-'))
  roots.push(root)
  const source = path.join(root, 'source')
  await mkdir(path.join(source, 'database'), { recursive: true })
  await mkdir(path.join(source, 'media', 'revisions', complete), { recursive: true })
  await mkdir(path.join(source, 'media', 'revisions', empty))
  await writeFile(path.join(source, 'database', 'owner.db'), 'synthetic database')
  await writeFile(path.join(source, 'media', 'revisions', complete, 'original.png'), 'original')
  await writeFile(path.join(source, 'media', 'revisions', complete, 'manifest.json'), '{}')
  const inventory = { schemaVersion: 1, revisions: [
    { revision: complete, state: 'complete', entries: ['manifest.json', 'original.png'] },
    { revision: empty, state: 'incomplete', entries: [] },
  ] }
  const receipt = path.join(source, 'media', 'revision-inventory.json')
  await writeFile(receipt, JSON.stringify(inventory))
  return { root, source, receipt, inventory, backupDirectory: path.join(root, 'backup'), restoreDirectory: path.join(root, 'restore') }
}

// All roots belong to this test. Delete individual files and then empty dirs;
// do not add another recursive-delete implementation to the recovery harness.
afterEach(async () => {
  for (const root of roots.splice(0)) {
    const directories = [root]
    for (let index = 0; index < directories.length; index++) {
      const directory = directories[index]
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) directories.push(path.join(directory, entry.name))
        else await unlink(path.join(directory, entry.name))
      }
    }
    for (const directory of directories.reverse()) await rmdir(directory)
  }
})

it('rejects a missing recorded empty attempt before allocating restore even when file hashes match', async () => {
  const f = await fixture()
  await createPhysicalBackup({ ...f, applicationCommit: commit, sourceDirectory: f.source })
  await rmdir(path.join(f.backupDirectory, 'data', 'media', 'revisions', empty))
  await expect(verifyPhysicalBackup(f.backupDirectory)).resolves.toBeDefined()
  await expect(restoreVersionedBackup(f)).rejects.toThrow(/integrity/)
  await expect(stat(f.restoreDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
})

it('restores complete and empty incomplete attempts without overwriting an existing destination', async () => {
  const f = await fixture()
  expect(await snapshotRevisionInventory(path.join(f.source, 'media'))).toEqual(f.inventory)
  await createPhysicalBackup({ ...f, applicationCommit: commit, sourceDirectory: f.source })
  await restoreVersionedBackup(f)
  expect(await readdir(path.join(f.restoreDirectory, 'media', 'revisions', empty))).toEqual([])
  expect(await readFile(path.join(f.restoreDirectory, 'database', 'owner.db'), 'utf8')).toBe('synthetic database')
  await expect(restoreVersionedBackup(f)).rejects.toThrow(/exists/)
})

it.each(['added', 'missing', 'corrupt', 'missing-inventory', 'corrupt-inventory'])('rejects %s physical inventory before restore allocation', async (damage) => {
  const f = await fixture()
  await createPhysicalBackup({ ...f, applicationCommit: commit, sourceDirectory: f.source })
  const media = path.join(f.backupDirectory, 'data', 'media')
  if (damage === 'added') await mkdir(path.join(media, 'revisions', '33333333-3333-4333-8333-333333333333'))
  if (damage === 'missing') await unlink(path.join(media, 'revisions', complete, 'original.png'))
  if (damage === 'corrupt') await writeFile(path.join(media, 'revisions', complete, 'original.png'), 'bad')
  if (damage === 'missing-inventory') await unlink(path.join(media, 'revision-inventory.json'))
  if (damage === 'corrupt-inventory') await writeFile(path.join(media, 'revision-inventory.json'), 'bad')
  await expect(restoreVersionedBackup(f)).rejects.toThrow(/integrity/)
  await expect(stat(f.restoreDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
})

it.each([
  null, {}, { schemaVersion: 2, revisions: [] },
  { schemaVersion: 1, revisions: [{ revision: '../escape', state: 'incomplete', entries: [] }] },
  { schemaVersion: 1, revisions: [{ revision: empty, state: 'unknown', entries: [] }] },
  { schemaVersion: 1, revisions: [{ revision: empty, state: 'incomplete', entries: [] }, { revision: empty, state: 'incomplete', entries: [] }] },
  { schemaVersion: 1, revisions: [{ revision: complete, state: 'complete', entries: ['../original.png'] }] },
])('rejects malformed inventory even with a valid outer file manifest: %j', async (inventory) => {
  const f = await fixture()
  await writeFile(f.receipt, JSON.stringify(inventory))
  await createPhysicalBackup({ ...f, applicationCommit: commit, sourceDirectory: f.source })
  await expect(verifyPhysicalBackup(f.backupDirectory)).resolves.toBeDefined()
  await expect(restoreVersionedBackup(f)).rejects.toThrow(/integrity/)
  await expect(stat(f.restoreDirectory)).rejects.toMatchObject({ code: 'ENOENT' })
})
