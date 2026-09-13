import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import { lockRecoveryToken } from './recovery-lock'

const request = (sessions: Record<string, unknown>, transactionID?: string) => ({
  transactionID,
  payload: { logger: { debug: vi.fn() }, db: { name: 'postgres', sessions, drizzle: {
    execute: () => { throw new Error('Must not use the pool outside the reset transaction') },
  } } },
}) as unknown as PayloadRequest

describe('recovery transaction admission', () => {
  it.each([undefined, 'missing'])('fails closed when transaction %s is unavailable', async id => {
    await expect(lockRecoveryToken(request({}, id), 'synthetic-token')).rejects.toMatchObject({ status: 503 })
  })

  it('rejects contention without proceeding as an admitted reset', async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [{ acquired: false }] })
    await expect(lockRecoveryToken(request({ active: { db: { execute } } }, 'active'), 'synthetic-token')).rejects.toMatchObject({ status: 403 })
  })

  it('does not treat an unexpected database result as admission', async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [] })
    await expect(lockRecoveryToken(request({ active: { db: { execute } } }, 'active'), 'synthetic-token')).rejects.toMatchObject({ status: 403 })
  })

  it('propagates transaction failure instead of continuing without a lock', async () => {
    const failure = new Error('Synthetic SQL failure')
    const execute = vi.fn().mockRejectedValue(failure)
    await expect(lockRecoveryToken(request({ active: { db: { execute } } }, 'active'), 'synthetic-token')).rejects.toBe(failure)
  })

  it('admits only an affirmative transaction result', async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [{ acquired: true }] })
    await expect(lockRecoveryToken(request({ active: { db: { execute } } }, 'active'), 'synthetic-token')).resolves.toBeUndefined()
  })

  it.each([
    [{ rows: [{ acquired: false }] }, 'contention_or_collision'],
    [{ rows: [] }, 'unexpected_result'],
  ])('diagnoses a rejected lock without recording recovery credentials: %j', async (result, reason) => {
    const execute = vi.fn().mockResolvedValue(result)
    const req = request({ active: { db: { execute } } }, 'active')
    const token = 'private-synthetic-reset-token'
    await expect(lockRecoveryToken(req, token)).rejects.toMatchObject({ status: 403 })
    expect(req.payload.logger.debug).toHaveBeenCalledWith({
      event: 'owner.auth.recovery.lock_not_acquired', reason,
    }, 'Owner recovery lock not acquired')
    expect(JSON.stringify(vi.mocked(req.payload.logger.debug).mock.calls)).not.toContain(token)
  })
})
