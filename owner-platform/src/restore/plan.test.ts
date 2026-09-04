import { describe, expect, it } from 'vitest'

import { confirmRestorePlanData, createRestorePlanData } from './plan'

const owner = { id: 1 }
const input = {
  baselineHash: `sha256:${'a'.repeat(64)}`,
  baselineSnapshot: 12,
  confirmation: 'PREPARAR RESTAURACIÓN',
  release: 44,
  targetHash: `sha256:${'b'.repeat(64)}`,
  targetCapsuleHash: `sha256:${'d'.repeat(64)}`,
  targetDraftSnapshot: 11,
  targetPage: 7,
  targetSnapshot: 10,
}

describe('restore plan contract', () => {
  it('creates a ready plan only after the first explicit confirmation', () => {
    expect(createRestorePlanData(input, owner)).toEqual({
      baselineHash: input.baselineHash,
      baselineSnapshot: 12,
      createdBy: 1,
      release: 44,
      status: 'ready',
      targetHash: input.targetHash,
      targetCapsuleHash: input.targetCapsuleHash,
      targetDraftSnapshot: 11,
      targetPage: 7,
      targetSnapshot: 10,
    })
    expect(() => createRestorePlanData({ ...input, confirmation: 'sí' }, owner)).toThrow(/confirmación/i)
    expect(() => createRestorePlanData({ ...input, deploy: true }, owner)).toThrow(/campo|permitido/i)
  })

  it('confirms only when a fresh snapshot still matches the baseline hash', () => {
    expect(confirmRestorePlanData(
      { baselineHash: input.baselineHash, status: 'ready' },
      { confirmation: 'CONFIRMAR RESTAURACIÓN', currentHash: input.baselineHash, currentSnapshot: 13 },
      owner,
      '2026-09-04T23:00:00.000Z',
    )).toEqual({
      confirmedAt: '2026-09-04T23:00:00.000Z',
      confirmedBy: 1,
      confirmationSnapshot: 13,
      status: 'confirmed',
    })
  })

  it('records a conflict instead of confirming when the page changed', () => {
    expect(confirmRestorePlanData(
      { baselineHash: input.baselineHash, status: 'ready' },
      { confirmation: 'CONFIRMAR RESTAURACIÓN', currentHash: `sha256:${'c'.repeat(64)}`, currentSnapshot: 14 },
      owner,
      '2026-09-04T23:00:00.000Z',
    )).toEqual({
      confirmedAt: '2026-09-04T23:00:00.000Z',
      confirmedBy: 1,
      conflictHash: `sha256:${'c'.repeat(64)}`,
      confirmationSnapshot: 14,
      status: 'conflict',
    })
  })

  it('rejects repeated decisions and malformed confirmation input', () => {
    expect(() => confirmRestorePlanData(
      { baselineHash: input.baselineHash, status: 'confirmed' },
      { confirmation: 'CONFIRMAR RESTAURACIÓN', currentHash: input.baselineHash, currentSnapshot: 13 },
      owner,
    )).toThrow(/preparado|ready/i)
    expect(() => confirmRestorePlanData(
      { baselineHash: input.baselineHash, status: 'ready' },
      { confirmation: 'restaurar', currentHash: input.baselineHash, currentSnapshot: 13 },
      owner,
    )).toThrow(/confirmación/i)
  })
})
