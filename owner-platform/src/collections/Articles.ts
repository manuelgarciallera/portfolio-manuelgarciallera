import type { Block, CollectionConfig } from 'payload'

import { editorialAccess, editorialPreviewField, editorialVersions, slugField } from './shared'
import { seoField } from './seo'
import { validateModularBody } from './modular-body'

const ArticleTextBlock: Block = {
  slug: 'articleText',
  labels: { singular: 'Texto', plural: 'Textos' },
  fields: [
    { name: 'heading', label: 'Encabezado', type: 'text' },
    { name: 'content', label: 'Contenido', type: 'richText', required: true },
  ],
}

const ArticleMediaBlock: Block = {
  slug: 'articleMedia',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  fields: [
    { name: 'asset', label: 'Archivo', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'placement', label: 'Encuadre', type: 'relationship', relationTo: 'media-placements',
      admin: { components: { beforeInput: ['./components/RelationshipLabelBinding#RelationshipLabelBinding'] } },
    },
    { name: 'alt', label: 'Texto alternativo', type: 'text', required: true },
    { name: 'caption', label: 'Pie de imagen', type: 'text' },
  ],
}

const ArticleGalleryBlock: Block = {
  slug: 'articleGallery',
  labels: { singular: 'Galería', plural: 'Galerías' },
  fields: [{
    name: 'items', label: 'Imágenes', type: 'array', required: true, minRows: 2, maxRows: 12,
    fields: [
      { name: 'asset', label: 'Archivo', type: 'upload', relationTo: 'media', required: true },
      { name: 'placement', label: 'Encuadre', type: 'relationship', relationTo: 'media-placements' },
      { name: 'alt', label: 'Texto alternativo', type: 'text', required: true },
      { name: 'caption', label: 'Pie de imagen', type: 'text' },
    ],
  }],
}

const ArticleQuoteBlock: Block = {
  slug: 'articleQuote',
  labels: { singular: 'Cita', plural: 'Citas' },
  fields: [
    { name: 'quote', label: 'Texto de la cita', type: 'textarea', required: true, maxLength: 600 },
    { name: 'attribution', label: 'Autoría o fuente', type: 'text', maxLength: 120 },
  ],
}

const ArticleCalloutBlock: Block = {
  slug: 'articleCallout',
  labels: { singular: 'Aviso destacado', plural: 'Avisos destacados' },
  fields: [
    { name: 'tone', label: 'Tipo de aviso', type: 'select', required: true, options: ['neutral', 'information', 'note'] },
    { name: 'heading', label: 'Encabezado', type: 'text', maxLength: 120 },
    { name: 'content', label: 'Contenido', type: 'richText', required: true },
  ],
}

const RelatedProjectsBlock: Block = {
  slug: 'relatedProjects',
  labels: { singular: 'Proyectos relacionados', plural: 'Grupos de proyectos relacionados' },
  fields: [
    { name: 'heading', label: 'Encabezado', type: 'text', maxLength: 120 },
    { name: 'projects', label: 'Proyectos', type: 'relationship', relationTo: 'projects', hasMany: true, required: true, maxRows: 6 },
  ],
}

export const articleBlocks: Block[] = [
  ArticleTextBlock,
  ArticleMediaBlock,
  ArticleGalleryBlock,
  ArticleQuoteBlock,
  ArticleCalloutBlock,
  RelatedProjectsBlock,
]

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', '_status', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: editorialAccess,
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    editorialPreviewField,
    { name: 'title', label: 'Título del artículo', type: 'text', required: true },
    slugField,
    {
      name: 'excerpt', label: 'Resumen', type: 'textarea', required: true,
      admin: { components: { beforeInput: ['./components/FieldErrorBinding#FieldErrorBinding'] } },
    },
    { name: 'coverImage', label: 'Imagen de portada', type: 'upload', relationTo: 'media' },
    {
      name: 'content', label: 'Contenido clásico', type: 'richText', required: false,
      validate: validateModularBody('articleLayout'),
      admin: { description: 'Contenido clásico: obligatorio solo si no añades bloques al lienzo modular. Los bloques tienen prioridad en la vista editorial; este texto se conserva.' },
    },
    {
      name: 'articleLayout',
      label: 'Bloques del artículo',
      type: 'blocks',
      blocks: articleBlocks,
      required: false,
      admin: { description: 'Lienzo modular opcional. El contenido anterior permanece intacto durante la migración.' },
    },
    { name: 'publishedAt', label: 'Fecha de publicación', type: 'date' },
    seoField,
  ],
}
