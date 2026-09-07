import 'server-only'

import { lstat, realpath, unlink } from 'node:fs/promises'
import path from 'node:path'

type Store = {
  collections?: { media?: { config?: { upload?: unknown } } }
  find(args: Record<string, unknown>): Promise<{ docs: unknown[] }>
  findVersions?: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>
}
type Outcome = { status: 'removed'; count: number } | { status: 'retained'; reason: string; removed: number }
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const retained = (reason: string, removed = 0): Outcome => ({ status: 'retained', reason, removed })

// Only for a COMPLETED upload, after a precommit failure. The caller must never
// invoke this after attempting commit or for an upload that did not return.
// No directory diff/glob: a receipt and an unpredictable per-attempt namespace
// bound the cleanup. This is not an exclusive storage writer or crash recovery.
export const compensateFigmaFiles = async ({ payload, media, prefix }: {
  payload: Store; media: Record<string, unknown>; prefix: string
}): Promise<Outcome> => {
  let removed = 0
  try {
    const upload = payload.collections?.media?.config?.upload
    if (!record(upload) || upload.disableLocalStorage || typeof upload.staticDir !== 'string' || !payload.findVersions) return retained('unsupported-storage')
    if (!/^figma-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}-$/.test(prefix)
      || (typeof media.id !== 'number' && typeof media.id !== 'string')) return retained('invalid-receipt')
    const names: unknown[] = [media.filename]
    if (media.sizes != null) {
      if (!record(media.sizes)) return retained('invalid-receipt')
      for (const size of Object.values(media.sizes)) {
        if (!record(size)) return retained('invalid-receipt')
        if (size.filename != null) names.push(size.filename)
      }
    }
    if (names.some((name) => typeof name !== 'string' || !name.startsWith(prefix) || !/^[a-z0-9-]+\.png$/.test(name))) return retained('invalid-receipt')
    const filenames = [...new Set(names as string[])]
    const root = path.resolve(upload.staticDir)
    if (!path.isAbsolute(upload.staticDir) || root === path.parse(root).root) return retained('unsafe-root')
    const rootInfo = await lstat(root)
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink() || path.relative(root, await realpath(root)) !== '') return retained('unsafe-root')

    // Fresh primary reads: do not pass the failed req/transaction/context/cache.
    // Include trash and history; a rollback helper returning is not proof.
    const rows = await payload.find({ collection: 'media', depth: 0, limit: 1, overrideAccess: true, trash: true,
      where: { or: [{ id: { equals: media.id } }, { filename: { in: filenames } }] } })
    const versions = await payload.findVersions({ collection: 'media', depth: 0, limit: 1, overrideAccess: true,
      where: { or: [{ parent: { equals: media.id } }, { 'version.filename': { in: filenames } }] } })
    if (rows.docs.length || versions.docs.length) return retained('referenced')

    // Validate every candidate before removing even the first. Never recurse or
    // follow links; a malformed or incomplete storage receipt fails closed.
    const files: string[] = []
    for (const filename of filenames) {
      const target = path.join(root, filename)
      try {
        const info = await lstat(target)
        if (!info.isFile() || info.isSymbolicLink()) return retained('unsafe-file')
        files.push(target)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
    for (const target of files) {
      await unlink(target)
      removed++
    }
    return { status: 'removed', count: removed }
  } catch {
    // A partial OS failure is observable, not reported as full compensation.
    return retained('verification-or-removal-failed', removed)
  }
}
