import { describe, expect, it } from 'vitest'
import { withVerifiedTransactions } from './verified-transactions'

// A deterministic database boundary. The real PostgreSQL deferred-constraint
// regression lives in editorial.integration.test.ts; no Payload functions mocked.
const fixture = (failure?: 'begin' | 'commit' | 'rollback') => {
  let persisted = false
  const fault = new Error(`database ${failure} failed`)
  const db = {
    initializing: Promise.resolve(), transactionOptions: {}, sessions: {},
    beginTransaction: async () => null as string | null,
    commitTransaction: async (id?: string | number | Promise<string | number>) => { void id },
    rollbackTransaction: async (id?: string | number | Promise<string | number>) => { void id },
    drizzle: { transaction: async (operation: (tx: object) => Promise<void>) => {
      if (failure === 'begin') throw fault
      try { await operation({}) } catch (error) {
        if (failure === 'rollback') throw fault
        throw error
      }
      if (failure === 'commit') throw fault
      persisted = true
    } },
  }
  const adapter = withVerifiedTransactions({ init: () => db }).init()
  return { adapter, fault, persisted: () => persisted }
}

describe('verified transaction outcomes', () => {
  it('rejects a failed database commit instead of returning success', async () => {
    const { adapter, fault, persisted } = fixture('commit')
    const id = await adapter.beginTransaction()
    await expect(adapter.commitTransaction(id!)).rejects.toBe(fault)
    expect(persisted()).toBe(false)
    expect(Object.keys(adapter.sessions)).toHaveLength(0)
  })
  it('reports a successful commit only after database completion', async () => {
    const { adapter, persisted } = fixture()
    const id = await adapter.beginTransaction()
    expect(persisted()).toBe(false)
    await adapter.commitTransaction(id!)
    expect(persisted()).toBe(true)
    expect(Object.keys(adapter.sessions)).toHaveLength(0)
  })
  it('rejects an opening failure without hanging or registering a session', async () => {
    const { adapter, fault } = fixture('begin')
    await expect(adapter.beginTransaction()).rejects.toBe(fault)
    expect(Object.keys(adapter.sessions)).toHaveLength(0)
  })
  it('rolls back without treating intentional abort as a database failure', async () => {
    const { adapter, persisted } = fixture()
    const id = await adapter.beginTransaction()
    await adapter.rollbackTransaction(id!)
    expect(persisted()).toBe(false)
    expect(Object.keys(adapter.sessions)).toHaveLength(0)
  })
  it('does not swallow failure to roll back', async () => {
    const { adapter, fault } = fixture('rollback')
    const id = await adapter.beginTransaction()
    await expect(adapter.rollbackTransaction(id!)).rejects.toBe(fault)
    expect(Object.keys(adapter.sessions)).toHaveLength(0)
  })
})
