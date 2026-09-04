import { APIError, ValidationError, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Releases, enforceImmutableReleaseDelete, validateReleaseRecord } from './Releases'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  Releases.fields.find((field) => 'name' in field && field.name === name)

const validRelease = {
  changeSummary: 'Checkpoint previo al editor modular',
  draftSnapshot: 5,
  gitCommit: '2f836c6548b7abdc6ab45e7b771095cffb68e511',
  name: 'Portfolio 2026-09-04',
  previewSnapshot: 4,
  quality: [
    {
      accessibility: 96,
      measuredAt: '2026-09-04T18:30:00.000Z',
      performance: 91,
      source: 'lighthouse',
      usability: 94,
      viewport: 'mobile',
    },
  ],
}

describe('Releases collection', () => {
  it('is owner-only and append-only', () => {
    expect(Releases.slug).toBe('releases')
    expect(Releases.access?.create?.(accessArgs(owner))).toBe(true)
    expect(Releases.access?.read?.(accessArgs(owner))).toBe(true)
    expect(Releases.access?.create?.(accessArgs(null))).toBe(false)
    expect(Releases.access?.read?.(accessArgs(null))).toBe(false)
    expect(Releases.access?.update?.(accessArgs(owner))).toBe(false)
    expect(Releases.access?.delete?.(accessArgs(owner))).toBe(false)
    expect(Releases.trash).not.toBe(true)
    expect(Releases.versions).toBeUndefined()
  })

  it('stores a recoverable source and comparable quality measurements without executable fields', () => {
    expect(fieldNamed('name')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('changeSummary')).toMatchObject({ type: 'textarea', required: true })
    expect(fieldNamed('gitCommit')).toMatchObject({ type: 'text', required: true, unique: true })
    expect(fieldNamed('previewSnapshot')).toMatchObject({
      type: 'relationship',
      relationTo: 'preview-snapshots',
      required: true,
    })
    expect(fieldNamed('draftSnapshot')).toMatchObject({
      type: 'relationship',
      relationTo: 'draft-snapshots',
      required: true,
    })
    expect(fieldNamed('quality')).toMatchObject({ type: 'array', required: true })
    expect(JSON.stringify(Releases.fields)).not.toMatch(/(?:customCSS|javascript|html|codeEditor)/i)
  })

  it('normalizes a valid release and binds it to the authenticated owner', async () => {
    await expect(
      validateReleaseRecord({ operation: 'create', data: validRelease, req: { user: owner } } as never),
    ).resolves.toEqual({ ...validRelease, createdBy: 1 })
  })

  it.each([
    { ...validRelease, gitCommit: 'main' },
    { ...validRelease, quality: [] },
    { ...validRelease, quality: [{ ...validRelease.quality[0], performance: 101 }] },
    { ...validRelease, command: 'git reset --hard HEAD~1' },
  ])('rejects release records that are not safely restorable %#', async (data) => {
    await expect(
      validateReleaseRecord({ operation: 'create', data, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects updates, deletes and forged creator identities in lifecycle hooks', async () => {
    await expect(
      validateReleaseRecord({ operation: 'update', data: validRelease, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(APIError)
    await expect(
      validateReleaseRecord({ operation: 'create', data: { ...validRelease, createdBy: 2 }, req: { user: owner } } as never),
    ).rejects.toBeInstanceOf(ValidationError)
    await expect(enforceImmutableReleaseDelete({ req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
  })
})
