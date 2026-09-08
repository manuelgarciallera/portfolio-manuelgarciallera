import assert from 'node:assert/strict'
import { cp, lstat, mkdir, readFile, readdir, rmdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { restoreVerifiedBackup, verifyPhysicalBackup } from './backup-manifest.mjs'

const revisionID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const receiptName = 'revision-inventory.json'
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...keys].sort().join(',')
const name = (value) => typeof value === 'string' && value.length > 0 && !/[\\/\x00-\x1f]/.test(value) && !['.', '..'].includes(value)

// This test-only receipt inventories retained directories, including empty write
// attempts. Complete revision byte validity is also checked by the real reader
// in the worker; the outer physical manifest covers every file here.
export const snapshotRevisionInventory = async (mediaDirectory) => {
  const root = path.join(mediaDirectory, 'revisions')
  assert((await lstat(root)).isDirectory() && !(await lstat(root)).isSymbolicLink(), 'Invalid revision root')
  const revisions = []
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    assert(entry.isDirectory() && !entry.isSymbolicLink() && revisionID.test(entry.name), 'Invalid revision directory')
    const files = await readdir(path.join(root, entry.name), { withFileTypes: true })
    assert(files.every((file) => file.isFile() && !file.isSymbolicLink() && name(file.name)), 'Invalid revision entries')
    const entries = files.map((file) => file.name).sort()
    revisions.push({ revision: entry.name, state: entries.includes('manifest.json') ? 'complete' : 'incomplete', entries })
  }
  return { schemaVersion: 1, revisions }
}

export const writeRevisionInventory = async (mediaDirectory) => {
  const inventory = await snapshotRevisionInventory(mediaDirectory)
  await writeFile(path.join(mediaDirectory, receiptName), JSON.stringify(inventory, null, 2) + '\n', { flag: 'wx' })
  return inventory
}

export const verifyVersionedBackup = async (backupDirectory) => {
  const manifest = await verifyPhysicalBackup(backupDirectory)
  try {
    const media = path.join(backupDirectory, 'data', 'media')
    const inventory = JSON.parse(await readFile(path.join(media, receiptName), 'utf8'))
    assert(exactKeys(inventory, ['schemaVersion', 'revisions']) && inventory.schemaVersion === 1 && Array.isArray(inventory.revisions), 'Malformed inventory')
    const ids = new Set()
    for (const item of inventory.revisions) {
      assert(exactKeys(item, ['revision', 'state', 'entries']) && revisionID.test(item.revision)
        && ['complete', 'incomplete'].includes(item.state) && Array.isArray(item.entries)
        && item.entries.every(name) && new Set(item.entries).size === item.entries.length && !ids.has(item.revision), 'Malformed revision inventory')
      ids.add(item.revision)
    }
    assert.deepEqual(await snapshotRevisionInventory(media), inventory, 'Revision directory inventory mismatch')
  } catch (cause) {
    throw new Error('Versioned backup integrity check failed.', { cause })
  }
  return manifest
}

export const restoreVersionedBackup = async (options) => {
  await verifyVersionedBackup(options.backupDirectory)
  return restoreVerifiedBackup(options)
}

// Shared SQLite/PostgreSQL damage gate. The parent supplies a read-only assertion
// that no target database exists. No restore target is allocated on any failure.
export const assertVersionedDamageRejected = async ({ backupDirectory, root, expected, assertDatabaseAbsent = async () => {} }) => {
  const historical = expected.revisions.A
  const derivative = historical.files.find((file) => file.name !== historical.filename)
  assert(derivative, 'Historical derivative is required')
  const manifest = await verifyVersionedBackup(backupDirectory)
  const database = manifest.files.find((file) => file.path.startsWith('database/'))
  const targets = [
    `media/revisions/${historical.revision}/${historical.filename}`,
    `media/revisions/${historical.revision}/${derivative.name}`,
    database.path,
  ]
  let attempts = 0
  for (const target of targets) {
    for (const damage of ['missing', 'corrupt']) {
      const invalid = path.join(root, `versioned-invalid-${attempts++}`)
      const restoreDirectory = `${invalid}-restore`
      await cp(backupDirectory, invalid, { recursive: true, force: false, errorOnExist: true })
      const file = path.join(invalid, 'data', ...target.split('/'))
      if (damage === 'missing') await unlink(file)
      else await writeFile(file, 'synthetic corruption')
      await assert.rejects(restoreVersionedBackup({ backupDirectory: invalid, restoreDirectory }), /integrity/)
      await assert.rejects(stat(restoreDirectory), { code: 'ENOENT' })
      await assertDatabaseAbsent()
    }
  }
  const invalid = path.join(root, 'versioned-invalid-empty')
  const restoreDirectory = `${invalid}-restore`
  await cp(backupDirectory, invalid, { recursive: true, force: false, errorOnExist: true })
  await rmdir(path.join(invalid, 'data', 'media', 'revisions', expected.emptyAttempt))
  await verifyPhysicalBackup(invalid)
  await assert.rejects(restoreVersionedBackup({ backupDirectory: invalid, restoreDirectory }), /integrity/)
  await assert.rejects(stat(restoreDirectory), { code: 'ENOENT' })
  await assertDatabaseAbsent()
  // An existing destination, even empty, must never be reused.
  const existing = path.join(root, 'versioned-existing-destination')
  await mkdir(existing)
  await assert.rejects(restoreVersionedBackup({ backupDirectory, restoreDirectory: existing }), /exists/)
  return attempts + 1
}
