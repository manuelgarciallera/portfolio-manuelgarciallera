import { describe, expect, it } from 'vitest'

import { snapshotFiles, validateManifest, validateRevision } from './revision-manifest'

const revision = '11111111-1111-4111-8111-111111111111'
const valid = () => ({ schema: 1, revision, files: [{ name: 'hero.png', size: 3, sha256: 'a'.repeat(64) }] })

describe('portable revision manifest contract', () => {
  it('preserves the schema-one inventory and revision identity', () => {
    expect(validateRevision(revision)).toBe(revision)
    expect(validateManifest(valid(), revision)).toEqual(valid())
  })

  it('takes ownership of bytes before asynchronous storage can observe caller mutations', () => {
    const bytes = Buffer.from('old')
    const files = [{ name: 'hero.png', bytes }]
    const snapshot = snapshotFiles(files)
    bytes.fill(0)
    files[0].name = 'changed.png'
    expect(snapshot).toEqual([{ name: 'hero.png', bytes: Buffer.from('old') }])
  })

  it.each(['../hero.png', 'hero:stream', 'manifest.json', 'CON.png', 'image.', '\ud800'])('rejects unsafe filename %s', (name) => {
    expect(() => snapshotFiles([{ name, bytes: Buffer.from('x') }])).toThrow()
  })

  it('rejects canonically equivalent names across transports', () => {
    expect(() => snapshotFiles([
      { name: 'é.png', bytes: Buffer.from('a') },
      { name: 'e\u0301.png', bytes: Buffer.from('b') },
    ])).toThrow()
  })

  it('rejects empty inventories and more than sixteen files', () => {
    expect(() => snapshotFiles([])).toThrow()
    expect(() => snapshotFiles(Array.from({ length: 17 }, (_, i) => ({ name: `${i}.png`, bytes: Buffer.from('x') })))).toThrow()
  })

  it('rejects another revision, additional keys and unbounded declarations', () => {
    expect(() => validateManifest(valid(), '22222222-2222-4222-8222-222222222222')).toThrow()
    expect(() => validateManifest({ ...valid(), extra: true }, revision)).toThrow()
    for (const size of [0, -1, 1.5, 64 * 1024 * 1024 + 1, Infinity]) {
      expect(() => validateManifest({ ...valid(), files: [{ ...valid().files[0], size }] }, revision)).toThrow()
    }
    expect(() => validateManifest({ ...valid(), files: [{ ...valid().files[0], sha256: 'bad' }] }, revision)).toThrow()
  })

  it.each(['../revision', '', '11111111-1111-1111-8111-111111111111'])('rejects invalid revision %s', (id) => {
    expect(() => validateRevision(id)).toThrow()
  })
})
