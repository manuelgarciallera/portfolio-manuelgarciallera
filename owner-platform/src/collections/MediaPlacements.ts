import { ValidationError, type CollectionBeforeValidateHook, type CollectionConfig, type Field } from 'payload'

import { editorialAccess, editorialVersions } from './shared'
import { MEDIA_FITS, MEDIA_FRAMES, normalizeMediaPlacement } from '../media/placement'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const selectOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }))

const overrideFields = (): Field[] => [
  { name: 'focalX', type: 'number', min: 0, max: 1 },
  { name: 'focalY', type: 'number', min: 0, max: 1 },
  { name: 'zoom', type: 'number', min: 1, max: 4 },
  { name: 'fit', type: 'select', options: selectOptions(MEDIA_FITS) },
  { name: 'frame', type: 'select', options: selectOptions(MEDIA_FRAMES) },
]

export const validateMediaPlacement: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!isRecord(data)) {
    throw new ValidationError({
      collection: 'media-placements',
      errors: [{ message: 'La colocación debe ser un objeto.', path: 'placement' }],
      req,
    })
  }
  if (!Object.hasOwn(data, 'placement')) return data

  const incoming = data.placement
  const previous = isRecord(originalDoc) && isRecord(originalDoc.placement) ? originalDoc.placement : {}
  if (!isRecord(incoming)) {
    throw new ValidationError({
      collection: 'media-placements',
      errors: [{ message: 'Configura una colocación de imagen válida.', path: 'placement' }],
      req,
    })
  }

  const merged: Record<string, unknown> = { ...previous, ...incoming }
  if (isRecord(previous.overrides) || isRecord(incoming.overrides)) {
    const previousOverrides = isRecord(previous.overrides) ? previous.overrides : {}
    const incomingOverrides = isRecord(incoming.overrides) ? incoming.overrides : {}
    merged.overrides = {
      ...previousOverrides,
      ...incomingOverrides,
      ...Object.fromEntries(
        ['mobile', 'tablet'].flatMap((breakpoint) => {
          const oldValue = previousOverrides[breakpoint]
          const newValue = incomingOverrides[breakpoint]
          return isRecord(newValue)
            ? [[breakpoint, { ...(isRecord(oldValue) ? oldValue : {}), ...newValue }]]
            : []
        }),
      ),
    }
  }

  try {
    return { ...data, placement: normalizeMediaPlacement(merged) }
  } catch (error) {
    throw new ValidationError({
      collection: 'media-placements',
      errors: [{ message: error instanceof Error ? error.message : 'La colocación no es válida.', path: 'placement' }],
      req,
    })
  }
}

export const MediaPlacements: CollectionConfig = {
  slug: 'media-placements',
  admin: {
    defaultColumns: ['name', '_status', 'updatedAt'],
    useAsTitle: 'name',
  },
  access: editorialAccess,
  hooks: { beforeValidate: [validateMediaPlacement] },
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'placement',
      type: 'group',
      fields: [
        { name: 'asset', type: 'upload', relationTo: 'media', required: true },
        { name: 'focalX', type: 'number', min: 0, max: 1, defaultValue: 0.5, required: true },
        { name: 'focalY', type: 'number', min: 0, max: 1, defaultValue: 0.5, required: true },
        { name: 'zoom', type: 'number', min: 1, max: 4, defaultValue: 1, required: true },
        {
          name: 'fit',
          type: 'select',
          defaultValue: 'cover',
          options: selectOptions(MEDIA_FITS),
          required: true,
        },
        {
          name: 'frame',
          type: 'select',
          defaultValue: 'auto',
          options: selectOptions(MEDIA_FRAMES),
          required: true,
        },
        {
          name: 'overrides',
          type: 'group',
          fields: [
            { name: 'mobile', type: 'group', fields: overrideFields() },
            { name: 'tablet', type: 'group', fields: overrideFields() },
          ],
        },
      ],
    },
  ],
}
