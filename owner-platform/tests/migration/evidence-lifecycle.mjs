import assert from 'node:assert/strict'
import { lstat, realpath, rm, stat } from 'node:fs/promises'
import path from 'node:path'

const assertExactSqliteRoot = async (cache, root) => {
  const resolved = path.resolve(root)
  const exactChild = path.dirname(resolved) === path.resolve(cache) && /^owner-media-migration-[A-Za-z0-9]+$/.test(path.basename(resolved))
  assert(exactChild, 'Unsafe SQLite media migration cleanup path.')
  assert((await lstat(resolved)).isDirectory(), 'Unsafe SQLite media migration evidence root.')
  assert.equal(await realpath(resolved), path.join(await realpath(cache), path.basename(resolved)), 'Unsafe SQLite media migration evidence link.')
  return resolved
}

/**
 * @param {{ cache: string, childrenClosed?: boolean, failure?: unknown, root: string }} options
 */
export const finalizeSqliteEvidence = async ({ cache, childrenClosed, failure = undefined, root }) => {
  const resolved = await assertExactSqliteRoot(cache, root)
  assert(childrenClosed, `Synthetic migration evidence retained because worker closure was not proved: ${root}`)
  if (failure) return { retained: true, root: resolved }
  await rm(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  await assert.rejects(stat(resolved), { code: 'ENOENT' })
  return { retained: false, root: resolved }
}
