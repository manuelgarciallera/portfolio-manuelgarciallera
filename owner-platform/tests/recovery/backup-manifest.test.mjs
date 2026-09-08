import { createHash } from 'node:crypto'
import { link, mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  createPhysicalBackup,
  snapshotFiles,
  restoreVerifiedBackup,
  verifyPhysicalBackup,
} from './backup-manifest.mjs'

const roots = []
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

const fixture = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'owner-recovery-helper-'))
  roots.push(root)
  const source = path.join(root, 'source')
  await mkdir(path.join(source, 'database'), { recursive: true })
  await mkdir(path.join(source, 'media', 'nested'), { recursive: true })
  await writeFile(path.join(source, 'database', 'owner.db'), 'sqlite fixture')
  await writeFile(path.join(source, 'media', 'nested', 'image.png'), 'png fixture')
  return { root, source }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('physical recovery manifest', () => {
  it('rejects a linked source root before creating a backup', async () => {
    const { root, source } = await fixture()
    const alias = path.join(root, 'source-alias')
    const backup = path.join(root, 'backup')
    await symlink(source, alias, 'junction')
    await expect(createPhysicalBackup({ applicationCommit: 'a'.repeat(40), sourceDirectory: alias, backupDirectory: backup })).rejects.toThrow(/link/i)
    await expect(stat(backup)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rejects a linked backup root before creating the restore destination', async () => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    const alias = path.join(root, 'backup-alias')
    const restored = path.join(root, 'restored')
    await createPhysicalBackup({ applicationCommit: 'a'.repeat(40), sourceDirectory: source, backupDirectory: backup })
    await symlink(backup, alias, 'junction')
    await expect(restoreVerifiedBackup({ backupDirectory: alias, restoreDirectory: restored })).rejects.toThrow(/backup/i)
    await expect(stat(restored)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rejects hard-linked source bytes before allocating a backup', async () => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    await link(path.join(source, 'database', 'owner.db'), path.join(root, 'other-writer.db'))
    await expect(createPhysicalBackup({ applicationCommit: 'a'.repeat(40), sourceDirectory: source, backupDirectory: backup })).rejects.toThrow(/link/i)
    await expect(stat(backup)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rejects a manifest with another writable hard-link alias', async () => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    const restored = path.join(root, 'restored')
    await createPhysicalBackup({ applicationCommit: 'a'.repeat(40), sourceDirectory: source, backupDirectory: backup })
    await link(path.join(backup, 'manifest.json'), path.join(root, 'other-manifest.json'))
    await expect(restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: restored })).rejects.toThrow(/backup/i)
    await expect(stat(restored)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('copies a matched database/media set and restores it independently', async () => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    const restored = path.join(root, 'restored')
    const commit = '0123456789abcdef0123456789abcdef01234567'

    const manifest = await createPhysicalBackup({ applicationCommit: commit, backupDirectory: backup, sourceDirectory: source })
    expect(manifest).toEqual({
      schemaVersion: 1,
      applicationCommit: commit,
      files: [
        { path: 'database/owner.db', sha256: sha256('sqlite fixture'), size: 14 },
        { path: 'media/nested/image.png', sha256: sha256('png fixture'), size: 11 },
      ],
    })
    await expect(verifyPhysicalBackup(backup)).resolves.toEqual(manifest)
    await restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: restored })
    expect(await readFile(path.join(restored, 'database', 'owner.db'), 'utf8')).toBe('sqlite fixture')
    expect(await readFile(path.join(restored, 'media', 'nested', 'image.png'), 'utf8')).toBe('png fixture')

    const sourceBefore = await snapshotFiles(source)
    const backupBefore = await snapshotFiles(backup)
    await writeFile(path.join(restored, 'database', 'owner.db'), 'changed restore')
    expect(await snapshotFiles(source)).toEqual(sourceBefore)
    expect(await snapshotFiles(backup)).toEqual(backupBefore)
  })

  it.each([
    ['missing', async (backup) => rm(path.join(backup, 'data', 'media', 'nested', 'image.png'))],
    ['corrupt', async (backup) => writeFile(path.join(backup, 'data', 'media', 'nested', 'image.png'), 'tampered')],
  ])('rejects a %s backup before creating the restore destination', async (_kind, damage) => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    const restored = path.join(root, 'restored')
    await createPhysicalBackup({
      applicationCommit: '0123456789abcdef0123456789abcdef01234567',
      backupDirectory: backup,
      sourceDirectory: source,
    })
    await damage(backup)

    await expect(restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: restored })).rejects.toThrow(/backup/i)
    await expect(stat(restored)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('refuses to overwrite an existing restore directory', async () => {
    const { root, source } = await fixture()
    const backup = path.join(root, 'backup')
    const restored = path.join(root, 'restored')
    await createPhysicalBackup({
      applicationCommit: '0123456789abcdef0123456789abcdef01234567',
      backupDirectory: backup,
      sourceDirectory: source,
    })
    await mkdir(restored)

    await expect(restoreVerifiedBackup({ backupDirectory: backup, restoreDirectory: restored })).rejects.toThrow(/exist/i)
  })
})
