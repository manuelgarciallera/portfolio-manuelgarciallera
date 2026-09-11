import { ValidationError, type Block, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { MOTION_EASINGS, REDUCED_MOTION_BEHAVIORS, BRAND_COLOR_ROLES } from '../brand/model'
import { normalizePageBrandOverrides, resolvePageBrand } from '../brand/inheritance'
import { validateBrandProfile } from '../brand/validation'
import { editorialAccess, editorialPreviewField, editorialVersions, slugField } from './shared'
import { seoField } from './seo'
import { bindRestoredPageMedia } from '../media/restored-page-media'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const validatePageBrandPublication: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const invalid = (message: string, path = 'brandOverrides'): never => {
    throw new ValidationError({
      collection: 'pages',
      errors: [{ message, path }],
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
        // SQL version writes require arrays, not null. An empty optional list
        // still means inherit when resolved by normalizePageBrandOverrides.
        if (isRecord(result.brandOverrides) && result.brandOverrides.usageWeights === null) {
          result.brandOverrides.usageWeights = []
        }
      } catch (error) {
        return invalid(error instanceof Error ? error.message : 'Las variaciones de marca no son válidas.')
      }
    }
  }

  const complete = { ...original, ...result }
  if (complete._status === 'draft') return result
  const brandProfile = complete.brandProfile
  if (brandProfile === undefined || brandProfile === null) {
    return invalid('Selecciona un perfil de marca antes de publicar la página.', 'brandProfile')
  }

  let profile: unknown = brandProfile
  if (!isRecord(brandProfile)) {
    if (!req?.payload)
      return invalid('No se pudo validar el perfil de marca relacionado.', 'brandProfile')
    try {
      profile = await req.payload.findByID({
        collection: 'brand-profiles',
        id: brandProfile as number,
        depth: 0,
        overrideAccess: false,
        req,
      })
    } catch {
      return invalid('No se pudo validar el perfil de marca relacionado.', 'brandProfile')
    }
  }
  const profileErrors = validateBrandProfile(profile)
  if (profileErrors.length) {
    return invalid(`El perfil de marca relacionado no es válido: ${profileErrors.join(' ')}`, 'brandProfile')
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
  labels: { singular: 'Portada', plural: 'Portadas' },
  fields: [
    { name: 'eyebrow', label: 'Antetítulo', type: 'text' },
    { name: 'heading', label: 'Encabezado', type: 'text', required: true },
    { name: 'body', label: 'Texto', type: 'richText' },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
  ],
}

const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Texto enriquecido', plural: 'Textos enriquecidos' },
  fields: [{ name: 'content', label: 'Contenido', type: 'richText', required: true }],
}

const ProjectGridBlock: Block = {
  slug: 'projectGrid',
  labels: { singular: 'Galería de proyectos', plural: 'Galerías de proyectos' },
  fields: [
    { name: 'heading', label: 'Encabezado', type: 'text' },
    { name: 'projects', label: 'Proyectos', type: 'relationship', relationTo: 'projects', hasMany: true },
  ],
}

const MediaBlock: Block = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  fields: [
    { name: 'asset', label: 'Archivo', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'placement',
      label: 'Encuadre',
      type: 'relationship',
      relationTo: 'media-placements',
      admin: {
        components: { beforeInput: ['./components/RelationshipLabelBinding#RelationshipLabelBinding'] },
        description: 'Encuadre reutilizable opcional; nunca modifica el original.',
      },
    },
    { name: 'caption', label: 'Pie de imagen', type: 'text' },
  ],
}

const CustomFeatureBlock: Block = {
  slug: 'customFeature',
  labels: { singular: 'Sección especial', plural: 'Secciones especiales' },
  fields: [
    {
      name: 'featureKey',
      label: 'Tipo de sección',
      type: 'select',
      required: true,
      options: [
        { label: 'Carrusel de proyectos', value: 'project-reel' },
        { label: 'Índice de investigación', value: 'research-index' },
        { label: 'Panel de contacto', value: 'contact-panel' },
      ],
    },
    { name: 'heading', label: 'Encabezado', type: 'text' },
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
  hooks: { beforeValidate: [validatePageBrandPublication], beforeChange: [bindRestoredPageMedia] },
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    editorialPreviewField,
    { name: 'restoredMediaSnapshot', type: 'relationship', relationTo: 'preview-snapshots',
      label: 'Captura de origen de las imágenes',
      admin: { readOnly: true, condition: (data) => Boolean(data?.restoredMediaSnapshot) },
      access: { create: () => false, update: () => false },
    },
    { name: 'useCurrentMedia', type: 'checkbox', virtual: true, defaultValue: false,
      label: 'Usar las imágenes actuales de la biblioteca',
      admin: {
        readOnly: false, // Payload makes virtual fields read-only unless explicitly editable.
        condition: (data) => Boolean(data?.restoredMediaSnapshot),
        description: 'Esta página conserva imágenes de una versión restaurada. Marca esta opción y guarda el borrador para usar las imágenes actuales. No cambia otras páginas ni elimina las capturas anteriores.',
      },
    },
    {
      name: 'title', label: 'Título de la página', type: 'text', required: true,
      admin: { components: { beforeInput: ['./components/FieldErrorBinding#FieldErrorBinding'] } },
    },
    { ...slugField, label: 'Identificador de URL (slug)' },
    {
      name: 'brandProfile',
      label: 'Perfil de marca',
      type: 'relationship',
      relationTo: 'brand-profiles',
      admin: {
        components: { beforeInput: ['./components/RelationshipLabelBinding#RelationshipLabelBinding'] },
        description: 'Obligatorio al publicar. Los borradores pueden guardarse sin asignarlo.',
      },
    },
    {
      name: 'brandOverrides',
      label: 'Variaciones de marca de esta página',
      type: 'group',
      admin: { description: 'Variaciones controladas; fondo y texto siempre se heredan.' },
      fields: [
        {
          name: 'accent',
          label: 'Color de acento',
          type: 'text',
          admin: { components: { Field: './components/HexColorField#HexColorField' } },
        },
        {
          name: 'surface',
          label: 'Color de superficie',
          type: 'text',
          admin: { components: { Field: './components/HexColorField#HexColorField' } },
        },
        {
          name: 'usageWeights',
          label: 'Proporciones de color',
          type: 'array',
          fields: [
            {
              name: 'role',
              label: 'Función del color',
              type: 'select',
              required: true,
              options: BRAND_COLOR_ROLES.map((value) => ({ label: value, value })),
            },
            { name: 'weight', label: 'Proporción (%)', type: 'number', min: 0, max: 100, required: true },
          ],
        },
        {
          name: 'motion',
          label: 'Animación',
          type: 'group',
          fields: [
            { name: 'duration', label: 'Duración (ms)', type: 'number', min: 150, max: 1600 },
            { name: 'stagger', label: 'Intervalo entre elementos (ms)', type: 'number', min: 0, max: 500 },
            { name: 'travel', label: 'Desplazamiento (px)', type: 'number', min: 0, max: 80 },
            {
              name: 'easing',
              label: 'Curva de animación',
              type: 'select',
              options: MOTION_EASINGS.map((value) => ({ label: value, value })),
            },
            {
              name: 'reducedMotion',
              label: 'Preferencia de movimiento reducido',
              type: 'select',
              options: REDUCED_MOTION_BEHAVIORS.map((value) => ({ label: value, value })),
            },
          ],
        },
      ],
    },
    { name: 'layout', label: 'Secciones de la página', type: 'blocks', blocks: pageBlocks, required: true },
    seoField,
  ],
}
