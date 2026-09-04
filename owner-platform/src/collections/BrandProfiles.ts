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
  const invalidData = (messages: string | string[]): never => {
    const errors = Array.isArray(messages) ? messages : [messages]
    throw new ValidationError({
      collection: 'brand-profiles',
      errors: errors.map((message) => ({ message, path: 'brandProfile' })),
      req,
    })
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return invalidData('El perfil de marca debe ser un objeto.')
  const normalized: Record<string, unknown> = { ...data }
  if (Array.isArray(data.colors)) {
    normalized.colors = data.colors.map((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return entry
      if (typeof (entry as Record<string, unknown>).value !== 'string') return entry
      try {
        return { ...entry, value: normalizeHex((entry as Record<string, unknown>).value) }
      } catch {
        return entry
      }
    })
  }
  const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
  const shapeErrors: string[] = []
  if (Object.hasOwn(normalized, 'colors')) {
    if (!Array.isArray(normalized.colors)) shapeErrors.push('Los colores semánticos deben ser una lista.')
    else if (
      normalized.colors.some(
        (entry) =>
          !isPlainRecord(entry) || typeof entry.role !== 'string' || typeof entry.value !== 'string',
      )
    )
      shapeErrors.push('Cada color semántico debe ser un objeto con rol y valor de texto.')
  }
  if (Object.hasOwn(normalized, 'usageWeights')) {
    if (!Array.isArray(normalized.usageWeights))
      shapeErrors.push('Los porcentajes de uso deben ser una lista.')
    else if (
      normalized.usageWeights.some(
        (entry) =>
          !isPlainRecord(entry) || typeof entry.role !== 'string' || typeof entry.weight !== 'number',
      )
    )
      shapeErrors.push('Cada porcentaje de uso debe ser un objeto con rol y peso numérico.')
  }
  for (const key of ['motion', 'typography', 'assets'] as const) {
    const value = normalized[key]
    if (Object.hasOwn(normalized, key) && value !== null && !isPlainRecord(value))
      shapeErrors.push(`El grupo "${key}" debe ser un objeto o null.`)
  }
  if (shapeErrors.length > 0) invalidData(shapeErrors)
  const original =
    isPlainRecord(originalDoc)
      ? (originalDoc as Record<string, unknown>)
      : {}
  for (const key of ['motion', 'typography', 'assets'] as const) {
    const incoming = normalized[key]
    const previous = original[key]
    if (
      Object.hasOwn(normalized, key) &&
      isPlainRecord(incoming) &&
      isPlainRecord(previous)
    ) {
      normalized[key] = { ...previous, ...incoming }
    }
  }
  // Payload explicitly marks draft saves before collection hooks. Publish creates and
  // updates may arrive without `_status`, so every non-draft path must validate.
  if (normalized._status === 'draft') return normalized

  const completeDocument = { ...original, ...normalized }
  const errors = validateBrandProfile(completeDocument)
  if (errors.length > 0) {
    invalidData(errors)
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
