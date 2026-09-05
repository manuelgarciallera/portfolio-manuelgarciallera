import { describe, expect, it } from 'vitest'

import { createFigmaImportExecution } from '../connectors/figma/import-execution'
import { enforceFigmaImportExecutionDelete, FigmaImportExecutions, prepareFigmaImportExecution } from './FigmaImportExecutions'

const owner = { id: 1, collection: 'users', role: 'owner' }
const execution = createFigmaImportExecution({
  contentHash: `sha256:${'a'.repeat(64)}`, importedAt: '2026-09-05T07:30:00.000Z', importedBy: 1,
  mediaId: 72, mimeType: 'image/png', planHash: `sha256:${'b'.repeat(64)}`, planId: 44,
  reviewHash: `sha256:${'c'.repeat(64)}`, reviewId: 45, size: 2048,
})
const data = {
  contentHash: execution.contentHash, executionHash: execution.hash, importedAt: execution.importedAt,
  importedBy: 1, media: 72, mimeType: execution.mimeType, plan: 44, planHash: execution.planHash,
  review: 45, reviewHash: execution.reviewHash, schemaVersion: 1, size: execution.size,
}

describe('FigmaImportExecutions collection', () => {
  it('is immutable, owner-readable, and unique per approved review', () => {
    const access = (user: unknown) => ({ req: { user } }) as never
    expect(FigmaImportExecutions.slug).toBe('figma-import-executions')
    expect(FigmaImportExecutions.access?.read?.(access(owner))).toBe(true)
    expect(FigmaImportExecutions.access?.read?.(access(null))).toBe(false)
    expect(FigmaImportExecutions.access?.create?.(access(owner))).toBe(false)
    const review = FigmaImportExecutions.fields.find((field) => 'name' in field && field.name === 'review')
    expect(review).toMatchObject({ relationTo: 'figma-import-reviews', unique: true })
  })

  it('accepts only canonical evidence owned by the actor', async () => {
    await expect(prepareFigmaImportExecution({ data, operation: 'create', req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareFigmaImportExecution({ data: { ...data, size: 2049 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/hash|importación/i)
    await expect(prepareFigmaImportExecution({ data: { ...data, importedBy: 2 }, operation: 'create', req: { user: owner } } as never)).rejects.toThrow(/procedencia|owner/i)
  })

  it('rejects updates, deletes, and anonymous creation', async () => {
    await expect(prepareFigmaImportExecution({ data, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/inmutable/i)
    await expect(prepareFigmaImportExecution({ data, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforceFigmaImportExecutionDelete({} as never)).rejects.toThrow(/inmutable/i)
  })
})
