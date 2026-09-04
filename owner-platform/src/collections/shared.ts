import type { CollectionConfig } from 'payload'

import { ownerOnly } from '../access/owner'
import { ownerOrPublished, ownerReadVersions } from '../access/published'

export const EDITORIAL_VERSION_LIMIT = 25

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
