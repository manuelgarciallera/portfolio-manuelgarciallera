import type { CollectionConfig, UIField } from 'payload'

import { ownerOnly } from '../access/owner'
import { ownerOrPublished, ownerReadVersions } from '../access/published'

export const EDITORIAL_VERSION_LIMIT = 25

// Keep explanatory preview content in the document flow. Payload's action
// toolbar has a fixed mobile height and cannot safely contain paragraphs.
export const editorialPreviewField: UIField = {
  name: 'editorialPreview',
  type: 'ui',
  admin: {
    disableListColumn: true,
    components: { Field: './components/PagePreviewLink#PagePreviewLink' },
  },
}

export const editorialAccess: NonNullable<CollectionConfig['access']> = {
  create: ownerOnly,
  delete: ownerOnly,
  read: ownerOrPublished,
  readVersions: ownerReadVersions,
  update: ownerOnly,
}

export const editorialVersions: NonNullable<CollectionConfig['versions']> = {
  drafts: {
    autosave: false,
    validate: true,
  },
  maxPerDoc: EDITORIAL_VERSION_LIMIT,
}

export const slugField = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
} as const
