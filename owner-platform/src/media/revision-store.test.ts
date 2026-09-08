import { lstat, mkdtemp, mkdir, readFile, readdir, realpath, rename, rmdir, symlink, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { readMediaRevision, writeMediaRevision } from './revision-store'

const REVISION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u

type TestManifest = {
  schema: number
  revision: string
  files: { name: string; size: number; sha256: string }[]
  [key: string]: unknown
}

describe('media revision store', () => {
  let sandbox = ''
  let root = ''
  let sandboxIdentity: { dev: number; ino: number } | undefined

  const manifestPath = (revision: string) => join(root, revision, 'manifest.json')
  const loadManifest = async (revision: string): Promise<TestManifest> =>
    JSON.parse(await readFile(manifestPath(revision), 'utf8')) as TestManifest
  const saveManifest = async (revision: string, manifest: TestManifest): Promise<void> => {
    await writeFile(manifestPath(revision), JSON.stringify(manifest))
  }

  beforeEach(async () => {
    sandbox = ''
    sandboxIdentity = undefined
    sandbox = await mkdtemp(join(tmpdir(), 'owner-media-revision-'))
    const stats = await lstat(sandbox)
    sandboxIdentity = { dev: stats.dev, ino: stats.ino }
    root = join(sandbox, 'store')
    await mkdir(root, { mode: 0o700 })
  })

  afterEach(async () => {
    if (!sandbox) return
    const target = resolve(sandbox)
    if (!sandboxIdentity || dirname(target) !== resolve(tmpdir()) || !/^owner-media-revision-[A-Za-z0-9]{6}$/.test(basename(target))) {
      throw new Error(`Refusing to clean an unowned fixture path: ${target}`)
    }
    const pending: { path: string; identity?: { dev: number; ino: number }; empty?: boolean }[] = [
      { path: target, identity: sandboxIdentity },
    ]
    while (pending.length) {
      const entry = pending.pop()!
      const inside = relative(target, entry.path)
      if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
        throw new Error('Fixture cleanup escaped its exact owned root')
      }
      try {
        const stats = await lstat(entry.path)
        if (entry.identity && (stats.isSymbolicLink() || !stats.isDirectory() ||
          stats.dev !== entry.identity.dev || stats.ino !== entry.identity.ino)) {
          throw new Error('Fixture directory identity changed during cleanup')
        }
        if (stats.isSymbolicLink() || stats.isFile()) {
          await unlink(entry.path)
        } else if (stats.isDirectory()) {
          if (relative(entry.path, await realpath(entry.path)) !== '') {
            throw new Error('Fixture cleanup directory traverses a link')
          }
          if (entry.empty) await rmdir(entry.path)
          else {
            pending.push({ ...entry, empty: true, identity: { dev: stats.dev, ino: stats.ino } })
            for (const name of await readdir(entry.path)) pending.push({ path: join(entry.path, name) })
          }
        } else throw new Error('Fixture cleanup encountered an unexpected file type')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
    sandbox = ''
    sandboxIdentity = undefined
  })

  it('keeps old bytes readable when a same-named file is written in a later revision', async () => {
    const first = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('old') },
    ])
    expect(first).toMatch(REVISION_ID)
    const second = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('new') },
    ])

    expect(first).not.toBe(second)
    await expect(readMediaRevision(root, first)).resolves.toEqual([
      { name: 'hero.png', bytes: Buffer.from('old') },
    ])
    await expect(readMediaRevision(root, second)).resolves.toEqual([
      { name: 'hero.png', bytes: Buffer.from('new') },
    ])
  })

  it('commits a snapshot that is detached from later caller Buffer mutations', async () => {
    const bytes = Buffer.from('stable')
    const pending = writeMediaRevision(root, [{ name: 'hero.png', bytes }])
    bytes.fill('x')

    const revision = await pending

    await expect(readMediaRevision(root, revision)).resolves.toEqual([
      { name: 'hero.png', bytes: Buffer.from('stable') },
    ])
  })

  it.each([
    { label: 'an empty revision', files: [] },
    { label: 'an empty binary', files: [{ name: 'hero.png', bytes: Buffer.alloc(0) }] },
    {
      label: 'more than 16 files',
      files: Array.from({ length: 17 }, (_, index) => ({
        name: `file-${index}.png`,
        bytes: Buffer.from('x'),
      })),
    },
    {
      label: 'more than 64 MiB in total',
      files: [{ name: 'large.bin', bytes: Buffer.allocUnsafe((64 * 1024 * 1024) + 1) }],
    },
  ])('rejects $label before allocating a revision directory', async ({ files }) => {
    await expect(writeMediaRevision(root, files)).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('accepts exactly 16 files', async () => {
    const files = Array.from({ length: 16 }, (_, index) => ({
      name: `file-${index}.png`,
      bytes: Buffer.from(`bytes-${index}`),
    }))

    const revision = await writeMediaRevision(root, files)

    await expect(readMediaRevision(root, revision)).resolves.toEqual(files)
  })

  it.each([
    ['duplicate names', ['hero.png', 'hero.png']],
    ['case-colliding names', ['hero.png', 'HERO.PNG']],
    ['parent traversal', ['../hero.png']],
    ['nested POSIX paths', ['nested/hero.png']],
    ['nested Windows paths', ['nested\\hero.png']],
    ['alternate data streams', ['hero.png:private']],
    ['the reserved manifest name', ['manifest.json']],
  ])('rejects %s before allocating a revision directory', async (_label, names) => {
    await expect(writeMediaRevision(root, names.map((name) => ({
      name,
      bytes: Buffer.from('x'),
    })))).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it.each([
    ['an unpaired high surrogate', '\uD800.png'],
    ['an unpaired low surrogate', '\uDC00.png'],
  ])('rejects %s before allocating a revision directory', async (_label, name) => {
    await expect(writeMediaRevision(root, [
      { name, bytes: Buffer.from('image') },
    ])).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it.each(['<', '>', '"', '|', '?', '*'])('rejects Windows-incompatible %s before writing any part of a revision', async character => {
    await expect(writeMediaRevision(root, [
      { name: 'valid.png', bytes: Buffer.from('first') },
      { name: `hero${character}.png`, bytes: Buffer.from('second') },
    ])).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it.each(['<', '>', '"', '|', '?', '*'])('classifies Windows-incompatible manifest name %s as unsafe before file lookup', async character => {
    const revision = await writeMediaRevision(root, [{ name: 'hero.png', bytes: Buffer.from('image') }])
    const manifest = await loadManifest(revision)
    manifest.files[0].name = `hero${character}.png`
    await saveManifest(revision, manifest)

    await expect(readMediaRevision(root, revision)).rejects.toThrow('El nombre del archivo de revisión no es seguro.')
    // Rejection does not rename, remove or rewrite the original bytes.
    await expect(readFile(join(root, revision, 'hero.png'))).resolves.toEqual(Buffer.from('image'))
    await expect(loadManifest(revision)).resolves.toEqual(manifest)
  })

  it('rejects a filename ending in an unpaired high surrogate before allocating a revision directory', async () => {
    await expect(writeMediaRevision(root, [
      { name: 'hero\uD800', bytes: Buffer.from('image') },
    ])).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('round-trips a filename containing a valid surrogate pair', async () => {
    const name = 'hero-\uD83D\uDE80.png'

    const revision = await writeMediaRevision(root, [
      { name, bytes: Buffer.from('image') },
    ])

    await expect(readMediaRevision(root, revision)).resolves.toEqual([
      { name, bytes: Buffer.from('image') },
    ])
  })

  it('rejects non-Buffer file data at runtime', async () => {
    await expect(writeMediaRevision(root, [
      { name: 'hero.png', bytes: 'not-bytes' },
    ] as never)).rejects.toThrow()
    await expect(readdir(root)).resolves.toEqual([])
  })

  it('requires an existing absolute non-filesystem-root directory', async () => {
    const fileRoot = join(sandbox, 'not-a-directory')
    await writeFile(fileRoot, 'x')

    await expect(writeMediaRevision('relative-store', [
      { name: 'hero.png', bytes: Buffer.from('x') },
    ])).rejects.toThrow()
    await expect(writeMediaRevision(parse(root).root, [
      { name: 'hero.png', bytes: Buffer.from('x') },
    ])).rejects.toThrow()
    await expect(writeMediaRevision(join(sandbox, 'missing'), [
      { name: 'hero.png', bytes: Buffer.from('x') },
    ])).rejects.toThrow()
    await expect(writeMediaRevision(fileRoot, [
      { name: 'hero.png', bytes: Buffer.from('x') },
    ])).rejects.toThrow()
  })

  it('rejects a storage root reached through a directory link', async () => {
    const linkedRoot = join(sandbox, 'linked-store')
    await symlink(root, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(writeMediaRevision(linkedRoot, [
      { name: 'hero.png', bytes: Buffer.from('x') },
    ])).rejects.toThrow()
  })

  it('isolates concurrent same-name writes in separate revisions', async () => {
    const [first, second] = await Promise.all([
      writeMediaRevision(root, [{ name: 'hero.png', bytes: Buffer.from('first') }]),
      writeMediaRevision(root, [{ name: 'hero.png', bytes: Buffer.from('second') }]),
    ])

    expect(first).not.toBe(second)
    await expect(readMediaRevision(root, first)).resolves.toEqual([
      { name: 'hero.png', bytes: Buffer.from('first') },
    ])
    await expect(readMediaRevision(root, second)).resolves.toEqual([
      { name: 'hero.png', bytes: Buffer.from('second') },
    ])
  })

  it.each([
    'not-a-revision',
    '../outside',
    '00000000-0000-0000-0000-000000000000',
    'A3A5BC7E-88DB-4A9F-A0D1-E5C5EA591E89',
  ])('rejects invalid revision ID %s', async (revision) => {
    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects a missing manifest', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    await rename(manifestPath(revision), join(sandbox, 'detached-manifest.json'))

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it.each([
    { label: 'invalid JSON', body: Buffer.from('{') },
    { label: 'an oversized document', body: Buffer.alloc(128 * 1024, 0x20) },
  ])('rejects a manifest containing $label', async ({ body }) => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    await writeFile(manifestPath(revision), body)

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects unsupported, mismatched, or extended manifest schemas', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const valid = await loadManifest(revision)

    for (const manifest of [
      { ...valid, schema: 2 },
      { ...valid, revision: '00000000-0000-4000-8000-000000000000' },
      { ...valid, extra: true },
    ]) {
      await saveManifest(revision, manifest)
      await expect(readMediaRevision(root, revision)).rejects.toThrow()
    }
  })

  it('rejects manifest file declarations outside count and size limits before reading binaries', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const valid = await loadManifest(revision)
    const entry = valid.files[0]!

    await saveManifest(revision, {
      ...valid,
      files: Array.from({ length: 17 }, (_, index) => ({ ...entry, name: `file-${index}.png` })),
    })
    await expect(readMediaRevision(root, revision)).rejects.toThrow()

    await saveManifest(revision, {
      ...valid,
      files: [{ ...entry, size: (64 * 1024 * 1024) + 1 }],
    })
    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects unsafe, duplicate, or malformed manifest entries', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const valid = await loadManifest(revision)
    const entry = valid.files[0]!

    for (const files of [
      [{ ...entry, name: '../hero.png' }],
      [entry, { ...entry, name: 'HERO.PNG' }],
      [{ ...entry, size: -1 }],
      [{ ...entry, size: 1.5 }],
      [{ ...entry, sha256: 'not-a-digest' }],
      [{ ...entry, extra: true }],
    ]) {
      await saveManifest(revision, { ...valid, files })
      await expect(readMediaRevision(root, revision)).rejects.toThrow()
    }
  })

  it('rejects a manifest filename ending in an unpaired high surrogate as unsafe Unicode', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const manifest = await loadManifest(revision)
    manifest.files[0]!.name = 'hero\uD800'
    await saveManifest(revision, manifest)

    await expect(readMediaRevision(root, revision)).rejects.toThrow(/nombre.*seguro/i)
  })

  it('rejects missing, extra, non-regular, or size-mismatched binaries', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const binaryPath = join(root, revision, 'hero.png')
    const detached = join(sandbox, 'detached-binary')

    await rename(binaryPath, detached)
    await expect(readMediaRevision(root, revision)).rejects.toThrow()

    await rename(detached, binaryPath)
    await writeFile(join(root, revision, 'unexpected.bin'), 'x')
    await expect(readMediaRevision(root, revision)).rejects.toThrow()

    await rename(join(root, revision, 'unexpected.bin'), join(sandbox, 'unexpected.bin'))
    await rename(binaryPath, detached)
    await mkdir(binaryPath)
    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('hashes every binary and rejects same-size corruption', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
      { name: 'thumb.png', bytes: Buffer.from('thumb') },
    ])
    await writeFile(join(root, revision, 'thumb.png'), 'other')

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects a binary whose length differs from the declared size', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const manifest = await loadManifest(revision)
    manifest.files[0]!.size += 1
    await saveManifest(revision, manifest)

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects a read through a linked storage root', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const linkedRoot = join(sandbox, 'linked-read-root')
    await symlink(root, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(readMediaRevision(linkedRoot, revision)).rejects.toThrow()
  })

  it('rejects a linked revision directory', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const revisionPath = join(root, revision)
    const backingPath = join(sandbox, 'revision-backing')
    await rename(revisionPath, backingPath)
    await symlink(backingPath, revisionPath, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })

  it('rejects a linked binary file', async () => {
    const revision = await writeMediaRevision(root, [
      { name: 'hero.png', bytes: Buffer.from('image') },
    ])
    const binaryPath = join(root, revision, 'hero.png')
    const backingPath = join(sandbox, 'binary-backing.png')
    await rename(binaryPath, backingPath)
    await symlink(backingPath, binaryPath, 'file')

    await expect(readMediaRevision(root, revision)).rejects.toThrow()
  })
})
