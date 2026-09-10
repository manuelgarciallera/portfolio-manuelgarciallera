import { APIError, commitTransaction, initTransaction, killTransaction } from 'payload'

// Only immutable publication records and their audit event belong here.
// Do not commit an enclosing request's unrelated writes or external effects.
export const withPublicationTransaction = async <T>(req: { user?: unknown }, operation: () => Promise<T>): Promise<T> => {
  if (!await initTransaction(req as never)) throw new APIError('No se pudo abrir una transacción exclusiva de publicación.', 503)
  try {
    const result = await operation()
    await commitTransaction(req as never)
    return result
  } catch (error) {
    try { await killTransaction(req as never) } catch { /* Preserve the operation failure. */ }
    throw error
  }
}
