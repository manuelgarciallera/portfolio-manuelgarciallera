type TransactionID = number | Promise<number | string> | string

type AdapterSession = {
  db: unknown
  reject: () => Promise<void>
  resolve: () => Promise<void>
}

type TransactionAdapter = {
  beginTransaction: () => Promise<null | number | string>
  commitTransaction: (id: TransactionID) => Promise<void>
  rollbackTransaction: (id: TransactionID) => Promise<void>
  sessions?: Record<string, AdapterSession | unknown>
}

type TransactionRequest = { transactionID?: TransactionID }

const liveID = async (db: TransactionAdapter, req: TransactionRequest) => {
  const transactionID = await req.transactionID
  if ((typeof transactionID !== 'number' && typeof transactionID !== 'string') || !db.sessions?.[String(transactionID)]) {
    throw new Error('Migration adapter session is not live.')
  }
  return transactionID
}

export const assertLiveAdapterSession = async <T>(
  db: TransactionAdapter,
  req: TransactionRequest,
  write: () => T | Promise<T>,
): Promise<T> => {
  await liveID(db, req)
  return write()
}

export const runDedicatedAdapterTransaction = async <T>({
  db,
  execute,
  req,
}: {
  db: TransactionAdapter
  execute: (tools: { write: <R>(operation: () => R | Promise<R>) => Promise<R> }) => T | Promise<T>
  req: TransactionRequest
}): Promise<T> => {
  if (req.transactionID !== undefined && req.transactionID !== null) {
    throw new Error('Migration request already owns a transaction.')
  }
  const transactionID = await db.beginTransaction()
  if ((typeof transactionID !== 'number' && typeof transactionID !== 'string') || !db.sessions?.[String(transactionID)]) {
    throw new Error('Migration could not establish a live adapter session.')
  }
  req.transactionID = transactionID
  try {
    const result = await execute({ write: (operation) => assertLiveAdapterSession(db, req, operation) })
    await liveID(db, req)
    await db.commitTransaction(transactionID)
    return result
  } catch (error) {
    if (db.sessions?.[String(transactionID)]) await db.rollbackTransaction(transactionID)
    throw error
  } finally {
    delete req.transactionID
  }
}
