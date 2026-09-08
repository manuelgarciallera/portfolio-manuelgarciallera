import { createHash } from 'node:crypto'
import { lstat, mkdtemp, rmdir, writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { inspectLegacyMediaInventory, type LegacyMediaReference } from './legacy-media-inventory'
import { createMigrationPlan, type MigrationPlan } from './migration-plan'
import { bindMigrationPlanInventory } from './migration-plan-inventory'

const revision = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const sha = (text: string) => createHash('sha256').update(text).digest('hex')
const ref = (overrides: Partial<LegacyMediaReference> = {}): LegacyMediaReference => ({
  kind: 'document', documentId: '1', referenceId: '1', state: 'published',
  files: [{ variant: 'original', filename: 'hero.png', expectedBytes: 3 }], ...overrides,
})

describe('migration candidate binding to a pinned inventory artifact', () => {
  let root: string
  let identity: { dev: number; ino: number }
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'owner-inventory-binding-'))
    identity = await lstat(root)
    await writeFile(join(root, 'hero.png'), 'old')
  })
  afterEach(async () => {
    const stats = await lstat(root)
    if (dirname(resolve(root)) !== resolve(tmpdir()) || !/^owner-inventory-binding-[\w-]+$/.test(basename(root)) ||
      stats.isSymbolicLink() || !stats.isDirectory() || stats.dev !== identity.dev || stats.ino !== identity.ino) {
      throw new Error('Unowned test fixture; preserving it.')
    }
    await unlink(join(root, 'hero.png'))
    await rmdir(root)
  })

  async function fixture(references = [ref()]) {
    const inventory = await inspectLegacyMediaInventory({ root, references })
    const plan = createMigrationPlan({ sourceInventoryHash: inventory.hash,
      references: references.map(({ kind, documentId, referenceId, files }) => ({ kind, documentId, referenceId, variants: files.map(x => x.variant) })),
      evidence: references.flatMap(({ kind, documentId, referenceId, files, storageRevision }) => files.map(file => ({
        kind, documentId, referenceId, variant: file.variant, filename: file.filename!, bytes: file.expectedBytes ?? 3,
        sha256: sha('old'), revision: storageRevision ?? revision, evidenceHash: '2'.repeat(64),
      }))),
    })
    return { inventory, plan }
  }
  const rebuild = (plan: MigrationPlan) => createMigrationPlan({ sourceInventoryHash: plan.sourceInventoryHash,
    references: plan.references, evidence: plan.evidence })

  it('covers current, draft, trashed, historical and captured references without permission', async () => {
    const { inventory, plan } = await fixture([
      ref(), ref({ kind: 'draft', state: 'draft' }), ref({ documentId: '2', referenceId: '2', state: 'trashed' }),
      ref({ kind: 'version', referenceId: '7' }), ref({ kind: 'snapshot', referenceId: '8', state: 'unknown' }),
    ])
    const serialized = JSON.stringify(inventory)
    const result = bindMigrationPlanInventory(JSON.stringify(plan), serialized, inventory.hash)
    expect(result).toEqual({ schemaVersion: 1, status: 'inventory-matched', canApply: false,
      planDigest: plan.digest, inventoryHash: inventory.hash, referenceCount: 5, variantCount: 5 })
    expect(JSON.stringify(inventory)).toBe(serialized)
    expect(inventory.migrationReady).toBe(false)
  })

  it('accepts JSON object key order/whitespace changes without losing the original inventory hash', async () => {
    const { inventory, plan } = await fixture()
    const reordered = Object.fromEntries(Object.entries(inventory).reverse())
    expect(bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(reordered, null, 2), inventory.hash))
      .toMatchObject({ inventoryHash: inventory.hash, canApply: false })
  })

  it.each(['document', 'draft', 'version', 'snapshot'] as const)('rejects an omitted %s reference even when the candidate digest is valid', async kind => {
    const { inventory, plan } = await fixture([ref(), ref({ kind, documentId: 'other', referenceId: 'history' })])
    plan.references = plan.references.filter(x => x.documentId !== 'other')
    plan.evidence = plan.evidence.filter(x => x.documentId !== 'other')
    expect(() => bindMigrationPlanInventory(JSON.stringify(rebuild(plan)), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-coverage-mismatch' }))
  })

  it('rejects a candidate-only extra reference', async () => {
    const { inventory, plan } = await fixture()
    plan.references.push({ ...plan.references[0], referenceId: 'extra' })
    plan.evidence.push({ ...plan.evidence[0], referenceId: 'extra' })
    expect(() => bindMigrationPlanInventory(JSON.stringify(rebuild(plan)), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-coverage-mismatch' }))
  })

  it('rejects a derivative omitted from an otherwise complete candidate', async () => {
    const { inventory, plan } = await fixture([ref({ files: [
      { variant: 'original', filename: 'hero.png', expectedBytes: 3 },
      { variant: 'thumbnail', filename: 'small.png', expectedBytes: 3 },
    ] })])
    plan.references[0].variants = ['original']
    plan.evidence = plan.evidence.filter(x => x.variant === 'original')
    expect(() => bindMigrationPlanInventory(JSON.stringify(rebuild(plan)), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-coverage-mismatch' }))
  })

  it.each(['filename', 'bytes', 'revision'] as const)('rejects mismatched source %s even with complete reference coverage', async field => {
    const { inventory, plan } = await fixture([ref({ storageRevision: revision })])
    if (field === 'filename') plan.evidence[0].filename = 'other.png'
    if (field === 'bytes') plan.evidence[0].bytes = 4
    if (field === 'revision') plan.evidence[0].revision = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    expect(() => bindMigrationPlanInventory(JSON.stringify(rebuild(plan)), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-metadata-mismatch' }))
  })

  it('does not invent an expected size or authenticity for historical references without it', async () => {
    const { inventory, plan } = await fixture([ref({ kind: 'snapshot', files: [{ variant: 'original', filename: 'hero.png' }] })])
    expect(bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(inventory), inventory.hash))
      .toMatchObject({ status: 'inventory-matched', canApply: false, referenceCount: 1 })
    expect(inventory.references[0].status).toBe('historical-unverified')
  })

  it('rejects changed artifact content with an unchanged declared hash', async () => {
    const { inventory, plan } = await fixture()
    inventory.references[0].state = 'trashed'
    expect(() => bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-integrity-mismatch' }))
  })

  it('rejects a newer valid inventory if the trusted pin belongs to the older one', async () => {
    const older = await fixture()
    const newer = await fixture([ref({ state: 'trashed' })])
    expect(() => bindMigrationPlanInventory(JSON.stringify(newer.plan), JSON.stringify(newer.inventory), older.inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-integrity-mismatch' }))
  })

  it('rejects a candidate pointing to another inventory hash', async () => {
    const { inventory, plan } = await fixture()
    plan.sourceInventoryHash = 'f'.repeat(64)
    expect(() => bindMigrationPlanInventory(JSON.stringify(rebuild(plan)), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-integrity-mismatch' }))
  })

  it('revalidates the candidate rather than trusting its digest', async () => {
    const { inventory, plan } = await fixture()
    plan.canApply = true as never
    expect(() => bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'candidate-invalid' }))
  })

  it('does not bind an empty blocked candidate as successful', async () => {
    const { inventory, plan } = await fixture([])
    expect(() => bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(inventory), inventory.hash))
      .toThrow(expect.objectContaining({ code: 'candidate-blocked' }))
  })

  it.each(['', '{', '[]', ' '.repeat(8 * 1024 * 1024 + 1)])('rejects malformed or oversized inventory input (%#)', async serialized => {
    const { inventory, plan } = await fixture()
    expect(() => bindMigrationPlanInventory(JSON.stringify(plan), serialized, inventory.hash))
      .toThrow(expect.objectContaining({ code: 'inventory-invalid' }))
  })

  it.each(['bad', 'F'.repeat(64), ''])('requires a well-formed external pin (%#)', async pin => {
    const { inventory, plan } = await fixture()
    expect(() => bindMigrationPlanInventory(JSON.stringify(plan), JSON.stringify(inventory), pin))
      .toThrow(expect.objectContaining({ code: 'inventory-integrity-mismatch' }))
  })
})
