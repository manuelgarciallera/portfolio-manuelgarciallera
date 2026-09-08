import { describe, expect, it } from 'vitest'

import { assertLiveAdapterSession, runDedicatedAdapterTransaction } from './transaction'

const adapter = () => {
  const committed: string[] = []
  const sessions: Record<string, { pending: string[] }> = {}
  let sequence = 0
  return {
    committed,
    sessions,
    async beginTransaction() {
      const id = `synthetic-${++sequence}`
      sessions[id] = { pending: [...committed] }
      return id
    },
    async commitTransaction(id: string | number | Promise<string | number>) {
      const key = String(await id)
      const session = sessions[key]
      if (!session) return
      committed.splice(0, committed.length, ...session.pending)
      delete sessions[key]
    },
    async rollbackTransaction(id: string | number | Promise<string | number>) {
      delete sessions[String(await id)]
    },
  }
}

describe('dedicated migration transaction', () => {
  it('commits writes made only while its adapter session is live', async () => {
    const db = adapter()
    const req: { transactionID?: string | number | Promise<string | number> } = {}

    await runDedicatedAdapterTransaction({ db, req, execute: async ({ write }) => {
      await write(() => {
        db.sessions[String(req.transactionID)].pending.push('current B')
      })
      await write(() => {
        db.sessions[String(req.transactionID)].pending.push('version A')
      })
    } })

    expect(db.committed).toEqual(['current B', 'version A'])
    expect(req.transactionID).toBeUndefined()
    expect(db.sessions).toEqual({})
  })

  it('rolls back partial rows when the migration throws', async () => {
    const db = adapter()
    db.committed.push('legacy')
    const req: { transactionID?: string | number | Promise<string | number> } = {}

    await expect(runDedicatedAdapterTransaction({ db, req, execute: async ({ write }) => {
      await write(() => {
        db.sessions[String(req.transactionID)].pending.push('partial')
      })
      throw new Error('injected after partial patch')
    } })).rejects.toThrow('injected after partial patch')

    expect(db.committed).toEqual(['legacy'])
    expect(req.transactionID).toBeUndefined()
    expect(db.sessions).toEqual({})
  })

  it('rejects a stale request before invoking its write', async () => {
    const db = adapter()
    const transactionID = await db.beginTransaction()
    const req = { transactionID }
    await db.commitTransaction(transactionID)
    let wrote = false

    await expect(assertLiveAdapterSession(db, req, () => {
      wrote = true
    })).rejects.toThrow(/session is not live/i)

    expect(wrote).toBe(false)
    expect(db.committed).toEqual([])
  })
})
