import { ValidationError, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { MediaPlacements, validateMediaPlacement } from './MediaPlacements'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  MediaPlacements.fields.find((field) => 'name' in field && field.name === name)

describe('MediaPlacements collection', () => {
  it('keeps reversible owner editing, bounded history and published-only reads', () => {
    expect(MediaPlacements.slug).toBe('media-placements')
    expect(MediaPlacements.versions).toEqual({
      drafts: { autosave: false, validate: true },
      maxPerDoc: 25,
    })
    expect(MediaPlacements.trash).toBe(true)
    expect(MediaPlacements.access?.read?.(accessArgs(owner))).toBe(true)
    expect(MediaPlacements.access?.read?.(accessArgs(null))).toEqual({
      and: [{ _status: { equals: 'published' } }, { deletedAt: { exists: false } }],
    })
  })

  it('stores an original asset and bounded placement controls instead of destructive crops', () => {
    expect(fieldNamed('name')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('placement')).toMatchObject({ type: 'group' })
    const serialized = JSON.stringify(MediaPlacements.fields)
    expect(serialized).toContain('focalX')
    expect(serialized).toContain('focalY')
    expect(serialized).toContain('zoom')
    expect(serialized).toContain('mobile')
    expect(serialized).toContain('tablet')
    expect(serialized).toContain('./components/MediaPlacementEditor#MediaPlacementEditor')
    expect(serialized).not.toMatch(/(?:customCSS|javascript|html|codeEditor)/i)
  })

  it('normalizes safe defaults while preserving the original media relationship', async () => {
    await expect(
      validateMediaPlacement({
        data: { name: 'Hero mobile', placement: { asset: 7 } },
      } as never),
    ).resolves.toMatchObject({
      name: 'Hero mobile',
      placement: {
        asset: 7,
        fit: 'cover',
        focalX: 0.5,
        focalY: 0.5,
        frame: 'auto',
        overrides: {},
        zoom: 1,
      },
    })
  })

  it('rejects executable or out-of-range placement data with a field error', async () => {
    await expect(
      validateMediaPlacement({
        data: { name: 'Unsafe', placement: { asset: 7, zoom: 99, customCSS: 'img{}' } },
      } as never),
    ).rejects.toBeInstanceOf(ValidationError)
    await expect(
      validateMediaPlacement({ data: { name: 'Missing', placement: null } } as never),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'placement' })] },
    })
  })
})
