import { ValidationError, type CollectionConfig, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { BrandProfiles, validateBrandProfilePublication } from './BrandProfiles'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  BrandProfiles.fields.find((field) => 'name' in field && field.name === name)

const validProfile = {
  _status: 'published',
  colors: [
    { role: 'background', value: '#000000' },
    { role: 'surface', value: '#111111' },
    { role: 'text', value: '#FFFFFF' },
    { role: 'mutedText', value: '#AAAAAA' },
    { role: 'accent', value: '#FF4B44' },
    { role: 'interaction', value: '#00D4E6' },
    { role: 'success', value: '#21A366' },
    { role: 'danger', value: '#FF4B44' },
  ],
  usageWeights: [
    { role: 'background', weight: 70 },
    { role: 'surface', weight: 20 },
    { role: 'text', weight: 8 },
    { role: 'accent', weight: 2 },
  ],
  motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
}

describe('BrandProfiles collection', () => {
  it('uses the editorial owner, publication, version, trash and ordering policy', () => {
    expect(BrandProfiles.slug).toBe('brand-profiles')
    expect(BrandProfiles.orderable).toBe(true)
    expect(BrandProfiles.trash).toBe(true)
    expect(BrandProfiles.versions).toEqual({ drafts: { autosave: false, validate: true }, maxPerDoc: 25 })
    expect(BrandProfiles.access?.read?.(accessArgs(null))).toEqual({
      and: [{ _status: { equals: 'published' } }, { deletedAt: { exists: false } }],
    })
    expect(BrandProfiles.access?.read?.(accessArgs(owner))).toBe(true)
    expect(BrandProfiles.access?.readVersions?.(accessArgs(null))).toBe(false)
    expect(BrandProfiles.access?.readVersions?.(accessArgs(owner))).toBe(true)
    expect(BrandProfiles.access?.create?.(accessArgs(null))).toBe(false)
    expect(BrandProfiles.access?.update?.(accessArgs(null))).toBe(false)
    expect(BrandProfiles.access?.delete?.(accessArgs(null))).toBe(false)
  })

  it('defines identity, semantic colors, usage, typography, assets, voice and bounded motion fields', () => {
    expect(fieldNamed('name')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('slug')).toMatchObject({ type: 'text', required: true, unique: true })
    expect(fieldNamed('colors')).toMatchObject({ type: 'array' })
    expect(fieldNamed('usageWeights')).toMatchObject({ type: 'array' })
    expect(fieldNamed('typography')).toMatchObject({ type: 'group' })
    expect(fieldNamed('assets')).toMatchObject({ type: 'group' })
    expect(fieldNamed('voiceNotes')).toMatchObject({ type: 'textarea' })
    expect(fieldNamed('motion')).toMatchObject({ type: 'group' })
    expect(JSON.stringify(BrandProfiles.fields)).not.toMatch(/(?:customCSS|javascript|html|codeEditor)/i)
  })

  it('allows incomplete drafts but rejects invalid publication with actionable errors', async () => {
    await expect(
      validateBrandProfilePublication({ data: { _status: 'draft', colors: [] } } as never),
    ).resolves.toMatchObject({ _status: 'draft' })
    const invalidPublication = validateBrandProfilePublication({
      data: { ...validProfile, usageWeights: [{ role: 'background', weight: 99 }] },
    } as never)
    await expect(invalidPublication).rejects.toBeInstanceOf(ValidationError)
    await expect(invalidPublication).rejects.toMatchObject({
      status: 400,
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringMatching(/exactamente 100/i),
            path: 'brandProfile',
          }),
        ]),
      },
    })
    await expect(validateBrandProfilePublication({ data: validProfile } as never)).resolves.toEqual(
      validProfile,
    )
  })

  it('normalizes color values before persistence', async () => {
    const result = await validateBrandProfilePublication({
      data: {
        _status: 'draft',
        colors: [{ role: 'accent', value: '#abc' }],
      },
    } as never)
    expect(result.colors).toEqual([{ role: 'accent', value: '#AABBCC' }])
  })

  it('validates a partial publication update against the existing document', async () => {
    await expect(
      validateBrandProfilePublication({
        data: { _status: 'published', voiceNotes: 'Nueva guía verbal' },
        originalDoc: validProfile,
      } as never),
    ).resolves.toMatchObject({ _status: 'published', voiceNotes: 'Nueva guía verbal' })
  })

  it('treats Payload creates without an explicit status as publication attempts', async () => {
    const publicationData: Partial<typeof validProfile> = { ...validProfile }
    delete publicationData._status
    await expect(validateBrandProfilePublication({ data: publicationData } as never)).resolves.toEqual(
      publicationData,
    )
    await expect(
      validateBrandProfilePublication({ data: { ...publicationData, colors: [] } } as never),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})

const typedCollection: CollectionConfig = BrandProfiles
void typedCollection
