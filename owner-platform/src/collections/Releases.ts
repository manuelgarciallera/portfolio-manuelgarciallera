import {
  APIError,
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
} from 'payload'

import { isOwner, ownerOnly } from '../access/owner'
import {
  normalizeReleaseQuality,
  RELEASE_QUALITY_SOURCES,
  RELEASE_QUALITY_VIEWPORTS,
} from '../releases/quality'

const RELEASE_FIELDS = new Set([
  'changeSummary',
  'createdBy',
  'draftSnapshot',
  'gitCommit',
  'name',
  'previewSnapshot',
  'quality',
])

const immutableError = () => new APIError('Los registros de versión son inmutables.', 403)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown, label: string, maxLength: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${label} es obligatorio y no puede superar ${maxLength} caracteres.`)
  }
  return value.trim()
}

export const validateReleaseRecord: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') throw immutableError()
  if (!isOwner(req.user)) throw new APIError('Solo el owner puede registrar versiones.', 403)

  const invalid = (message: string, path = 'release'): never => {
    throw new ValidationError({
      collection: 'releases',
      errors: [{ message, path }],
      req,
    })
  }

  if (!isRecord(data)) return invalid('La versión debe ser un objeto.')
  const unknownField = Object.keys(data).find((key) => !RELEASE_FIELDS.has(key))
  if (unknownField) return invalid(`Campo no permitido en la versión: ${unknownField}.`)
  if (data.createdBy !== undefined && String(data.createdBy) !== String(req.user.id)) {
    return invalid('La autoría de la versión no puede sustituirse.', 'createdBy')
  }
  if (typeof data.gitCommit !== 'string' || !/^[a-f0-9]{40}$/.test(data.gitCommit)) {
    return invalid('gitCommit debe ser un identificador Git completo de 40 caracteres.', 'gitCommit')
  }
  if (
    (typeof data.previewSnapshot !== 'string' && typeof data.previewSnapshot !== 'number') ||
    String(data.previewSnapshot).trim() === ''
  ) {
    return invalid('Selecciona un snapshot verificable.', 'previewSnapshot')
  }
  if (
    (typeof data.draftSnapshot !== 'string' && typeof data.draftSnapshot !== 'number') ||
    String(data.draftSnapshot).trim() === ''
  ) {
    return invalid('Selecciona un snapshot de borrador restorable.', 'draftSnapshot')
  }
  if (!Array.isArray(data.quality) || data.quality.length === 0 || data.quality.length > 4) {
    return invalid('Añade entre una y cuatro mediciones de calidad.', 'quality')
  }

  try {
    return {
      ...data,
      changeSummary: text(data.changeSummary, 'El resumen de cambios', 500),
      createdBy: req.user.id,
      name: text(data.name, 'El nombre', 120),
      quality: data.quality.map(normalizeReleaseQuality),
    }
  } catch (error) {
    return invalid(error instanceof Error ? error.message : 'Las métricas de calidad no son válidas.', 'quality')
  }
}

export const enforceImmutableReleaseDelete: CollectionBeforeDeleteHook = async () => {
  throw immutableError()
}

export const Releases: CollectionConfig = {
  slug: 'releases',
  admin: {
    defaultColumns: ['name', 'gitCommit', 'createdAt'],
    useAsTitle: 'name',
  },
  access: {
    create: ownerOnly,
    read: ownerOnly,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [validateReleaseRecord],
    beforeDelete: [enforceImmutableReleaseDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'changeSummary', type: 'textarea', required: true },
    { name: 'gitCommit', type: 'text', required: true, unique: true, index: true },
    {
      name: 'previewSnapshot',
      type: 'relationship',
      relationTo: 'preview-snapshots',
      required: true,
    },
    {
      name: 'draftSnapshot',
      type: 'relationship',
      relationTo: 'draft-snapshots',
      required: true,
    },
    {
      name: 'quality',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 4,
      fields: [
        {
          name: 'viewport',
          type: 'select',
          required: true,
          options: RELEASE_QUALITY_VIEWPORTS.map((value) => ({ label: value, value })),
        },
        { name: 'performance', type: 'number', min: 0, max: 100, required: true },
        { name: 'usability', type: 'number', min: 0, max: 100, required: true },
        { name: 'accessibility', type: 'number', min: 0, max: 100, required: true },
        {
          name: 'source',
          type: 'select',
          required: true,
          options: RELEASE_QUALITY_SOURCES.map((value) => ({ label: value, value })),
        },
        { name: 'measuredAt', type: 'date', required: true },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
  ],
}
