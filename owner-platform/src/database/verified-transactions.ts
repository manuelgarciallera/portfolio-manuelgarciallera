import { randomUUID } from 'node:crypto'

type Session = { db: unknown; resolve(): Promise<void>; reject(): Promise<void> }
type TransactionAdapter = {
  initializing: Promise<unknown>
  transactionOptions?: unknown
  drizzle: { transaction(operation: (tx: unknown) => Promise<void>, options?: unknown): Promise<void> }
  sessions: Record<string, Session>
  beginTransaction(options?: unknown): Promise<string>
  commitTransaction(id?: string | number | Promise<string | number>): Promise<void>
  rollbackTransaction(id?: string | number | Promise<string | number>): Promise<void>
}

// Only for our trusted Drizzle-backed adapter factories. Preserve the factory's
// types/metadata and Payload session contract; do not patch dependency modules.
// A fulfilled operation is not success until the database confirms COMMIT.
export const withVerifiedTransactions = <T extends { init: (...args: never[]) => unknown }>(factory: T): T => ({
  ...factory,
  init: (...args: never[]) => {
    const db = factory.init(...args) as TransactionAdapter
    db.beginTransaction = async (options) => {
      await db.initializing
      const id = randomUUID()
      const abort = new Error('Owner transaction intentionally rolled back')
      let ready!: (transaction: unknown) => void
      let openingFailed!: (error: unknown) => void
      let commit!: () => void
      let rollback!: (error: unknown) => void
      const opened = new Promise<unknown>((resolve, reject) => { ready = resolve; openingFailed = reject })
      const done = db.drizzle.transaction(async (transaction) => {
        const finish = new Promise<void>((resolve, reject) => { commit = resolve; rollback = reject })
        ready(transaction)
        await finish
      }, options ?? db.transactionOptions)
      // Observe early failure without replacing `done` with a fulfilled catch.
      // The original promise must still reject after a failed COMMIT.
      void done.catch(openingFailed)
      const transaction = await opened
      db.sessions[id] = {
        db: transaction,
        resolve: () => { commit(); return done },
        reject: () => { rollback(abort); return done.catch(error => { if (error !== abort) throw error }) },
      }
      return id
    }
    db.commitTransaction = async (incoming = '') => {
      const id = await incoming
      const session = db.sessions[id]
      if (!session) return
      delete db.sessions[id]
      await session.resolve()
    }
    db.rollbackTransaction = async (incoming = '') => {
      const id = await incoming
      const session = db.sessions[id]
      if (!session) return
      delete db.sessions[id]
      await session.reject()
    }
    return db
  },
})
