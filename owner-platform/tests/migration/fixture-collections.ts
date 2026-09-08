import type { CollectionConfig } from 'payload'

import { AuditEvents } from '../../src/collections/AuditEvents'
import { Media } from '../../src/collections/Media'
import { PreviewSnapshots } from '../../src/collections/PreviewSnapshots'
import { editorialAccess, editorialVersions } from '../../src/collections/shared'
import { ownerOnly } from '../../src/access/owner'

export const preparedMedia = (staticDir: string): CollectionConfig => {
  const upload = typeof Media.upload === 'object' ? Media.upload : {}
  return {
    ...Media,
    fields: [
      ...Media.fields,
      { name: 'storageRevision', type: 'text', admin: { readOnly: true } },
      { name: 'url', type: 'text', admin: { hidden: true, readOnly: true } },
    ],
    upload: { ...upload, disableLocalStorage: false, staticDir },
  }
}

export const legacyMedia = (staticDir: string): CollectionConfig => {
  const upload = typeof Media.upload === 'object' ? Media.upload : {}
  return { ...Media, upload: { ...upload, disableLocalStorage: false, staticDir } }
}

export const MediaMigrationResolutions: CollectionConfig = {
  slug: 'media-migration-resolutions',
  access: { create: ownerOnly, read: ownerOnly, update: () => false, delete: () => false },
  hooks: {
    beforeChange: [({ operation, data }) => {
      if (operation !== 'create') throw new Error('QA media migration resolutions are append-only.')
      return data
    }],
    beforeDelete: [() => { throw new Error('QA media migration resolutions are append-only.') }],
  },
  fields: [
    { name: 'snapshotId', type: 'text', required: true, index: true },
    { name: 'manifestHash', type: 'text', required: true, index: true },
    { name: 'mediaId', type: 'text', required: true, index: true },
    { name: 'filename', type: 'text', required: true },
    { name: 'storageRevision', type: 'text', required: true },
  ],
}

export const migrationFixtureCollections: CollectionConfig[] = [
  PreviewSnapshots,
  AuditEvents,
  {
    slug: 'pages',
    access: editorialAccess,
    versions: editorialVersions,
    fields: [
      { name: 'title', type: 'text' },
      { name: 'brandProfile', type: 'relationship', relationTo: 'brand-profiles' },
      { name: 'layout', type: 'json' },
    ],
  },
  {
    slug: 'brand-profiles',
    access: editorialAccess,
    fields: [
      { name: 'colors', type: 'json' },
      { name: 'usageWeights', type: 'json' },
      { name: 'motion', type: 'json' },
    ],
  },
]

export const preparedFixtureCollections = [...migrationFixtureCollections, MediaMigrationResolutions]
