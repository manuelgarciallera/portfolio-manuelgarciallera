import { link, lstat, mkdtemp, mkdir, open, readFile, rmdir, symlink, unlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { inspectLegacyMediaInventory, type LegacyMediaReference } from './legacy-media-inventory'

const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

const reference = (overrides: Partial<LegacyMediaReference> = {}): LegacyMediaReference => ({
  kind: 'document',
  documentId: 'document-1',
  referenceId: 'current-1',
  state: 'published',
  files: [{ variant: 'original', filename: 'hero.png', expectedBytes: 3 }],
  ...overrides,
})

describe('legacy media inventory', () => {
  let sandbox = ''
  let root = ''
  let createdFiles: string[] = []
  let createdDirectories: string[] = []

  const createFile = async (name: string, bytes: string | Buffer): Promise<string> => {
    const path = join(root, name)
    createdFiles.push(path)
    await writeFile(path, bytes)
    return path
  }

  const createSparseFile = async (name: string, bytes: number): Promise<string> => {
    const path = join(root, name)
    createdFiles.push(path)
    const handle = await open(path, 'wx')
    try {
      await handle.truncate(bytes)
    } finally {
      await handle.close()
    }
    return path
  }

  beforeEach(async () => {
    createdFiles = []
    createdDirectories = []
    sandbox = await mkdtemp(join(tmpdir(), 'owner-legacy-media-inventory-'))
    root = join(sandbox, 'media')
    await mkdir(root)
  })

  afterEach(async () => {
    if (!sandbox) return
    const files = createdFiles.reverse()
    for (let start = 0; start < files.length; start += 128) {
      await Promise.all(files.slice(start, start + 128).map(async (path) => {
        await unlink(path).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error
        })
      }))
    }
    for (const path of createdDirectories.reverse()) await rmdir(path)
    await rmdir(root).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
    await rmdir(sandbox)
    sandbox = ''
  })

  it('hashes present historical bytes without claiming that they verify history', async () => {
    await createFile('same.png', 'abc')
    const refs = [{
      kind: 'version' as const,
      documentId: '1',
      referenceId: 'old-1',
      state: 'published' as const,
      files: [{ variant: 'original', filename: 'same.png', expectedBytes: 3 }],
    }]

    const report = await inspectLegacyMediaInventory({ root, references: refs })

    expect(report.references[0].status).toBe('historical-unverified')
    expect(report.references[0].observedFiles[0].sha256)
      .toBe(SHA256_ABC)
    expect(report.migrationReady).toBe(false)
  })

  it('classifies a complete current file and inventories physical bytes once', async () => {
    await createFile('hero.png', 'abc')

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference(), reference({ referenceId: 'alias-1' })],
    })

    expect(report.references.map(({ status }) => status)).toEqual([
      'current-observed',
      'current-observed',
    ])
    expect(report.physicalFiles).toEqual([{
      filename: 'hero.png',
      status: 'present',
      bytes: 3,
      sha256: SHA256_ABC,
    }])
    expect(report.totalObservedBytes).toBe(3)
    expect(report.unreferencedFiles).toEqual([])
  })

  it('reports missing metadata, missing bytes, invalid sizes, mismatches, and empty files', async () => {
    await createFile('wrong.png', 'abc')
    await createFile('empty.png', '')
    const refs = [reference({
      files: [
        { variant: 'empty', filename: 'empty.png' },
        { variant: 'missing', filename: 'missing.png' },
        { variant: 'nameless' },
        { variant: 'wrong-size', filename: 'wrong.png', expectedBytes: 4 },
        { variant: 'invalid-size', filename: 'wrong.png', expectedBytes: 0 },
      ],
    })]

    const report = await inspectLegacyMediaInventory({ root, references: refs })

    expect(report.references[0].status).toBe('incomplete')
    expect(report.references[0].issues).toEqual([
      'empty-file:empty',
      'invalid-expected-bytes:invalid-size',
      'missing-file:missing',
      'incomplete-metadata:nameless:filename',
      'size-mismatch:wrong-size',
    ].sort())
  })

  it('keeps unreferenced regular and unsafe physical entries without authorizing deletion', async () => {
    await createFile('orphan.png', 'abc')
    await createFile('manifest.json', '{}')
    const manifestEvidence = 'unsafe-name-ffa5b716b5a57837f7929dfcca4b4dfdeb97210a7fd5a12d2f1978846d6f1743'

    const report = await inspectLegacyMediaInventory({ root, references: [] })

    expect(report.physicalFiles).toEqual([
      { filename: 'orphan.png', status: 'present', bytes: 3, sha256: SHA256_ABC },
      { filename: manifestEvidence, status: 'unsafe-entry' },
    ])
    expect(report.unreferencedFiles).toEqual(['orphan.png', manifestEvidence])
    expect(report.issues).toContain('unsafe-physical-entry:' + manifestEvidence)
    expect(report.totalObservedBytes).toBe(5)
  })

  it('keeps generated unsafe-name evidence distinct from literal physical filenames', async () => {
    const manifestEvidence = 'unsafe-name-ffa5b716b5a57837f7929dfcca4b4dfdeb97210a7fd5a12d2f1978846d6f1743'
    const literalEvidence = 'unsafe-name-af5ec6a3c5aefea65e0f164ed3eef920a7f51882223f77a92d4527d4b1652824'
    await createFile('manifest.json', 'a')
    await createFile(manifestEvidence, 'bb')

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        files: [{ variant: 'unsafe', filename: 'manifest.json' }],
      })],
    })

    expect(report.references[0].files).toEqual([
      { variant: 'unsafe', filename: manifestEvidence },
    ])
    expect(report.references[0].observedFiles).toEqual([
      { filename: manifestEvidence, status: 'unsafe-entry' },
    ])
    expect(report.physicalFiles).toEqual([
      { filename: literalEvidence, status: 'unsafe-entry' },
      { filename: manifestEvidence, status: 'unsafe-entry' },
    ])
    expect(report.unreferencedFiles).toEqual([literalEvidence])
    expect(report.issues).toEqual([
      'unsafe-physical-entry:' + literalEvidence,
      'unsafe-physical-entry:' + manifestEvidence,
    ])
    expect(report.totalObservedBytes).toBe(3)
  })

  it('reserves the unsafe-name evidence namespace case-insensitively', async () => {
    const uppercaseEvidence = 'UNSAFE-NAME-FFA5B716B5A57837F7929DFCCA4B4DFDEB97210A7FD5A12D2F1978846D6F1743'
    const reportedEvidence = 'unsafe-name-4199cc3670815958429e5caf43416eb2be2271cab5579ebf778e4fcb417d8765'
    await createFile(uppercaseEvidence, 'a')

    const report = await inspectLegacyMediaInventory({ root, references: [] })

    expect(report.physicalFiles).toEqual([
      { filename: reportedEvidence, status: 'unsafe-entry' },
    ])
    expect(report.unreferencedFiles).toEqual([reportedEvidence])
    expect(report.issues).toEqual(['unsafe-physical-entry:' + reportedEvidence])
  })

  it('does not URL-decode filenames while matching Unicode conservatively', async () => {
    await createFile('%2e%2e.png', 'abc')
    await createFile('\u00E9.png', 'abc')

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        files: [
          { variant: 'encoded', filename: '%2e%2e.png', expectedBytes: 3 },
          { variant: 'unicode', filename: 'e\u0301.png', expectedBytes: 3 },
        ],
      })],
    })

    expect(report.references[0].status).toBe('current-observed')
    expect(report.references[0].observedFiles.map(({ filename }) => filename)).toEqual([
      '%2e%2e.png',
      '\u00E9.png',
    ])
  })

  it('marks symbolic links, hard links, and subdirectories unsafe without reading them', async () => {
    const target = await createFile('target.png', 'abc')
    const hard = join(root, 'hard.png')
    createdFiles.push(hard)
    await link(target, hard)
    const symbolic = join(root, 'symbolic.png')
    createdFiles.push(symbolic)
    await symlink(target, symbolic, 'file')
    const directory = join(root, 'nested')
    createdDirectories.push(directory)
    await mkdir(directory)

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({ files: [{ variant: 'linked', filename: 'hard.png' }] })],
    })

    expect(report.physicalFiles).toEqual([
      { filename: 'hard.png', status: 'unsafe-entry' },
      { filename: 'nested', status: 'unsafe-entry' },
      { filename: 'symbolic.png', status: 'unsafe-entry' },
      { filename: 'target.png', status: 'unsafe-entry' },
    ])
    expect(report.references[0].issues).toEqual(['unsafe-entry:linked'])
  })

  it('does not resolve valid revision-bearing references against the legacy root', async () => {
    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        storageRevision: 'a3a5bc7e-88db-4a9f-a0d1-e5c5ea591e89',
        files: [{ variant: 'original', filename: 'missing.png', expectedBytes: 3 }],
      })],
    })

    expect(report.references[0]).toMatchObject({
      status: 'versioned-not-inspected',
      issues: [],
      observedFiles: [],
    })
  })

  it('keeps a malformed storage revision visible and incomplete', async () => {
    await createFile('hero.png', 'abc')

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({ storageRevision: 'not-a-revision' })],
    })

    expect(report.references[0].status).toBe('incomplete')
    expect(report.references[0].issues).toEqual(['invalid-storage-revision'])
    expect(report.references[0].observedFiles[0].sha256).toBe(SHA256_ABC)
  })

  it('flags canonical filenames shared across documents but allows same-document aliases', async () => {
    await createFile('hero.png', 'abc')

    const allowed = await inspectLegacyMediaInventory({
      root,
      references: [reference(), reference({ referenceId: 'alias' })],
    })
    const shared = await inspectLegacyMediaInventory({
      root,
      references: [reference(), reference({ documentId: 'document-2', referenceId: 'other' })],
    })

    expect(allowed.issues).not.toContain('shared-filename:hero.png')
    expect(shared.issues).toContain('shared-filename:hero.png')
  })

  it('sorts and hashes only the bounded schema without mutating or copying editorial extras', async () => {
    await createFile('b.png', 'b')
    await createFile('a.png', 'a')
    const refs = [
      {
        ...reference({
          documentId: '2',
          referenceId: 'b',
          files: [{ variant: 'z', filename: 'b.png', alt: 'private' } as never],
        }),
        caption: 'private',
      },
      reference({ documentId: '1', referenceId: 'a', files: [{ variant: 'a', filename: 'a.png' }] }),
    ]
    const before = JSON.stringify(refs)

    const first = await inspectLegacyMediaInventory({ root, references: refs })
    const second = await inspectLegacyMediaInventory({ root, references: [...refs].reverse() })

    expect(first.hash).toMatch(/^[0-9a-f]{64}$/u)
    expect(second.hash).toBe(first.hash)
    expect(first.references.map(({ documentId }) => documentId)).toEqual(['1', '2'])
    expect(first.references[1]).not.toHaveProperty('caption')
    expect(first.references[1].files[0]).not.toHaveProperty('alt')
    expect(JSON.stringify(refs)).toBe(before)
  })

  it('hashes the canonical empty report while excluding the hash field itself', async () => {
    const report = await inspectLegacyMediaInventory({ root, references: [] })

    expect(report.hash)
      .toBe('3082100c8ed89ea0899082eca22d21e5985d594edd9759537a57194ebdb1142d')
  })

  it.each([
    ['a non-array reference collection', { root: 'not-read', references: {} }],
    ['too many references', { root: 'not-read', references: Array.from({ length: 10_001 }, () => reference()) }],
    ['an invalid kind', { root: 'not-read', references: [reference({ kind: 'other' as never })] }],
    ['an invalid state', { root: 'not-read', references: [reference({ state: 'other' as never })] }],
    ['an empty identifier', { root: 'not-read', references: [reference({ documentId: '' })] }],
    ['a long identifier', { root: 'not-read', references: [reference({ referenceId: 'x'.repeat(257) })] }],
    ['duplicate identities', { root: 'not-read', references: [reference(), reference()] }],
    ['too many variants', { root: 'not-read', references: [reference({ files: Array.from({ length: 17 }, (_, index) => ({ variant: `v-${index}` })) })] }],
    ['duplicate variants', { root: 'not-read', references: [reference({ files: [{ variant: 'same' }, { variant: 'same' }] })] }],
  ])('validates %s before filesystem IO', async (_label, input) => {
    await expect(inspectLegacyMediaInventory(input as never)).rejects.toThrow()
  })

  it.each([
    ['document ID dot', reference({ documentId: '.' }), /identifiers are invalid/u],
    ['document ID parent dot', reference({ documentId: '..' }), /identifiers are invalid/u],
    ['reference ID dot', reference({ referenceId: '.' }), /identifiers are invalid/u],
    ['reference ID parent dot', reference({ referenceId: '..' }), /identifiers are invalid/u],
    ['variant dot', reference({ files: [{ variant: '.', filename: 'hero.png' }] }), /variant has an invalid name/u],
    ['variant parent dot', reference({ files: [{ variant: '..', filename: 'hero.png' }] }), /variant has an invalid name/u],
  ])('rejects %s before reading the physical root', async (_label, item, expectedError) => {
    const unreadableRoot = join(sandbox, 'must-not-be-read')

    await expect(inspectLegacyMediaInventory({
      root: unreadableRoot,
      references: [item],
    })).rejects.toThrow(expectedError)
  })

  it('requires an existing absolute non-volume-root physical directory', async () => {
    const fileRoot = join(sandbox, 'file-root')
    createdFiles.push(fileRoot)
    await writeFile(fileRoot, 'x')

    await expect(inspectLegacyMediaInventory({ root: 'relative', references: [] })).rejects.toThrow()
    await expect(inspectLegacyMediaInventory({ root: parse(root).root, references: [] })).rejects.toThrow()
    await expect(inspectLegacyMediaInventory({ root: join(sandbox, 'missing'), references: [] })).rejects.toThrow()
    await expect(inspectLegacyMediaInventory({ root: fileRoot, references: [] })).rejects.toThrow()
  })

  it('rejects a physical root reached through a directory link', async () => {
    const linkedRoot = join(sandbox, 'linked-root')
    createdFiles.push(linkedRoot)
    await symlink(root, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir')

    await expect(inspectLegacyMediaInventory({ root: linkedRoot, references: [] })).rejects.toThrow()
  })

  it('rejects a sparse physical file larger than 64 MiB during preflight', async () => {
    await createSparseFile('large.bin', (64 * 1024 * 1024) + 1)

    await expect(inspectLegacyMediaInventory({ root, references: [] })).rejects.toThrow()
  })

  it('applies the 64 MiB limit to a regular file with an unsafe manifest name', async () => {
    await createSparseFile('manifest.json', (64 * 1024 * 1024) + 1)

    await expect(inspectLegacyMediaInventory({ root, references: [] })).rejects.toThrow(
      /64 MiB limit/u,
    )
  })

  it('does not modify file bytes, size, or mtime while inspecting', async () => {
    const path = await createFile('hero.png', 'abc')
    const before = await lstat(path)

    await inspectLegacyMediaInventory({ root, references: [reference()] })

    const after = await lstat(path)
    expect(await readFile(path, 'utf8')).toBe('abc')
    expect(after.size).toBe(before.size)
    expect(after.mtimeMs).toBe(before.mtimeMs)
  })

  it.each([
    ['parent traversal', '../hero.png'],
    ['POSIX separators', 'nested/hero.png'],
    ['Windows separators', 'nested\\hero.png'],
    ['alternate data streams', 'hero.png:private'],
    ['control characters', 'hero\n.png'],
    ['device names', 'CON.txt'],
    ['trailing dots', 'hero.png.'],
    ['trailing spaces', 'hero.png '],
    ['an ill-formed UTF-16 name', 'hero\uD800.png'],
    ['the reserved manifest', 'manifest.json'],
  ])('marks %s as an unsafe reference name without resolving it', async (_label, filename) => {
    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({ files: [{ variant: 'unsafe', filename }] })],
    })

    expect(report.references[0].status).toBe('incomplete')
    expect(report.references[0].issues).toEqual(['unsafe-filename:unsafe'])
    const evidence = report.references[0].files[0].filename
    expect(evidence).toMatch(/^unsafe-name-[0-9a-f]{64}$/u)
    expect(JSON.stringify(report.references[0])).not.toContain(filename)
    expect(report.references[0].observedFiles).toEqual([
      { filename: evidence, status: 'unsafe-entry' },
    ])
  })

  it('sanitizes unsafe filename evidence even when a valid revision skips legacy IO', async () => {
    const filename = '../private/revision.png'
    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        storageRevision: 'a3a5bc7e-88db-4a9f-a0d1-e5c5ea591e89',
        files: [{ variant: 'original', filename }],
      })],
    })

    expect(report.references[0].status).toBe('versioned-not-inspected')
    expect(report.references[0].issues).toEqual(['unsafe-filename:original'])
    expect(report.references[0].files[0].filename).toMatch(/^unsafe-name-[0-9a-f]{64}$/u)
    expect(JSON.stringify(report.references[0])).not.toContain(filename)
    expect(report.references[0].observedFiles).toEqual([])
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'reports invalid expected byte metadata %s without throwing',
    async (expectedBytes) => {
      await createFile('hero.png', 'abc')
      const report = await inspectLegacyMediaInventory({
        root,
        references: [reference({
          files: [{ variant: 'original', filename: 'hero.png', expectedBytes }],
        })],
      })

      expect(report.references[0].status).toBe('incomplete')
      expect(report.references[0].issues).toEqual(['invalid-expected-bytes:original'])
      expect(report.references[0].files[0]).not.toHaveProperty('expectedBytes')
    },
  )

  it.each([
    ['draft', 'current-observed'],
    ['snapshot', 'historical-unverified'],
  ] as const)('classifies a complete %s reference as %s', async (kind, status) => {
    await createFile('hero.png', 'abc')
    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({ kind })],
    })

    expect(report.references[0].status).toBe(status)
  })

  it.skipIf(process.platform === 'darwin')(
    'does not select either physical entry when NFC names collide',
    async () => {
      await createFile('\u00E9.png', 'a')
      await createFile('e\u0301.png', 'b')
      const report = await inspectLegacyMediaInventory({
        root,
        references: [reference({
          files: [{ variant: 'original', filename: '\u00E9.png' }],
        })],
      })

      expect(report.issues).toContain('physical-name-collision:\u00E9.png')
      expect(report.references[0].status).toBe('incomplete')
      expect(report.references[0].issues).toEqual(['ambiguous-file:original'])
      expect(report.references[0].observedFiles).toHaveLength(2)
    },
  )

  it('rejects more than 10,000 immediate physical entries before hashing', async () => {
    const names = Array.from({ length: 10_001 }, (_, index) => 'empty-' + index + '.bin')
    for (let start = 0; start < names.length; start += 128) {
      await Promise.all(names.slice(start, start + 128).map(async (name) => {
        await createFile(name, '')
      }))
    }

    await expect(inspectLegacyMediaInventory({ root, references: [] })).rejects.toThrow(
      /physical entry limit/u,
    )
  }, 30_000)

  it('rejects more than 1 GiB of sparse regular files during preflight', async () => {
    for (let index = 0; index < 17; index += 1) {
      await createSparseFile('sparse-' + index + '.bin', 64 * 1024 * 1024)
    }

    await expect(inspectLegacyMediaInventory({ root, references: [] })).rejects.toThrow(
      /1 GiB byte limit/u,
    )
  })

  it('applies the 1 GiB limit to regular files with unsafe email-shaped names', async () => {
    for (let index = 0; index < 17; index += 1) {
      await createSparseFile('private-' + index + '@example.com', 64 * 1024 * 1024)
    }

    await expect(inspectLegacyMediaInventory({ root, references: [] })).rejects.toThrow(
      /1 GiB byte limit/u,
    )
  })

  it('rejects a serialized report larger than 8 MiB', async () => {
    const files = Array.from({ length: 16 }, (_, index) => ({
      variant: 'variant-' + index,
      filename: 'missing-' + index + '-' + 'x'.repeat(120) + '.png',
    }))
    const references = Array.from({ length: 5_000 }, (_, index) =>
      reference({
        documentId: 'document-' + index,
        referenceId: 'reference-' + index,
        files,
      })
    )

    await expect(inspectLegacyMediaInventory({ root, references })).rejects.toThrow(
      /exceeds 8 MiB/u,
    )
  }, 30_000)

  it('aborts when a file mutates during the observed read window', async () => {
    const path = await createSparseFile('hero.png', 64 * 1024 * 1024)
    let mutate = true
    const mutation = (async () => {
      while (mutate) {
        const now = new Date()
        await utimes(path, now, now)
        await new Promise<void>((resolveReady) => setImmediate(resolveReady))
      }
    })()

    try {
      await expect(inspectLegacyMediaInventory({
        root,
        references: [reference({
          files: [{ variant: 'original', filename: 'hero.png' }],
        })],
      })).rejects.toThrow(/changed/u)
    } finally {
      mutate = false
      await mutation
    }
  }, 30_000)

  it.each([
    ['a control-bearing document ID', reference({ documentId: 'bad\nid' })],
    ['an ill-formed reference ID', reference({ referenceId: 'bad\uD800id' })],
    ['an empty variant', reference({ files: [{ variant: '' }] })],
    ['a control-bearing variant', reference({ files: [{ variant: 'bad\tvariant' }] })],
  ])('rejects %s before filesystem IO', async (_label, invalidReference) => {
    await expect(inspectLegacyMediaInventory({
      root: 'not-read',
      references: [invalidReference],
    })).rejects.toThrow()
  })

  it('accepts 256 Unicode scalar values in identifiers and variant names', async () => {
    const rockets = '\uD83D\uDE80'.repeat(256)

    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        documentId: rockets,
        referenceId: 'unicode-boundary',
        files: [{ variant: rockets }],
      })],
    })

    expect(report.references[0].documentId).toBe(rockets)
    expect(report.references[0].files[0].variant).toBe(rockets)
  })

  it('does not echo absolute paths or URLs from unsafe known metadata into the report', async () => {
    const absolute = join(sandbox, 'private', 'secret.png')
    const url = 'https://private.example/media.png?token=secret'
    const report = await inspectLegacyMediaInventory({
      root,
      references: [reference({
        storageRevision: url,
        files: [
          { variant: 'absolute', filename: absolute },
          { variant: 'remote', filename: url },
        ],
      })],
    })
    const serialized = JSON.stringify(report)

    expect(serialized).not.toContain(absolute)
    expect(serialized).not.toContain(url)
    expect(report.references[0]).not.toHaveProperty('storageRevision')
    expect(report.references[0].files).toEqual([
      { variant: 'absolute', filename: expect.stringMatching(/^unsafe-name-[0-9a-f]{64}$/u) },
      { variant: 'remote', filename: expect.stringMatching(/^unsafe-name-[0-9a-f]{64}$/u) },
    ])
    expect(report.references[0].issues).toEqual([
      'invalid-storage-revision',
      'unsafe-filename:absolute',
      'unsafe-filename:remote',
    ])
  })

  it.each([
    ['an absolute document ID', join(parse(root).root, 'private')],
    ['a URL reference ID', 'https://private.example/reference'],
    ['a URL variant', 'mailto:private@example.com'],
  ])('rejects %s before filesystem IO', async (label, unsafeValue) => {
    const invalid = label.includes('document')
      ? reference({ documentId: unsafeValue })
      : label.includes('reference')
        ? reference({ referenceId: unsafeValue })
        : reference({ files: [{ variant: unsafeValue }] })

    await expect(inspectLegacyMediaInventory({
      root: 'not-read',
      references: [invalid],
    })).rejects.toThrow()
  })

  it.each([
    ['a parent-relative document ID', { documentId: '../private' }, /identifiers are invalid/u],
    ['a path-shaped reference ID', { referenceId: 'folder/id' }, /identifiers are invalid/u],
    ['an email-shaped document ID', { documentId: 'private@example.com' }, /identifiers are invalid/u],
    ['a relative path variant', { files: [{ variant: '../private' }] }, /variant has an invalid name/u],
    ['an email-shaped variant', { files: [{ variant: 'private@example.com' }] }, /variant has an invalid name/u],
  ])('rejects %s before attempting to read the root', async (_label, overrides, expected) => {
    const unreadableRoot = join(sandbox, 'must-not-be-read')

    await expect(inspectLegacyMediaInventory({
      root: unreadableRoot,
      references: [reference(overrides as Partial<LegacyMediaReference>)],
    })).rejects.toThrow(expected)
  })

  it.each([
    ['the top-level collection', new Array(1) as LegacyMediaReference[]],
    ['a reference file collection', [reference({ files: new Array(1) })]],
  ])('rejects a sparse %s before attempting to read the root', async (_label, references) => {
    const unreadableRoot = join(sandbox, 'must-not-be-read')

    await expect(inspectLegacyMediaInventory({
      root: unreadableRoot,
      references,
    })).rejects.toThrow(/cannot be sparse/u)
  })

  it.runIf(process.platform === 'win32')(
    'rejects a Windows root-relative path before filesystem IO',
    async () => {
      await expect(inspectLegacyMediaInventory({
        root: '\\media-that-must-not-be-read',
        references: [],
      })).rejects.toThrow(/fully qualified local drive/u)
    },
  )

  it.runIf(process.platform === 'win32')(
    'rejects Windows UNC and device namespace roots before filesystem IO',
    async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      const guardedLstat = ((...args: Parameters<typeof actual.lstat>) => {
        if (String(args[0]).startsWith('\\\\')) {
          throw new Error('Filesystem boundary invoked for a non-local root.')
        }
        return actual.lstat(...args)
      }) as typeof actual.lstat
      vi.resetModules()
      vi.doMock('node:fs/promises', () => ({ ...actual, lstat: guardedLstat }))
      try {
        const isolated = await import('./legacy-media-inventory')
        for (const invalidRoot of [
          '\\\\server\\share\\media',
          '\\\\?\\C:\\media',
          '\\\\.\\C:\\media',
        ]) {
          await expect(isolated.inspectLegacyMediaInventory({
            root: invalidRoot,
            references: [],
          })).rejects.toThrow(/fully qualified local drive/u)
        }
      } finally {
        vi.doUnmock('node:fs/promises')
        vi.resetModules()
      }
    },
  )
})
