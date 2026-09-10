import { randomUUID } from 'node:crypto'
import { lstat, open, realpath } from 'node:fs/promises'
import path from 'node:path'

type Metadata = { planDigest: string; inventoryHash: string; destinationId: string; revisions: string[] }
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/
const fail = () => new Error('Invalid, unavailable or interrupted migration journal; reconcile before further writes.')
const same = (a: string, b: string) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b
function metadata(value: Metadata): Metadata {
  if (!value || typeof value.planDigest !== 'string' || typeof value.inventoryHash !== 'string' ||
    typeof value.destinationId !== 'string' || !/^[a-f0-9]{64}$/.test(value.planDigest) || !/^[a-f0-9]{64}$/.test(value.inventoryHash) ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(value.destinationId) || !Array.isArray(value.revisions) ||
    !value.revisions.length || value.revisions.length > 10000 || Array.from(value.revisions).some(id => typeof id !== 'string' || !uuid.test(id)) ||
    new Set(value.revisions).size !== value.revisions.length) throw fail()
  return { planDigest: value.planDigest, inventoryHash: value.inventoryHash, destinationId: value.destinationId, revisions: [...value.revisions] }
}
async function filename(root: string, id: string) {
  if (!path.isAbsolute(root) || !uuid.test(id) || same(path.resolve(root), path.parse(root).root)) throw fail()
  const stats = await lstat(root)
  if (stats.isSymbolicLink() || !stats.isDirectory() || !same(await realpath(root), path.resolve(root))) throw fail()
  return path.join(root, `${id}.jsonl`)
}

/** Private single-writer local journal. File data is synced before acknowledgement.
 * Caller provides durable storage, effective ACLs and process lifetime management.
 * No claim of power-loss durability for directory entries or remote filesystems.
 */
export async function createMigrationCopyJournal(root: string, value: Metadata) {
  const meta = metadata(value)
  const id = randomUUID()
  const handle = await open(await filename(root, id), 'wx', 0o600)
  try { await handle.writeFile(JSON.stringify({ schemaVersion: 1, id, ...meta }) + '\n'); await handle.sync() }
  catch { await handle.close(); throw fail() }
  let busy = false
  let closed = false
  let poisoned = false
  let sequence = 0
  const states = new Map(meta.revisions.map(revision => [revision, 'pending']))
  async function append(kind: 'attempt' | 'verified', revision: string) {
    if (busy || closed || poisoned || states.get(revision) !== (kind === 'attempt' ? 'pending' : 'attempt')) throw fail()
    busy = true
    try {
      await handle.writeFile(JSON.stringify({ sequence: sequence + 1, kind, revision }) + '\n')
      await handle.sync()
      sequence++
      states.set(revision, kind)
    } catch { poisoned = true; throw fail() } finally { busy = false }
  }
  return Object.freeze({ id, planDigest: meta.planDigest, inventoryHash: meta.inventoryHash,
    destinationId: meta.destinationId, revisions: Object.freeze([...meta.revisions]),
    attempt: (revision: string) => append('attempt', revision),
    verified: (revision: string) => append('verified', revision),
    async close() { if (busy) throw fail(); if (!closed) { closed = true; await handle.close() } },
  })
}

/** Observation, not permission to retry: even apparently pending revisions need
 * destination reconciliation after an interrupted/externally damaged journal.
 */
export async function readMigrationCopyJournal(root: string, id: string) {
  try {
    const target = await filename(root, id)
    const before = await lstat(target)
    if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || !same(await realpath(target), path.resolve(target))) throw fail()
    const handle = await open(target, 'r')
    let text: string
    try {
      const opened = await handle.stat()
      if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino ||
        opened.size !== before.size || opened.size > 8 * 1024 * 1024) throw fail()
      const bytes = Buffer.alloc(opened.size)
      let offset = 0
      while (offset < bytes.length) {
        const result = await handle.read(bytes, offset, bytes.length - offset, offset)
        if (!result.bytesRead) throw fail()
        offset += result.bytesRead
      }
      const after = await handle.stat()
      if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs) throw fail()
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } finally { await handle.close() }
    if (!text.endsWith('\n')) throw fail()
    const lines = text.slice(0, -1).split('\n')
    if (lines.length > 20001) throw fail()
    const header = JSON.parse(lines[0])
    if (header.schemaVersion !== 1 || header.id !== id || Object.keys(header).length !== 6) throw fail()
    const meta = metadata(header)
    const states = new Map(meta.revisions.map(revision => [revision, 'pending']))
    for (let i = 1; i < lines.length; i++) {
      const event = JSON.parse(lines[i])
      if (!event || Object.keys(event).length !== 3 || event.sequence !== i || !['attempt', 'verified'].includes(event.kind) ||
        states.get(event.revision) !== (event.kind === 'attempt' ? 'pending' : 'attempt')) throw fail()
      states.set(event.revision, event.kind)
    }
    return { id, ...meta, canApply: false as const,
      uncertain: [...states].filter(([, state]) => state === 'attempt').map(([revision]) => revision),
      verified: [...states].filter(([, state]) => state === 'verified').map(([revision]) => revision),
      pending: [...states].filter(([, state]) => state === 'pending').map(([revision]) => revision),
    }
  } catch { throw fail() }
}
