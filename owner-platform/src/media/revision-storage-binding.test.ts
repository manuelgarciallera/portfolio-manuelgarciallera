import { lstat, mkdtemp, mkdir, rmdir, symlink, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { Media } from '../collections/Media'
import { createRevisionStorageCollection } from './revision-storage-binding'

let root = ''
let revisionRoot: string
let staticDir: string
beforeEach(async () => {
  root = ''
  root = await mkdtemp(path.join(tmpdir(), 'owner-revision-binding-'))
  revisionRoot = path.join(root, 'private')
  staticDir = path.join(root, 'native')
  await mkdir(revisionRoot)
  await mkdir(staticDir)
})
const ignoreMissing = async (action: () => Promise<unknown>) => {
  try { await action() } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}
afterEach(async () => {
  if (!root) return
  const link = path.join(root, 'link')
  await ignoreMissing(async () => {
    if (!(await lstat(link)).isSymbolicLink()) throw new Error('Expected the fixture junction')
    await unlink(link)
  })
  // Only these directories are created by this fixture. Nonempty directories
  // fail cleanup visibly; never traverse or remove unexpected contents.
  for (const directory of [path.join(root, 'native'), path.join(root, 'private'), root]) {
    await ignoreMissing(() => rmdir(directory))
  }
  root = ''
})

it.each(['absent', 'relative', 'missing', 'same', 'nested', 'filesystem-root'])('rejects %s storage settings before enabling uploads', async (fault) => {
  let settings = { revisionRoot, staticDir }
  if (fault === 'absent') settings = undefined as never
  if (fault === 'relative') settings.revisionRoot = 'private'
  if (fault === 'missing') settings.revisionRoot = path.join(root, 'missing')
  if (fault === 'same') settings.revisionRoot = staticDir
  if (fault === 'nested') settings.revisionRoot = root
  if (fault === 'filesystem-root') settings.revisionRoot = path.parse(root).root
  await expect(createRevisionStorageCollection(Media, settings)).rejects.toThrow()
})

it('rejects a linked root and leaves the supplied collection unchanged', async () => {
  const link = path.join(root, 'link')
  await symlink(revisionRoot, link, 'junction')
  await expect(createRevisionStorageCollection(Media, { revisionRoot: link, staticDir })).rejects.toThrow(/real directories/)
  const bound = await createRevisionStorageCollection(Media, { revisionRoot, staticDir })
  expect(typeof Media.upload === 'object' && Media.upload.disableLocalStorage).not.toBe(true)
  expect(bound.upload).toMatchObject({ disableLocalStorage: true, staticDir })
  expect(Media.fields.some((field) => 'name' in field && field.name === 'storageRevision')).toBe(false)
})

it('never falls through to native files and returns Responses for invalid and failed guarded reads', async () => {
  const bound = await createRevisionStorageCollection(Media, { revisionRoot, staticDir })
  const native = typeof bound.upload === 'object' && bound.upload.handlers?.[0]
  expect(native).toBeTruthy()
  const nativeResponse = await (native as Exclude<typeof native, false | undefined>)({} as never, {} as never)
  expect(nativeResponse).toBeInstanceOf(Response)
  expect(nativeResponse!.status).toBe(404)
  const endpoint = bound.endpoints && bound.endpoints.find((entry) => entry.path.startsWith('/revision/'))
  if (!endpoint) throw new Error('Missing revision endpoint')
  for (const req of [{}, { routeParams: { id: '1', revision: '11111111-1111-4111-8111-111111111111', filename: 'image.png' } }]) {
    const response = await endpoint.handler(req as never)
    expect(response).toBeInstanceOf(Response)
    expect(response.status).toBe(404)
  }
})
