import { describe, expect, it, vi } from 'vitest'

import { reviewFigmaImportPlan } from './import-review-client'

describe('Figma import review client', () => {
  it('submits a confirmed decision and returns the immutable review destination', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ review: { id: 50, decision: 'approved' } }), { status: 201 }))
    await expect(reviewFigmaImportPlan(44, { confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: ' Revisado. ' }, request)).resolves.toEqual({ decision: 'approved', href: '/admin/collections/figma-import-reviews/50' })
    expect(request).toHaveBeenCalledWith('/api/owner/figma/import-plans/44/review', expect.objectContaining({ body: JSON.stringify({ confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: 'Revisado.' }), method: 'POST' }))
  })

  it('rejects unsafe IDs and confirmation mismatches before transport', async () => {
    const request = vi.fn()
    await expect(reviewFigmaImportPlan('../users', { confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved' }, request)).rejects.toThrow(/identificador/i)
    await expect(reviewFigmaImportPlan(44, { confirmation: 'RECHAZAR IMPORTACIÓN FIGMA', decision: 'approved' }, request)).rejects.toThrow(/APROBAR/i)
    expect(request).not.toHaveBeenCalled()
  })
})
