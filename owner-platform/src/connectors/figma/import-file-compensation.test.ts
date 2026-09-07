import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { compensateFigmaFiles } from './import-file-compensation'

const prefix = 'figma-12345678-1234-4234-8234-123456789abc-'
const filename = `${prefix}hero.png`
const derivative = `${prefix}hero-480x320.png`
const receipt = { id: 72, filename, sizes: { small: { filename: derivative }, medium: { filename: derivative }, large: { filename: null } } }
const roots: string[] = []
const fixture = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'figma-compensation-test-'))
  roots.push(root)
  const directory = path.join(root, 'media')
  await mkdir(directory)
  for (const name of [filename, derivative, 'hero.png', 'other-import.png']) await writeFile(path.join(directory, name), name)
  const payload = {
    collections: { media: { config: { upload: { staticDir: directory, disableLocalStorage: false } } } },
    find: vi.fn<(args: Record<string, unknown>) => Promise<{ docs: unknown[] }>>(async () => ({ docs: [] })),
    findVersions: vi.fn<(args: Record<string, unknown>) => Promise<{ docs: unknown[] }>>(async () => ({ docs: [] })),
  }
  return { directory, payload }
}

afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== tmpdir() || !path.basename(root).startsWith('figma-compensation-test-')) throw new Error('Unsafe test cleanup')
    await rm(root, { recursive: true, force: true })
  }
})

describe('completed local Figma upload compensation', () => {
  it('removes only receipt files, deduplicates derivatives and preserves unrelated bytes', async () => {
    const { directory, payload } = await fixture()
    expect(await compensateFigmaFiles({ payload, media: receipt, prefix })).toEqual({ status: 'removed', count: 2 })
    expect(await readdir(directory)).toEqual(['hero.png', 'other-import.png'])
    expect(await readFile(path.join(directory, 'hero.png'), 'utf8')).toBe('hero.png')
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media', overrideAccess: true, trash: true }))
    expect(payload.find.mock.calls[0][0]).not.toHaveProperty('req')
    expect(payload.findVersions.mock.calls[0][0]).not.toHaveProperty('req')
  })

  it.each(['row', 'version', 'lookup failure'] as const)('retains all files when there is a %s', async (reason) => {
    const { directory, payload } = await fixture()
    if (reason === 'row') payload.find.mockResolvedValue({ docs: [{ id: 72 }] })
    if (reason === 'version') payload.findVersions.mockResolvedValue({ docs: [{ id: 3 }] })
    if (reason === 'lookup failure') payload.find.mockRejectedValue(new Error('database unavailable'))
    expect((await compensateFigmaFiles({ payload, media: receipt, prefix })).status).toBe('retained')
    expect(await readdir(directory)).toHaveLength(4)
  })

  it.each(['../outside.png', 'hero.png', `${prefix}bad/child.png`])('rejects the entire receipt before removing anything: %s', async (unsafe) => {
    const { directory, payload } = await fixture()
    expect((await compensateFigmaFiles({ payload, media: { ...receipt, sizes: { small: { filename: unsafe } } }, prefix })).status).toBe('retained')
    expect(await readdir(directory)).toHaveLength(4)
  })

  it('retains files for non-local storage', async () => {
    const { directory, payload } = await fixture()
    payload.collections.media.config.upload.disableLocalStorage = true
    expect((await compensateFigmaFiles({ payload, media: receipt, prefix })).status).toBe('retained')
    expect(await readdir(directory)).toHaveLength(4)
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('refuses a linked storage root and preserves the target', async () => {
    const { directory, payload } = await fixture()
    const link = path.join(path.dirname(directory), 'linked-media')
    await symlink(directory, link, process.platform === 'win32' ? 'junction' : 'dir')
    payload.collections.media.config.upload.staticDir = link
    expect((await compensateFigmaFiles({ payload, media: receipt, prefix })).status).toBe('retained')
    expect(await readdir(directory)).toHaveLength(4)
  })

  it('tolerates an already absent derivative without touching other imports', async () => {
    const { directory, payload } = await fixture()
    await rm(path.join(directory, derivative))
    expect(await compensateFigmaFiles({ payload, media: receipt, prefix })).toEqual({ status: 'removed', count: 1 })
    expect(await readdir(directory)).toEqual(['hero.png', 'other-import.png'])
  })

  it('rejects a directory masquerading as a derivative before deleting the original', async () => {
    const { directory, payload } = await fixture()
    await mkdir(path.join(directory, `${prefix}directory.png`))
    expect((await compensateFigmaFiles({ payload, media: { ...receipt, sizes: { small: { filename: `${prefix}directory.png` } } }, prefix })).status).toBe('retained')
    expect(await readFile(path.join(directory, filename), 'utf8')).toBe(filename)
  })
})
