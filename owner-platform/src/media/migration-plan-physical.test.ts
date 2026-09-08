import { createHash } from 'node:crypto'
import { link, lstat, mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createMigrationPlan, type MigrationPlan } from './migration-plan'
import { verifyMigrationPlanFiles } from './migration-plan-physical'
import { writeMediaRevision } from './revision-store'

const sha = (value: Buffer | string) => createHash('sha256').update(value).digest('hex')
const inventoryHash = '1'.repeat(64)
const identity = { kind: 'document' as const, documentId: 'media1', referenceId: 'current' }

describe('physical migration candidate observation (not authorization)', () => {
  let root = ''
  let rootIdentity: { dev: number; ino: number }
  const revisions = new Set<string>()

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'owner-plan-physical-'))
    rootIdentity = await lstat(root)
    revisions.clear()
  })

  // Only our explicitly recorded one-level revisions; never recursive cleanup.
  afterEach(async () => {
    const target = resolve(root)
    const stats = await lstat(target)
    if (dirname(target) !== resolve(tmpdir()) || !/^owner-plan-physical-[\w-]+$/.test(basename(target)) ||
      stats.isSymbolicLink() || !stats.isDirectory() || stats.dev !== rootIdentity.dev || stats.ino !== rootIdentity.ino) {
      throw new Error('Unowned fixture root; preserving evidence.')
    }
    for (const revision of revisions) {
      if (!/^[a-f0-9-]{36}$/.test(revision)) throw new Error('Unexpected fixture revision.')
      const directory = join(target, revision)
      const directoryStats = await lstat(directory)
      if (directoryStats.isSymbolicLink() || !directoryStats.isDirectory()) throw new Error('Fixture directory changed.')
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (!entry.isFile() && !entry.isSymbolicLink()) throw new Error('Unexpected fixture entry.')
        await unlink(join(directory, entry.name))
      }
      await rmdir(directory)
    }
    await rmdir(target)
  })

  async function fixture(files = [{ name: 'hero.png', bytes: Buffer.from('old') }]) {
    const revision = await writeMediaRevision(root, files)
    revisions.add(revision)
    const plan = createMigrationPlan({
      sourceInventoryHash: inventoryHash,
      references: [{ ...identity, variants: files.map((_, index) => `variant${index}`) }],
      evidence: files.map((file, index) => ({ ...identity, variant: `variant${index}`, filename: file.name,
        bytes: file.bytes.length, sha256: sha(file.bytes), revision, evidenceHash: '2'.repeat(64) })),
    })
    return { plan, revision, directory: join(root, revision) }
  }

  const observe = (plan: MigrationPlan) => verifyMigrationPlanFiles(JSON.stringify(plan), root)
  const rebuild = (plan: MigrationPlan) => createMigrationPlan({ sourceInventoryHash: plan.sourceInventoryHash,
    references: plan.references, evidence: plan.evidence })

  it('compares original and derivative bytes without writing or granting permission', async () => {
    const { plan, directory } = await fixture([
      { name: 'hero.png', bytes: Buffer.from('old') },
      { name: 'thumb.png', bytes: Buffer.from('small') },
    ])
    const before = await Promise.all((await readdir(directory)).map(async name => ({ name, bytes: await readFile(join(directory, name)) })))
    await expect(observe(plan)).resolves.toEqual({
      schemaVersion: 1, status: 'observed-match', canApply: false,
      planDigest: plan.digest, sourceInventoryHash: inventoryHash, revisionCount: 1, fileCount: 2, totalBytes: 8,
    })
    const after = await Promise.all((await readdir(directory)).map(async name => ({ name, bytes: await readFile(join(directory, name)) })))
    expect(after).toEqual(before)
    expect(await readdir(root)).toEqual([plan.evidence[0].revision])
  })

  it('does not collapse same-named historical revisions into the current bytes', async () => {
    const old = await fixture()
    const current = await fixture([{ name: 'hero.png', bytes: Buffer.from('new') }])
    const historical = { kind: 'version' as const, documentId: 'media1', referenceId: 'version1' }
    const plan = createMigrationPlan({ sourceInventoryHash: inventoryHash,
      references: [...current.plan.references, { ...historical, variants: ['variant0'] }],
      evidence: [...current.plan.evidence, { ...old.plan.evidence[0], ...historical }],
    })
    await expect(observe(plan)).resolves.toMatchObject({ revisionCount: 2, fileCount: 2, totalBytes: 6, canApply: false })
    await writeFile(join(old.directory, 'hero.png'), 'new')
    await expect(observe(plan)).rejects.toMatchObject({ code: 'revision-unreadable' })
  })

  it('counts physical aliases once while checking every reference in the candidate', async () => {
    const { plan } = await fixture()
    const alias = { kind: 'snapshot' as const, documentId: 'page1', referenceId: 'capture1' }
    const combined = createMigrationPlan({ sourceInventoryHash: inventoryHash,
      references: [...plan.references, { ...alias, variants: ['variant0'] }],
      evidence: [...plan.evidence, { ...plan.evidence[0], ...alias }],
    })
    await expect(observe(combined)).resolves.toMatchObject({ revisionCount: 1, fileCount: 1, totalBytes: 3 })
  })

  it.each(['size', 'hash', 'name'] as const)('rejects an internally consistent manifest when candidate %s differs', async field => {
    const { plan } = await fixture()
    if (field === 'size') plan.evidence[0].bytes = 4
    if (field === 'hash') plan.evidence[0].sha256 = sha('new')
    if (field === 'name') plan.evidence[0].filename = 'other.png'
    await expect(observe(rebuild(plan))).rejects.toMatchObject({ code: 'candidate-file-mismatch' })
  })

  it('rejects bytes and manifest tampered together against the unchanged candidate', async () => {
    const { plan, directory } = await fixture()
    await writeFile(join(directory, 'hero.png'), 'new')
    const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
    manifest.files[0].sha256 = sha('new')
    await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest))
    await expect(observe(plan)).rejects.toMatchObject({ code: 'candidate-file-mismatch' })
  })

  it.each(['missing-file', 'missing-manifest', 'bad-manifest', 'extra-file', 'hardlink'])('rejects %s without producing a successful receipt', async mutation => {
    const { plan, directory } = await fixture()
    if (mutation === 'missing-file') await unlink(join(directory, 'hero.png'))
    if (mutation === 'missing-manifest') await unlink(join(directory, 'manifest.json'))
    if (mutation === 'bad-manifest') await writeFile(join(directory, 'manifest.json'), '{')
    if (mutation === 'extra-file') await writeFile(join(directory, 'extra.png'), 'extra')
    if (mutation === 'hardlink') {
      const other = await fixture([{ name: 'hero.png', bytes: Buffer.from('old') }])
      await unlink(join(directory, 'hero.png'))
      await link(join(other.directory, 'hero.png'), join(directory, 'hero.png'))
    }
    await expect(observe(plan)).rejects.toMatchObject({ code: 'revision-unreadable' })
  })

  it('rejects a valid revision with files omitted from candidate evidence', async () => {
    const { plan } = await fixture([{ name: 'hero.png', bytes: Buffer.from('old') }, { name: 'thumb.png', bytes: Buffer.from('small') }])
    plan.references[0].variants.pop()
    plan.evidence.pop()
    await expect(observe(rebuild(plan))).rejects.toMatchObject({ code: 'candidate-file-mismatch' })
  })

  it('rejects blocked candidates before filesystem access', async () => {
    const blocked = createMigrationPlan({ sourceInventoryHash: inventoryHash,
      references: [{ ...identity, variants: ['original'] }], evidence: [],
    })
    await expect(verifyMigrationPlanFiles(JSON.stringify(blocked), 'not-an-absolute-root')).rejects.toMatchObject({ code: 'candidate-blocked' })
  })

  it('revalidates the serialized digest instead of trusting a previously created object', async () => {
    const { plan } = await fixture()
    plan.evidence[0].sha256 = sha('new')
    await expect(observe(plan)).rejects.toMatchObject({ code: 'candidate-invalid' })
  })

  it('does not leak the storage path or filesystem error in its error envelope', async () => {
    const { plan } = await fixture()
    const error = await verifyMigrationPlanFiles(JSON.stringify(plan), join(root, 'missing-private-root')).catch(value => value)
    expect(error).toMatchObject({ code: 'revision-unreadable' })
    expect(String(error)).not.toContain(root)
    expect(error.cause).toBeUndefined()
  })
})
