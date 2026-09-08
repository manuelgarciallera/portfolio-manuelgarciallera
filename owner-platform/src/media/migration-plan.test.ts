import { describe, expect, it } from 'vitest'
import { createMigrationPlan, readMigrationPlan } from './migration-plan'

const hashA = 'a'.repeat(64)
const hashB = 'b'.repeat(64)
const revisionA = '11111111-1111-4111-8111-111111111111'
const revisionB = '22222222-2222-4222-8222-222222222222'
const reference = (kind = 'document', referenceId = 'current') => ({
  kind, documentId: 'media-1', referenceId, variants: ['original'],
})
const evidence = (kind = 'document', referenceId = 'current') => ({
  kind, documentId: 'media-1', referenceId, variant: 'original',
  filename: 'photo.webp', bytes: 100, sha256: hashA, revision: revisionA,
  evidenceHash: hashB,
})
const fixture = () => ({
  sourceInventoryHash: hashA, references: [reference()], evidence: [evidence()],
})

describe('migration plan candidate (never execution authority)', () => {
  it('keeps complete candidates awaiting physical verification, never executable', () => {
    const plan = createMigrationPlan(fixture())
    expect(plan.status).toBe('awaiting-physical-verification')
    expect(plan.canApply).toBe(false)
    expect(plan.missing).toEqual([])
    expect(readMigrationPlan(JSON.stringify(plan))).toEqual(plan)
  })

  it('blocks missing historical evidence instead of borrowing current bytes', () => {
    const input = fixture()
    input.references.push(reference('version', 'old'))
    expect(createMigrationPlan(input)).toMatchObject({
      status: 'blocked', canApply: false,
      missing: [{ kind: 'version', documentId: 'media-1', referenceId: 'old', variant: 'original' }],
    })
  })

  it('distinguishes same filename across versions with different real bytes', () => {
    const input = fixture()
    input.references.push(reference('snapshot', 'snapshot-1'))
    input.evidence.push({ ...evidence('snapshot', 'snapshot-1'), sha256: hashB, revision: revisionB })
    expect(createMigrationPlan(input).evidence.map(item => item.sha256)).toEqual([hashA, hashB])
  })

  it('is deterministic across input ordering and leaves input unchanged', () => {
    const input = fixture()
    input.references.push(reference('version', 'old'))
    input.evidence.push(evidence('version', 'old'))
    const before = structuredClone(input)
    const first = createMigrationPlan(input)
    expect(input).toEqual(before)
    expect(createMigrationPlan({ ...input, references: [...input.references].reverse(), evidence: [...input.evidence].reverse() })).toEqual(first)
  })

  it('rejects stale digest after a byte-count change', () => {
    const plan = createMigrationPlan(fixture())
    plan.evidence[0].bytes++
    expect(() => readMigrationPlan(JSON.stringify(plan))).toThrow()
  })

  it.each(['canApply', 'status', 'missing', 'schemaVersion'])('rejects a forged %s envelope field', field => {
    const plan = { ...createMigrationPlan(fixture()), [field]: field === 'canApply' ? true : 'forged' }
    expect(() => readMigrationPlan(JSON.stringify(plan))).toThrow()
  })

  it.each([
    (x: ReturnType<typeof fixture>) => ({ ...x, approved: true }),
    (x: ReturnType<typeof fixture>) => ({ ...x, sourceInventoryHash: 'no' }),
    (x: ReturnType<typeof fixture>) => ({ ...x, references: [...x.references, x.references[0]] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [...x.evidence, x.evidence[0]] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [{ ...x.evidence[0], referenceId: 'unlisted' }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, references: [{ ...x.references[0], variants: ['original', 'original'] }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, references: [{ ...x.references[0], documentId: 'https://secret.example' }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [{ ...x.evidence[0], bytes: 0 }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [{ ...x.evidence[0], bytes: Number.MAX_SAFE_INTEGER }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [{ ...x.evidence[0], revision: 'not-a-revision' }] }),
    (x: ReturnType<typeof fixture>) => ({ ...x, evidence: [{ ...x.evidence[0], sha256: 'bad' }] }),
  ])('rejects malformed or ambiguous input %#', mutate => {
    expect(() => createMigrationPlan(mutate(fixture()))).toThrow()
  })

  it.each(['../secret', 'CON.webp', 'photo.webp ', 'manifest.json', 'a\\b.webp', '\ud800.webp', 'a\u0000.webp'])('rejects unsafe filename %s', filename => {
    const input = fixture()
    input.evidence[0].filename = filename
    expect(() => createMigrationPlan(input)).toThrow()
  })

  it('rejects conflicting bytes assigned to the same immutable revision filename', () => {
    const input = fixture()
    input.references.push(reference('version', 'old'))
    input.evidence.push({ ...evidence('version', 'old'), sha256: hashB })
    expect(() => createMigrationPlan(input)).toThrow()
  })

  it('rejects case-colliding filenames in a revision', () => {
    const input = fixture()
    input.references[0].variants.push('thumbnail')
    input.evidence.push({ ...evidence(), variant: 'thumbnail', filename: 'PHOTO.webp' })
    expect(() => createMigrationPlan(input)).toThrow()
  })

  it('counts each physical revision file once but enforces total bytes per revision', () => {
    const input = fixture()
    input.evidence[0].bytes = 64 * 1024 * 1024
    input.references.push(reference('version', 'old'))
    input.evidence.push({ ...evidence('version', 'old'), bytes: 64 * 1024 * 1024 })
    expect(createMigrationPlan(input).status).toBe('awaiting-physical-verification')
    input.references[0].variants.push('thumbnail')
    input.evidence.push({ ...evidence(), variant: 'thumbnail', filename: 'thumb.webp', bytes: 1 })
    expect(() => createMigrationPlan(input)).toThrow()
  })

  it('rejects sparse and oversized reference collections', () => {
    expect(() => createMigrationPlan({ ...fixture(), references: Array(2) })).toThrow()
    expect(() => createMigrationPlan({ ...fixture(), references: Array(10001).fill(reference()) })).toThrow()
  })

  it('blocks an empty candidate and bounds the serialized parser before parsing', () => {
    expect(createMigrationPlan({ sourceInventoryHash: hashA, references: [], evidence: [] }).status).toBe('blocked')
    expect(() => readMigrationPlan(' '.repeat(8 * 1024 * 1024 + 1))).toThrow()
  })

  it('rejects overridden array methods without invoking them', () => {
    const input = fixture()
    let invoked = false
    Object.defineProperty(input.references, 'map', { value: () => { invoked = true; return [] } })
    expect(() => createMigrationPlan(input)).toThrow()
    expect(invoked).toBe(false)
  })

  it('rejects accessor elements without invoking them', () => {
    const input = fixture()
    let invoked = false
    Object.defineProperty(input.references, '0', { get: () => { invoked = true; return reference() } })
    expect(() => createMigrationPlan(input)).toThrow()
    expect(invoked).toBe(false)
  })

  it('rejects unknown array properties rather than silently dropping them', () => {
    const input = fixture()
    Object.assign(input.evidence, { approved: true })
    expect(() => createMigrationPlan(input)).toThrow()
  })

  it('accepts equivalent key ordering inside a blocked plan missing list', () => {
    const input = fixture()
    input.evidence = []
    const plan = createMigrationPlan(input)
    const reordered = { ...plan, missing: plan.missing.map(x => ({ variant: x.variant, referenceId: x.referenceId, documentId: x.documentId, kind: x.kind })) }
    expect(readMigrationPlan(JSON.stringify(reordered))).toEqual(plan)
  })

  it.each(['image?.webp', 'image*.webp', 'image|.webp', 'image<.webp', 'image>.webp', 'image".webp'])('rejects nonportable Windows filename %s', filename => {
    const input = fixture()
    input.evidence[0].filename = filename
    expect(() => createMigrationPlan(input)).toThrow()
  })
})
