import { describe, expect, it, vi } from 'vitest'
import { createPreviewManifest } from '../preview/manifest'
import { loadOwnerAssistanceReview } from './review'

const owner = { id: 1, collection: 'users', role: 'owner' }
const manifest = createPreviewManifest({
  source: { collection: 'pages', documentId: '7', versionId: 'current:saved' },
  brandTokens: { colors: [{ role: 'accent', value: '#FF4B44' }], usageWeights: [{ role: 'accent', weight: 100 }], motion: { duration: 600 } },
  pageBlocks: [{ id: 'hero', blockType: 'hero', heading: 'Antes' }, { id: 'photo', blockType: 'media', placement: '14', caption: '' }],
  mediaReferences: [],
})
const fixture = (capability: string, operations: unknown[]) => {
  const proposal = { id: 31, targetPage: 7, sourceSnapshot: 12, capability, patch: { schemaVersion: 1, capability, operations } }
  const snapshot = { id: 12, manifest, manifestHash: manifest.hash }
  const findByID = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === 'assistance-proposals') return proposal
    if (collection === 'preview-snapshots') return snapshot
    throw new Error('Review must not read live page or media state')
  })
  return { proposal, snapshot, payload: { findByID }, req: { user: owner }, proposalId: '31' }
}

describe('read-only assistance comparison', () => {
  it('compares a saved title without consulting the live page, including repeated operations', async () => {
    const input = fixture('suggestCopy', [
      { op: 'replace', path: '/page/title', value: 'Intermedio' },
      { op: 'replace', path: '/page/title', value: 'Final' },
    ])
    const captured = createPreviewManifest({ ...manifest, pageTitle: 'Título guardado' } as never)
    input.snapshot.manifest = captured
    input.snapshot.manifestHash = captured.hash
    const review = await loadOwnerAssistanceReview(input)
    expect(review.changes.map(({ before, proposed }) => [before.text, proposed.text])).toEqual([
      ['Título guardado', 'Intermedio'], ['Intermedio', 'Final'],
    ])
    expect(review.changes[0].before.state).toBe('captured')
  })

  it('compares captured text in order without changing the proposal or snapshot', async () => {
    const input = fixture('suggestCopy', [
      { op: 'replace', path: '/page/layout/0/heading', value: 'Intermedio' },
      { op: 'remove', path: '/page/layout/0/heading' },
      { op: 'add', path: '/page/layout/0/heading', value: 'Final' },
    ])
    const saved = JSON.stringify([input.proposal, input.snapshot])
    const review = await loadOwnerAssistanceReview(input)
    expect(review).toMatchObject({ proposalId: '31', snapshotHash: manifest.hash, appliesChanges: false })
    expect(review.changes.map(({ before, proposed }) => [before, proposed])).toEqual([
      [{ state: 'captured', text: 'Antes' }, { state: 'captured', text: 'Intermedio' }],
      [{ state: 'captured', text: 'Intermedio' }, { state: 'removed', text: 'Campo eliminado' }],
      [{ state: 'removed', text: 'Campo eliminado' }, { state: 'captured', text: 'Final' }],
    ])
    expect(JSON.stringify([input.proposal, input.snapshot])).toBe(saved)
    expect(input.payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'preview-snapshots', id: 12, overrideAccess: false, depth: 0, req: input.req }))
  })

  it.each([
    ['suggestCopy', '/page/title', 'Nuevo título'],
    ['suggestCrop', '/media-placements/14/placement/zoom', 2],
  ])('does not invent an uncaptured baseline for %s', async (capability, path, value) => {
    const review = await loadOwnerAssistanceReview(fixture(capability, [{ op: 'replace', path, value }]))
    expect(review.changes[0].before).toEqual({ state: 'not-captured', text: 'No guardado en esta versión' })
    expect(review.changes[0].proposed).toEqual({ state: 'captured', text: String(value) })
  })

  it.each([
    ['suggestMotion', '/brand/motion/duration', 800, '600'],
    ['suggestPalette', '/brand/colors/0/value', '#FFFFFF', '#FF4B44'],
    ['suggestPalette', '/brand/usageWeights/0/weight', 100, '100'],
    ['suggestCopy', '/page/layout/1/caption', 'Pie', 'Texto vacío'],
  ])('compares %s using the frozen version', async (capability, path, value, before) => {
    const review = await loadOwnerAssistanceReview(fixture(capability, [{ op: 'replace', path, value }]))
    expect(review.changes[0]).toMatchObject({ path, before: { state: 'captured', text: before }, proposed: { text: String(value) } })
  })

  it('describes a block reorder without exposing the entire block JSON', async () => {
    const review = await loadOwnerAssistanceReview(fixture('suggestLayout', [{ op: 'replace', path: '/page/layout', value: [...manifest.pageBlocks].reverse() }]))
    expect(review.changes[0].before.text).toBe('1. hero [hero] — Antes\n2. media [photo]')
    expect(review.changes[0].proposed.text).toBe('1. media [photo]\n2. hero [hero] — Antes')
  })

  it('rejects anonymous access before any database reads', async () => {
    const input = fixture('suggestMotion', [{ op: 'replace', path: '/brand/motion/duration', value: 800 }])
    await expect(loadOwnerAssistanceReview({ ...input, req: { user: null } })).rejects.toThrow(/owner/i)
    expect(input.payload.findByID).not.toHaveBeenCalled()
  })

  it.each(['proposal-id', 'snapshot-id', 'page-id', 'hash', 'capability', 'path'])('rejects inconsistent %s rather than displaying a misleading comparison', async (fault) => {
    const input = fixture('suggestMotion', [{ op: 'replace', path: '/brand/motion/duration', value: 800 }])
    if (fault === 'proposal-id') input.proposal.id = 99
    if (fault === 'snapshot-id') input.snapshot.id = 99
    if (fault === 'page-id') input.proposal.targetPage = 99
    if (fault === 'hash') input.snapshot.manifestHash = 'sha256:forged'
    if (fault === 'capability') input.proposal.capability = 'suggestCopy'
    if (fault === 'path') input.proposal.patch.operations = [{ op: 'replace', path: '/users/1/role', value: 'owner' }]
    await expect(loadOwnerAssistanceReview(input)).rejects.toThrow()
  })
})
