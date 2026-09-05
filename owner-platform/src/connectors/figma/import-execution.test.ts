import { describe, expect, it } from 'vitest'

import { createFigmaImportExecution, hashFigmaImportExecution } from './import-execution'

const input = {
  contentHash: `sha256:${'a'.repeat(64)}`,
  importedAt: '2026-09-05T07:30:00.000Z',
  importedBy: 1,
  mediaId: 72,
  mimeType: 'image/png' as const,
  planHash: `sha256:${'b'.repeat(64)}`,
  planId: 44,
  placementId: 71,
  reviewHash: `sha256:${'c'.repeat(64)}`,
  reviewId: 45,
  size: 2048,
}

describe('Figma import execution evidence', () => {
  it('creates deterministic immutable evidence bound to review, plan, media, and bytes', () => {
    const execution = createFigmaImportExecution(input)
    expect(execution).toMatchObject({ ...input, schemaVersion: 1 })
    expect(execution.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashFigmaImportExecution(execution)).toBe(execution.hash)
    expect(Object.isFrozen(execution)).toBe(true)
  })

  it('rejects malformed, oversized, or tampered evidence', () => {
    expect(() => createFigmaImportExecution({ ...input, mimeType: 'image/svg+xml' as never })).toThrow(/PNG/i)
    expect(() => createFigmaImportExecution({ ...input, size: 0 })).toThrow(/tamaño/i)
    expect(() => createFigmaImportExecution({ ...input, size: 26 * 1024 * 1024 })).toThrow(/tamaño/i)
    expect(() => createFigmaImportExecution({ ...input, importedAt: 'today' })).toThrow(/fecha/i)
    const execution = createFigmaImportExecution(input)
    expect(() => hashFigmaImportExecution({ ...execution, mediaId: 73 })).toThrow(/hash/i)
    expect(() => hashFigmaImportExecution({ ...execution, placementId: 74 })).toThrow(/hash/i)
  })
})
