import type { CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'
import { seoField } from './seo'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', '_status', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: editorialAccess,
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', required: true },
    { name: 'publishedAt', type: 'date' },
    seoField,
  ],
}
