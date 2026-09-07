import { NotFound } from 'payload'

export const expectAnonymousDraftNotFound = async (readDraft) => {
  try {
    await readDraft()
  } catch (error) {
    if (error instanceof NotFound && error.status === 404) return
    throw error
  }
  throw new Error('Anonymous access unexpectedly returned a draft page.')
}
