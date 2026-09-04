import type { CollectionConfig, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { Articles } from './Articles'
import { Media } from './Media'
import { Pages, pageBlocks } from './Pages'
import { Projects } from './Projects'

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
  it.each([Projects, Articles, Pages, Media])(
    '$slug exposes only published documents and keeps bounded owner history',
    (collection) => expectEditorialPolicy(collection),
  )

  it('makes projects and pages manually orderable', () => {
    expect(Projects.orderable).toBe(true)
    expect(Pages.orderable).toBe(true)
    expect(Articles.orderable).not.toBe(true)
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
