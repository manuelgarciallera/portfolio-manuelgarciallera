import type { GroupField, TextFieldValidation } from 'payload'

export const validateCanonicalUrl: TextFieldValidation = (value) => {
  if (value === undefined || value === null || value === '') return true
  let url: URL
  try { url = new URL(String(value)) } catch { return 'La URL canonical debe usar HTTPS.' }
  if (url.protocol !== 'https:') return 'La URL canonical debe usar HTTPS.'
  if (url.username || url.password) return 'La URL canonical no puede contener credenciales.'
  if (url.hash) return 'La URL canonical no puede contener fragmentos.'
  return true
}

export const seoField: GroupField = {
  name: 'seo',
  type: 'group',
  required: false,
  admin: { description: 'Metadatos opcionales. No afectan al sitio público hasta activar el puente editorial.' },
  fields: [
    { name: 'title', type: 'text', maxLength: 70 },
    { name: 'description', type: 'textarea', maxLength: 180 },
    { name: 'canonicalUrl', type: 'text', validate: validateCanonicalUrl },
    { name: 'socialImage', type: 'upload', relationTo: 'media' },
    { name: 'noIndex', type: 'checkbox', defaultValue: false },
  ],
}
