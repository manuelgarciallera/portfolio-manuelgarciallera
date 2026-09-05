import { describe, expect, it, vi } from 'vitest'
import { loadAssistanceReview } from './review-client'

const review = { proposalId: '31', snapshotHash: `sha256:${'a'.repeat(64)}`, appliesChanges: false, changes: [{ path: '/brand/motion/duration', label: 'Duración (ms)', operation: 'replace', before: { state: 'captured', text: '600' }, proposed: { state: 'captured', text: '800' } }] }
describe('assistance comparison client', () => {
  it('loads a private read-only comparison for the requested proposal', async () => {
    const request = vi.fn(async () => Response.json({ review }))
    expect(await loadAssistanceReview(31, request)).toEqual(review)
    expect(request).toHaveBeenCalledWith('/api/owner/assist/proposals/31', { credentials: 'same-origin', cache: 'no-store' })
  })
  it.each([
    { ...review, proposalId: 'wrong' }, { ...review, appliesChanges: true }, { ...review, snapshotHash: 'forged' },
    { ...review, changes: [] }, { ...review, changes: Array(33).fill(review.changes[0]) },
    { ...review, changes: [{ ...review.changes[0], before: { state: 'invented', text: '600' } }] },
    { ...review, changes: [{ ...review.changes[0], proposed: { state: 'captured', text: {} } }] },
  ])('refuses malformed or unrelated comparisons', async (invalid) => {
    await expect(loadAssistanceReview(31, async () => Response.json({ review: invalid }))).rejects.toThrow(/comparación/i)
  })
  it('rejects invalid IDs before transport and reports failed authentication generically', async () => {
    const request = vi.fn()
    await expect(loadAssistanceReview('../users', request)).rejects.toThrow()
    expect(request).not.toHaveBeenCalled()
    await expect(loadAssistanceReview(31, async () => new Response('private error', { status: 403 }))).rejects.toThrow(/comparación/i)
  })
})
