import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { join, parse, resolve } from 'node:path'
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

  const manifestPath = (revision: string) => join(root, revision, 'manifest.json')
  const loadManifest = async (revision: string): Promise<TestManifest> =>
    JSON.parse(await readFile(manifestPath(revision), 'utf8')) as TestManifest
  const saveManifest = async (revision: string, manifest: TestManifest): Promise<void> => {
    await writeFile(manifestPath(revision), JSON.stringify(manifest))
  }

  beforeEach(async () => {
    sandbox = await mkdtemp(join(tmpdir(), 'owner-media-revision-'))
    root = join(sandbox, 'store')
    await mkdir(root, { mode: 0o700 })
  })

  afterEach(async () => {
    const expectedPrefix = resolve(tmpdir())
    const target = resolve(sandbox)
    if (!target.startsWith(`${expectedPrefix}\\`) && !target.startsWith(`${expectedPrefix}/`)) {
      throw new Error(`Refusing to clean a non-temporary test path: ${target}`)
    }
    await rm(target, { force: true, recursive: true })
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
