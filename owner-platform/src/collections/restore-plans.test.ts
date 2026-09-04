import { describe, expect, it } from 'vitest'

import { enforceRestorePlanDelete, prepareRestorePlan, RestorePlans } from './RestorePlans'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const base = {
  baselineHash: `sha256:${'a'.repeat(64)}`,
  baselineSnapshot: 12,
  confirmation: 'PREPARAR RESTAURACIÓN',
  release: 44,
  targetHash: `sha256:${'b'.repeat(64)}`,
  targetPage: 7,
  targetSnapshot: 10,
}

describe('RestorePlans collection', () => {
  it('is owner-readable while direct creation, mutation and deletion remain closed', () => {
    expect(RestorePlans.slug).toBe('restore-plans')
    expect(RestorePlans.access?.read?.(accessArgs(owner))).toBe(true)
    expect(RestorePlans.access?.read?.(accessArgs(null))).toBe(false)
    expect(RestorePlans.access?.create?.(accessArgs(owner))).toBe(false)
    expect(RestorePlans.access?.update?.(accessArgs(owner))).toBe(false)
    expect(RestorePlans.access?.delete?.(accessArgs(owner))).toBe(false)
  })

  it('normalizes trusted creation and permits only the one confirmation transition', async () => {
    await expect(prepareRestorePlan({ data: base, operation: 'create', req: { user: owner } } as never)).resolves.toMatchObject({
      createdBy: 1,
      status: 'ready',
    })
    await expect(prepareRestorePlan({
      data: {
        confirmedAt: '2026-09-04T23:00:00.000Z',
        confirmedBy: 1,
        confirmationSnapshot: 13,
        status: 'confirmed',
      },
      operation: 'update',
      originalDoc: { baselineHash: base.baselineHash, status: 'ready' },
      req: { user: owner },
    } as never)).resolves.toMatchObject({ status: 'confirmed' })
    await expect(prepareRestorePlan({ data: { status: 'confirmed', targetPage: 9 }, operation: 'update', req: { user: owner } } as never)).rejects.toThrow(/modific|confirmación/i)
  })

  it('forbids anonymous writes and deletion', async () => {
    await expect(prepareRestorePlan({ data: base, operation: 'create', req: { user: null } } as never)).rejects.toThrow(/owner/i)
    await expect(enforceRestorePlanDelete({} as never)).rejects.toThrow(/eliminar|inmutable/i)
  })
})
