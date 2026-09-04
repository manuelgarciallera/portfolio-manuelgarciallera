import { ValidationError, type Block, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { MOTION_EASINGS, REDUCED_MOTION_BEHAVIORS, BRAND_COLOR_ROLES } from '../brand/model'
import { normalizePageBrandOverrides, resolvePageBrand } from '../brand/inheritance'
import { editorialAccess, editorialVersions, slugField } from './shared'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const validatePageBrandPublication: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const invalid = (message: string): never => {
    throw new ValidationError({
      collection: 'pages',
      errors: [{ message, path: 'brandOverrides' }],
      req,
    })
  }
  if (!isRecord(data)) return invalid('La página debe ser un objeto.')
  const original = isRecord(originalDoc) ? originalDoc : {}
  const result: Record<string, unknown> = { ...data }
  const incomingOverrides = result.brandOverrides
  if (Object.hasOwn(result, 'brandOverrides')) {
    if (incomingOverrides === null) result.brandOverrides = null
    else {
      const previous = isRecord(original.brandOverrides) ? original.brandOverrides : {}
      if (!isRecord(incomingOverrides)) return invalid('Las variaciones de marca deben ser un objeto o null.')
      const merged = { ...previous, ...incomingOverrides }
      if (Object.hasOwn(incomingOverrides, 'motion') && isRecord(incomingOverrides.motion)) {
        merged.motion = {
          ...(isRecord(previous.motion) ? previous.motion : {}),
          ...incomingOverrides.motion,
        }
      }
      try {
        result.brandOverrides = normalizePageBrandOverrides(merged)
      } catch (error) {
        return invalid(error instanceof Error ? error.message : 'Las variaciones de marca no son válidas.')
      }
    }
  }

  const complete = { ...original, ...result }
  if (complete._status === 'draft') return result
  const brandProfile = complete.brandProfile
  // Transitional compatibility: existing pages created before Brand Studio remain
  // editable. Every newly published page must choose a brand profile.
  if ((brandProfile === undefined || brandProfile === null) && !Object.hasOwn(original, 'id')) {
    return invalid('Selecciona un perfil de marca antes de publicar una página nueva.')
  }
  if (brandProfile === undefined || brandProfile === null) return result

  let profile: unknown = brandProfile
  if (!isRecord(brandProfile)) {
    if (!req?.payload) return invalid('No se pudo validar el perfil de marca relacionado.')
    try {
      profile = await req.payload.findByID({
        collection: 'brand-profiles',
        id: brandProfile as number,
        depth: 0,
        overrideAccess: false,
        req,
      })
    } catch {
      return invalid('No se pudo validar el perfil de marca relacionado.')
    }
  }
  try {
    resolvePageBrand(profile, complete.brandOverrides)
  } catch (error) {
    return invalid(error instanceof Error ? error.message : 'La marca resuelta no es válida.')
  }
  return result
}

const HeroBlock: Block = {
  slug: 'hero',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
}

const RichTextBlock: Block = {
  slug: 'richText',
  fields: [{ name: 'content', type: 'richText', required: true }],
}

const ProjectGridBlock: Block = {
  slug: 'projectGrid',
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'projects', type: 'relationship', relationTo: 'projects', hasMany: true },
  ],
}

const MediaBlock: Block = {
  slug: 'media',
  fields: [
    { name: 'asset', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
  ],
}

const CustomFeatureBlock: Block = {
  slug: 'customFeature',
  fields: [
    {
      name: 'featureKey',
      type: 'select',
      required: true,
      options: [
        { label: 'Project reel', value: 'project-reel' },
        { label: 'Research index', value: 'research-index' },
        { label: 'Contact panel', value: 'contact-panel' },
      ],
    },
    { name: 'heading', type: 'text' },
  ],
}

export const pageBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  ProjectGridBlock,
  MediaBlock,
  CustomFeatureBlock,
]

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['title', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: editorialAccess,
  hooks: { beforeValidate: [validatePageBrandPublication] },
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    {
      name: 'brandProfile',
      type: 'relationship',
      relationTo: 'brand-profiles',
      admin: {
        description:
          'Obligatorio al publicar páginas nuevas. Las páginas anteriores conservan compatibilidad hasta asignarlo.',
      },
    },
    {
      name: 'brandOverrides',
      type: 'group',
      admin: { description: 'Variaciones controladas; fondo y texto siempre se heredan.' },
      fields: [
        { name: 'accent', type: 'text' },
        { name: 'surface', type: 'text' },
        {
          name: 'usageWeights',
          type: 'array',
          fields: [
            {
              name: 'role',
              type: 'select',
              required: true,
              options: BRAND_COLOR_ROLES.map((value) => ({ label: value, value })),
            },
            { name: 'weight', type: 'number', min: 0, max: 100, required: true },
          ],
        },
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
    },
    { name: 'layout', type: 'blocks', blocks: pageBlocks, required: true },
  ],
}
