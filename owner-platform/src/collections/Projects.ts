import type { Block, CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'
import { seoField } from './seo'
import { validateModularBody } from './modular-body'

const CaseSectionBlock: Block = {
  slug: 'caseSection',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
  ],
}

const CaseMediaBlock: Block = {
  slug: 'caseMedia',
  fields: [
    { name: 'asset', type: 'upload', relationTo: 'media', required: true },
    { name: 'placement', type: 'relationship', relationTo: 'media-placements' },
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
}

const CaseGalleryBlock: Block = {
  slug: 'caseGallery',
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 12,
      fields: [
        { name: 'asset', type: 'upload', relationTo: 'media', required: true },
        { name: 'placement', type: 'relationship', relationTo: 'media-placements' },
        { name: 'alt', type: 'text', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}

const CaseQuoteBlock: Block = {
  slug: 'caseQuote',
  fields: [
    { name: 'quote', type: 'textarea', required: true, maxLength: 600 },
    { name: 'attribution', type: 'text', maxLength: 120 },
  ],
}

const CaseMetricsBlock: Block = {
  slug: 'caseMetrics',
  fields: [{
    name: 'items', type: 'array', required: true, minRows: 1, maxRows: 8,
    fields: [
      { name: 'value', type: 'text', required: true, maxLength: 40 },
      { name: 'label', type: 'text', required: true, maxLength: 120 },
    ],
  }],
}

const CaseFeatureBlock: Block = {
  slug: 'caseFeature',
  fields: [
    {
      name: 'featureKey', type: 'select', required: true,
      options: [
        { label: 'Project reel', value: 'project-reel' },
        { label: 'Process timeline', value: 'process-timeline' },
        { label: 'Technology stack', value: 'technology-stack' },
      ],
    },
    { name: 'heading', type: 'text' },
  ],
}

export const projectBlocks: Block[] = [
  CaseSectionBlock,
  CaseMediaBlock,
  CaseGalleryBlock,
  CaseQuoteBlock,
  CaseMetricsBlock,
  CaseFeatureBlock,
]

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    components: { edit: { beforeDocumentControls: ['./components/PagePreviewLink#PagePreviewLink'] } },
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
    {
      name: 'body', type: 'richText', required: false,
      validate: validateModularBody('caseStudyLayout'),
      admin: { description: 'Contenido clásico: obligatorio solo si no añades bloques al lienzo modular. Los bloques tienen prioridad en la vista editorial; este texto se conserva.' },
    },
    {
      name: 'caseStudyLayout',
      type: 'blocks',
      blocks: projectBlocks,
      required: false,
      admin: {
        description: 'Lienzo modular opcional. El cuerpo anterior permanece intacto durante la migración.',
      },
    },
    {
      name: 'technologies',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'icon', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'technologyStack',
      type: 'relationship',
      relationTo: 'technologies' as never,
      hasMany: true,
      admin: {
        description: 'Catálogo reutilizable y ordenado. El campo technologies anterior se conserva durante la migración.',
      },
    },
    { name: 'year', type: 'number' },
    seoField,
  ],
}
