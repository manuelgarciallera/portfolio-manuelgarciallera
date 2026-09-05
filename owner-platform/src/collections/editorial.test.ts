import { ValidationError, type CollectionConfig, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Articles, articleBlocks } from './Articles'
import { Media } from './Media'
import { Pages, pageBlocks, validatePageBrandPublication } from './Pages'
import { Projects, projectBlocks } from './Projects'
import { Technologies, validateOfficialTechnologyUrl, validateTechnologyColor } from './Technologies'
import { seoField, validateCanonicalUrl } from './seo'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never

const fieldNamed = (collection: CollectionConfig, name: string): Field | undefined =>
  collection.fields.find((field) => 'name' in field && field.name === name)

const expectEditorialPolicy = (collection: CollectionConfig) => {
  expect(collection.versions).toEqual({
    drafts: { autosave: false, validate: true },
    maxPerDoc: 25,
  })
  expect(collection.trash).toBe(true)
  expect(collection.access?.read?.(accessArgs(null))).toEqual({
    and: [
      { _status: { equals: 'published' } },
      { deletedAt: { exists: false } },
    ],
  })
  expect(collection.access?.read?.(accessArgs(owner))).toBe(true)
  expect(collection.access?.readVersions?.(accessArgs(null))).toBe(false)
  expect(collection.access?.readVersions?.(accessArgs(owner))).toBe(true)
  expect(collection.access?.create?.(accessArgs(null))).toBe(false)
  expect(collection.access?.update?.(accessArgs(null))).toBe(false)
  expect(collection.access?.delete?.(accessArgs(null))).toBe(false)
  expect(collection.access?.create?.(accessArgs(owner))).toBe(true)
  expect(collection.access?.update?.(accessArgs(owner))).toBe(true)
  expect(collection.access?.delete?.(accessArgs(owner))).toBe(true)
}

describe('editorial collections', () => {
  it.each([Projects, Articles, Pages, Technologies, Media])(
    '$slug exposes only published documents and keeps bounded owner history',
    (collection) => expectEditorialPolicy(collection),
  )

  it('makes projects, articles, pages and the technology catalog manually orderable', () => {
    expect(Projects.orderable).toBe(true)
    expect(Pages.orderable).toBe(true)
    expect(Articles.orderable).toBe(true)
    expect(Technologies.orderable).toBe(true)
    expect(Media.orderable).not.toBe(true)
  })

  it('requires the editorial identity fields', () => {
    expect(fieldNamed(Projects, 'title')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed(Projects, 'slug')).toMatchObject({ type: 'text', required: true, unique: true })
    expect(fieldNamed(Articles, 'title')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed(Articles, 'slug')).toMatchObject({ type: 'text', required: true, unique: true })
    expect(fieldNamed(Pages, 'title')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed(Pages, 'slug')).toMatchObject({ type: 'text', required: true, unique: true })
  })

  it('adds optional, shared and bounded SEO metadata without changing publication requirements', () => {
    for (const collection of [Projects, Articles, Pages]) {
      const seo = fieldNamed(collection, 'seo')
      expect(seo).toBe(seoField)
      expect(seo).toMatchObject({ type: 'group', required: false })
    }
    if (seoField.type !== 'group') throw new Error('seoField must be a group')
    const fields = Object.fromEntries(seoField.fields.filter((field) => 'name' in field).map((field) => [field.name, field]))
    expect(fields.title).toMatchObject({ type: 'text', maxLength: 70 })
    expect(fields.description).toMatchObject({ type: 'textarea', maxLength: 180 })
    expect(fields.socialImage).toMatchObject({ type: 'upload', relationTo: 'media' })
    expect(fields.noIndex).toMatchObject({ type: 'checkbox', defaultValue: false })
  })

  it('accepts only credential-free HTTPS canonical URLs without fragments', () => {
    expect(validateCanonicalUrl(undefined, {} as never)).toBe(true)
    expect(validateCanonicalUrl('https://portfolio.example/casos/demo', {} as never)).toBe(true)
    expect(validateCanonicalUrl('http://portfolio.example/demo', {} as never)).toMatch(/https/i)
    expect(validateCanonicalUrl('https://user:secret@portfolio.example/demo', {} as never)).toMatch(/credencial/i)
    expect(validateCanonicalUrl('https://portfolio.example/demo#private', {} as never)).toMatch(/fragmento/i)
  })

  it('allows project and page media to opt into reusable non-destructive placement recipes', () => {
    expect(fieldNamed(Projects, 'heroPlacement')).toMatchObject({
      type: 'relationship',
      relationTo: 'media-placements',
    })
    const mediaBlock = pageBlocks.find((block) => block.slug === 'media')
    const placement = mediaBlock?.fields.find(
      (field) => 'name' in field && field.name === 'placement',
    )
    expect(placement).toMatchObject({
      type: 'relationship',
      relationTo: 'media-placements',
    })
  })

  it('adds a migration-safe reusable technology stack without removing legacy data', () => {
    expect(fieldNamed(Projects, 'technologies')).toMatchObject({ type: 'array' })
    expect(fieldNamed(Projects, 'technologyStack')).toMatchObject({
      type: 'relationship', relationTo: 'technologies', hasMany: true,
    })
    expect(fieldNamed(Projects, 'technologyStack')).not.toHaveProperty('required', true)
    expect(fieldNamed(Technologies, 'name')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed(Technologies, 'icon')).toMatchObject({ type: 'upload', relationTo: 'media', required: true })
  })

  it('adds a migration-safe reorderable project block canvas', () => {
    expect(fieldNamed(Projects, 'body')).toMatchObject({ type: 'richText', required: true })
    const layout = fieldNamed(Projects, 'caseStudyLayout')
    expect(layout).toMatchObject({ type: 'blocks', required: false })
    if (!layout || layout.type !== 'blocks') throw new Error('Projects.caseStudyLayout must be blocks')
    expect(layout.blocks).toBe(projectBlocks)
    expect(projectBlocks.map((block) => block.slug)).toEqual([
      'caseSection', 'caseMedia', 'caseGallery', 'caseQuote', 'caseMetrics', 'caseFeature',
    ])
    expect(JSON.stringify(projectBlocks)).not.toMatch(/\b(?:customCSS|javascript|html|codeEditor|embed)\b/i)
  })

  it('keeps project media blocks non-destructive and accessible', () => {
    const media = projectBlocks.find((block) => block.slug === 'caseMedia')
    expect(media?.fields.find((field) => 'name' in field && field.name === 'asset')).toMatchObject({ type: 'upload', relationTo: 'media', required: true })
    expect(media?.fields.find((field) => 'name' in field && field.name === 'placement')).toMatchObject({ type: 'relationship', relationTo: 'media-placements' })
    expect(media?.fields.find((field) => 'name' in field && field.name === 'alt')).toMatchObject({ type: 'text', required: true })
  })

  it('adds a migration-safe reorderable article block canvas', () => {
    expect(fieldNamed(Articles, 'content')).toMatchObject({ type: 'richText', required: true })
    const layout = fieldNamed(Articles, 'articleLayout')
    expect(layout).toMatchObject({ type: 'blocks', required: false })
    if (!layout || layout.type !== 'blocks') throw new Error('Articles.articleLayout must be blocks')
    expect(layout.blocks).toBe(articleBlocks)
    expect(articleBlocks.map((block) => block.slug)).toEqual([
      'articleText', 'articleMedia', 'articleGallery', 'articleQuote', 'articleCallout', 'relatedProjects',
    ])
    expect(JSON.stringify(articleBlocks)).not.toMatch(/\b(?:customCSS|javascript|html|codeEditor|embed)\b/i)
  })

  it('keeps article media blocks non-destructive and accessible', () => {
    const media = articleBlocks.find((block) => block.slug === 'articleMedia')
    expect(media?.fields.find((field) => 'name' in field && field.name === 'asset')).toMatchObject({ type: 'upload', relationTo: 'media', required: true })
    expect(media?.fields.find((field) => 'name' in field && field.name === 'placement')).toMatchObject({ type: 'relationship', relationTo: 'media-placements' })
    expect(media?.fields.find((field) => 'name' in field && field.name === 'alt')).toMatchObject({ type: 'text', required: true })
  })

  it('constrains technology brand metadata to safe values', () => {
    expect(validateTechnologyColor('#61DAFB', {} as never)).toBe(true)
    expect(validateTechnologyColor(undefined, {} as never)).toBe(true)
    expect(validateTechnologyColor('red', {} as never)).toMatch(/hex/i)
    expect(validateOfficialTechnologyUrl('https://react.dev/', {} as never)).toBe(true)
    expect(validateOfficialTechnologyUrl('http://react.dev/', {} as never)).toMatch(/https/i)
    expect(validateOfficialTechnologyUrl('javascript:alert(1)', {} as never)).toMatch(/https/i)
    expect(fieldNamed(Technologies, 'brandColor')).toMatchObject({
      admin: { components: { Field: './components/HexColorField#HexColorField' } },
      type: 'text',
    })
  })

  it('adds a migration-safe brand relationship and controlled page overrides', () => {
    expect(fieldNamed(Pages, 'brandProfile')).toMatchObject({
      type: 'relationship',
      relationTo: 'brand-profiles',
    })
    expect(fieldNamed(Pages, 'brandProfile')).not.toHaveProperty('required', true)
    const overrides = fieldNamed(Pages, 'brandOverrides')
    expect(overrides).toMatchObject({ type: 'group' })
    if (!overrides || overrides.type !== 'group') throw new Error('Pages.brandOverrides must be a group')
    expect(overrides.fields.map((field) => ('name' in field ? field.name : undefined))).toEqual([
      'accent',
      'surface',
      'usageWeights',
      'motion',
    ])
    for (const name of ['accent', 'surface']) {
      expect(overrides.fields.find((field) => 'name' in field && field.name === name)).toMatchObject({
        admin: { components: { Field: './components/HexColorField#HexColorField' } },
        type: 'text',
      })
    }
    expect(JSON.stringify(overrides)).not.toMatch(/(?:customCSS|javascript|html|codeEditor)/i)
  })

  it('requires a brand for every published page, including draft transitions', async () => {
    await expect(
      validatePageBrandPublication({ data: { _status: 'published' } } as never),
    ).rejects.toBeInstanceOf(Error)
    await expect(
      validatePageBrandPublication({
        data: { _status: 'published', title: 'Publish draft' },
        originalDoc: { id: 7, _status: 'draft', title: 'Draft', brandProfile: null },
      } as never),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'brandProfile' })] },
    })
    await expect(
      validatePageBrandPublication({
        data: { brandProfile: null },
        originalDoc: { id: 8, _status: 'published', brandProfile: 3 },
      } as never),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'brandProfile' })] },
    })
  })

  it('rejects malformed page brand overrides and resolves valid related profiles', async () => {
    await expect(
      validatePageBrandPublication({
        data: { _status: 'draft', brandOverrides: { customCSS: 'body{}' } },
      } as never),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'brandOverrides' })] },
    })
    await expect(
      validatePageBrandPublication({
        data: { _status: 'draft', brandOverrides: { motion: { duration: 1 } } },
      } as never),
    ).rejects.toBeInstanceOf(Error)

    const profile = {
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
    await expect(
      validatePageBrandPublication({
        data: { _status: 'published', brandProfile: 3, brandOverrides: { accent: '#0df' } },
        req: { payload: { findByID: async () => profile } },
      } as never),
    ).resolves.toMatchObject({ brandOverrides: { accent: '#00DDFF' } })
  })

  it('preserves explicit override deletion instead of restoring stale nested values', async () => {
    await expect(
      validatePageBrandPublication({
        data: { _status: 'draft', brandOverrides: null },
        originalDoc: { id: 7, brandOverrides: { accent: '#FF4B44' } },
      } as never),
    ).resolves.toMatchObject({ brandOverrides: null })

    await expect(
      validatePageBrandPublication({
        data: { _status: 'draft', brandOverrides: { accent: null, motion: { duration: null } } },
        originalDoc: {
          id: 7,
          brandOverrides: { accent: '#FF4B44', motion: { duration: 700, travel: 20 } },
        },
      } as never),
    ).resolves.toMatchObject({
      brandOverrides: { accent: null, motion: { travel: 20 } },
    })
  })

  it('validates create and partial-update publication lifecycles for expanded and id relationships', async () => {
    const profile = {
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

    await expect(
      validatePageBrandPublication({ data: { title: 'Create', brandProfile: profile } } as never),
    ).resolves.toMatchObject({ title: 'Create', brandProfile: profile })

    await expect(
      validatePageBrandPublication({
        data: { title: 'Partial update' },
        originalDoc: { id: 9, _status: 'published', brandProfile: 3 },
        req: { payload: { findByID: async ({ id }: { id: number }) => (id === 3 ? profile : null) } },
      } as never),
    ).resolves.toMatchObject({ title: 'Partial update' })
  })

  it('converts relationship lookup failures into a safe validation error', async () => {
    const attempt = validatePageBrandPublication({
      data: { _status: 'published', brandProfile: 999 },
      req: {
        payload: {
          findByID: async () => {
            throw new Error('postgres://owner:secret@private-host')
          },
        },
      },
    } as never)
    await expect(attempt).rejects.toBeInstanceOf(ValidationError)
    await expect(attempt).rejects.not.toMatchObject({
      data: { errors: [expect.objectContaining({ message: expect.stringContaining('private-host') })] },
    })
    await expect(attempt).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'brandProfile' })] },
    })
  })

  it('attributes malformed related brands to brandProfile', async () => {
    await expect(
      validatePageBrandPublication({
        data: { _status: 'published', brandProfile: { colors: [] } },
      } as never),
    ).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'brandProfile' })] },
    })
  })

  it('uses only the approved page block catalog', () => {
    expect(pageBlocks.map((block) => block.slug)).toEqual([
      'hero',
      'richText',
      'projectGrid',
      'media',
      'customFeature',
    ])

    const layout = fieldNamed(Pages, 'layout')
    expect(layout).toMatchObject({ type: 'blocks', required: true })
    if (!layout || layout.type !== 'blocks') throw new Error('Pages.layout must be blocks')
    expect(layout.blocks).toBe(pageBlocks)
    expect(JSON.stringify(pageBlocks)).not.toMatch(/\b(?:code|css|javascript|html)\b/i)
  })

  it('defines a constrained custom feature reference', () => {
    const customFeature = pageBlocks.find((block) => block.slug === 'customFeature')
    const featureKey = customFeature?.fields.find(
      (field) => 'name' in field && field.name === 'featureKey',
    )
    expect(featureKey).toMatchObject({
      type: 'select',
      required: true,
      options: [
        { label: 'Project reel', value: 'project-reel' },
        { label: 'Research index', value: 'research-index' },
        { label: 'Contact panel', value: 'contact-panel' },
      ],
    })
  })
})

describe('media collection', () => {
  it('preserves originals and creates focal-point responsive derivatives', () => {
    expect(Media.upload).toMatchObject({
      focalPoint: true,
      filesRequiredOnCreate: true,
      mimeTypes: ['image/*'],
      pasteURL: false,
    })
    expect(Media.upload).not.toHaveProperty('resizeOptions')
    if (!Media.upload || Media.upload === true) throw new Error('Media.upload must be configured')
    expect(Media.upload.imageSizes).toEqual([
      expect.objectContaining({ name: 'small', width: 480, withoutEnlargement: true }),
      expect.objectContaining({ name: 'medium', width: 960, withoutEnlargement: true }),
      expect.objectContaining({ name: 'large', width: 1600, withoutEnlargement: true }),
    ])
  })

  it('requires accessible alternative text', () => {
    expect(fieldNamed(Media, 'alt')).toMatchObject({ type: 'text', required: true })
  })
})
