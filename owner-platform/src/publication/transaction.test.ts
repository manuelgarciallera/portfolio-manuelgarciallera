import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('payload', async (importOriginal) => ({
  ...await importOriginal<typeof import('payload')>(),
  initTransaction: vi.fn(), commitTransaction: vi.fn(), killTransaction: vi.fn(),
}))
import { commitTransaction, initTransaction, killTransaction } from 'payload'
import { withPublicationTransaction } from './transaction'

describe('publication transaction ownership', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(initTransaction).mockResolvedValue(true)
    vi.mocked(commitTransaction).mockResolvedValue(undefined)
    vi.mocked(killTransaction).mockResolvedValue(undefined)
  })

  it('commits only after the complete operation using the same request', async () => {
    const req = { user: { id: 1 } }
    const operation = vi.fn(async () => {
      expect(commitTransaction).not.toHaveBeenCalled()
      return { id: 2 }
    })
    await expect(withPublicationTransaction(req, operation)).resolves.toEqual({ id: 2 })
    expect(initTransaction).toHaveBeenCalledWith(req)
    expect(commitTransaction).toHaveBeenCalledWith(req)
    expect(killTransaction).not.toHaveBeenCalled()
  })

  it('never executes or closes a transaction it cannot own', async () => {
    vi.mocked(initTransaction).mockResolvedValue(false)
    const operation = vi.fn()
    await expect(withPublicationTransaction({}, operation)).rejects.toMatchObject({ status: 503 })
    expect(operation).not.toHaveBeenCalled()
    expect(commitTransaction).not.toHaveBeenCalled()
    expect(killTransaction).not.toHaveBeenCalled()
  })

  it('preserves the original failure even if rollback also fails', async () => {
    const failure = new Error('audit unavailable')
    vi.mocked(killTransaction).mockRejectedValue(new Error('rollback unavailable'))
    await expect(withPublicationTransaction({}, async () => { throw failure })).rejects.toBe(failure)
    expect(killTransaction).toHaveBeenCalledTimes(1)
    expect(commitTransaction).not.toHaveBeenCalled()
  })

  it('does not return a result when committing fails', async () => {
    const failure = new Error('commit unavailable')
    vi.mocked(commitTransaction).mockRejectedValue(failure)
    await expect(withPublicationTransaction({}, async () => ({ id: 2 }))).rejects.toBe(failure)
    expect(killTransaction).toHaveBeenCalledTimes(1)
  })
})
