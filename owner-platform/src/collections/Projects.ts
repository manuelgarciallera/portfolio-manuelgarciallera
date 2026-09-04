import type { CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    defaultColumns: ['title', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: editorialAccess,
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'summary', type: 'textarea', required: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'heroPlacement',
      type: 'relationship',
      relationTo: 'media-placements',
      admin: {
        description: 'Encuadre no destructivo opcional para la imagen principal.',
      },
    },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'technologies',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'icon', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'year', type: 'number' },
  ],
}
