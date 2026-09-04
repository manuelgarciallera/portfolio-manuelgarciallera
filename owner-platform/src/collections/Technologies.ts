import type { CollectionConfig, TextFieldValidation } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'

export const validateTechnologyColor: TextFieldValidation = (value) => {
  if (value === undefined || value === null || value === '') return true
  return /^#[0-9A-F]{6}$/i.test(String(value)) || 'Usa un color hexadecimal completo (#RRGGBB).'
}

export const validateOfficialTechnologyUrl: TextFieldValidation = (value) => {
  if (value === undefined || value === null || value === '') return true
  try {
    const url = new URL(String(value))
    return url.protocol === 'https:' || 'La URL oficial debe usar HTTPS.'
  } catch {
    return 'La URL oficial debe usar HTTPS.'
  }
}

export const Technologies: CollectionConfig = {
  slug: 'technologies',
  admin: { defaultColumns: ['name', 'slug', '_status', 'updatedAt'], useAsTitle: 'name' },
  access: editorialAccess,
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 80 },
    slugField,
    { name: 'icon', type: 'upload', relationTo: 'media', required: true },
    { name: 'brandColor', type: 'text', validate: validateTechnologyColor },
    { name: 'officialUrl', type: 'text', validate: validateOfficialTechnologyUrl },
  ],
}
