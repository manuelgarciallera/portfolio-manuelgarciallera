import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions } from './shared'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    defaultColumns: ['filename', 'alt', '_status', 'updatedAt'],
    useAsTitle: 'alt',
  },
  access: editorialAccess,
  trash: true,
  versions: editorialVersions,
  upload: {
    filesRequiredOnCreate: true,
    focalPoint: true,
    imageSizes: [
      { name: 'small', width: 480, withoutEnlargement: true },
      { name: 'medium', width: 960, withoutEnlargement: true },
      { name: 'large', width: 1600, withoutEnlargement: true },
    ],
    mimeTypes: ['image/*'],
    pasteURL: false,
    staticDir: path.resolve(dirname, '../../media'),
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'textarea' },
    { name: 'credit', type: 'text' },
  ],
}
