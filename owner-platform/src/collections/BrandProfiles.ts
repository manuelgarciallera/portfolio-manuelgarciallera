import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type SelectField,
} from 'payload'

import { BRAND_COLOR_ROLES, MOTION_EASINGS, REDUCED_MOTION_BEHAVIORS } from '../brand/model'
import { normalizeHex, validateBrandProfile } from '../brand/validation'
import { editorialAccess, editorialVersions, slugField } from './shared'

const roleOptions: NonNullable<SelectField['options']> = BRAND_COLOR_ROLES.map((role) => ({
  label: role,
  value: role,
}))

export const validateBrandProfilePublication: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data
  const normalized: Record<string, unknown> = { ...data }
  if (Array.isArray(data.colors)) {
    normalized.colors = data.colors.map((entry: { role?: string; value?: string }) => {
      if (typeof entry.value !== 'string') return entry
      try {
        return { ...entry, value: normalizeHex(entry.value) }
      } catch {
        return entry
      }
    })
  }
  // Payload explicitly marks draft saves before collection hooks. Publish creates and
  // updates may arrive without `_status`, so every non-draft path must validate.
  if (normalized._status === 'draft') return normalized

  const completeDocument = { ...(originalDoc ?? {}), ...normalized }
  const errors = validateBrandProfile(completeDocument as never)
  if (errors.length > 0) {
    throw new ValidationError({
      collection: 'brand-profiles',
      errors: errors.map((message) => ({ message, path: 'brandProfile' })),
      req,
    })
  }
  return normalized
}

export const BrandProfiles: CollectionConfig = {
  slug: 'brand-profiles',
  admin: {
    defaultColumns: ['name', '_status', 'updatedAt'],
    useAsTitle: 'name',
  },
  access: editorialAccess,
  hooks: { beforeValidate: [validateBrandProfilePublication] },
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    {
      name: 'colors',
      type: 'array',
      admin: { description: 'Roles semánticos. Se validan completamente al publicar.' },
      fields: [
        { name: 'role', type: 'select', options: roleOptions, required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'usageWeights',
      type: 'array',
      admin: { description: 'Objetivos compositivos; deben sumar 100 al publicar.' },
      fields: [
        { name: 'role', type: 'select', options: roleOptions, required: true },
        { name: 'weight', type: 'number', min: 0, max: 100, required: true },
      ],
    },
    {
      name: 'typography',
      type: 'group',
      fields: [
        { name: 'primaryFamily', type: 'text' },
        { name: 'secondaryFamily', type: 'text' },
        { name: 'fontAssets', type: 'upload', relationTo: 'media', hasMany: true },
      ],
    },
    {
      name: 'assets',
      type: 'group',
      fields: [
        { name: 'logos', type: 'upload', relationTo: 'media', hasMany: true },
        { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
        { name: 'icons', type: 'upload', relationTo: 'media', hasMany: true },
      ],
    },
    { name: 'voiceNotes', type: 'textarea' },
    {
      name: 'motion',
      type: 'group',
      fields: [
        { name: 'duration', type: 'number', min: 150, max: 1600 },
        { name: 'stagger', type: 'number', min: 0, max: 500 },
        { name: 'travel', type: 'number', min: 0, max: 80 },
        {
          name: 'easing',
          type: 'select',
          options: MOTION_EASINGS.map((value) => ({ label: value, value })),
        },
        {
          name: 'reducedMotion',
          type: 'select',
          options: REDUCED_MOTION_BEHAVIORS.map((value) => ({ label: value, value })),
        },
      ],
    },
  ],
}
