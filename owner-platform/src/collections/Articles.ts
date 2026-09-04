import type { Block, CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'
import { seoField } from './seo'

const ArticleTextBlock: Block = {
  slug: 'articleText',
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'content', type: 'richText', required: true },
  ],
}

const ArticleMediaBlock: Block = {
  slug: 'articleMedia',
  fields: [
    { name: 'asset', type: 'upload', relationTo: 'media', required: true },
    { name: 'placement', type: 'relationship', relationTo: 'media-placements' },
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
}

const ArticleGalleryBlock: Block = {
  slug: 'articleGallery',
  fields: [{
    name: 'items', type: 'array', required: true, minRows: 2, maxRows: 12,
    fields: [
      { name: 'asset', type: 'upload', relationTo: 'media', required: true },
      { name: 'placement', type: 'relationship', relationTo: 'media-placements' },
      { name: 'alt', type: 'text', required: true },
      { name: 'caption', type: 'text' },
    ],
  }],
}

const ArticleQuoteBlock: Block = {
  slug: 'articleQuote',
  fields: [
    { name: 'quote', type: 'textarea', required: true, maxLength: 600 },
    { name: 'attribution', type: 'text', maxLength: 120 },
  ],
}

const ArticleCalloutBlock: Block = {
  slug: 'articleCallout',
  fields: [
    { name: 'tone', type: 'select', required: true, options: ['neutral', 'information', 'note'] },
    { name: 'heading', type: 'text', maxLength: 120 },
    { name: 'content', type: 'richText', required: true },
  ],
}

const RelatedProjectsBlock: Block = {
  slug: 'relatedProjects',
  fields: [
    { name: 'heading', type: 'text', maxLength: 120 },
    { name: 'projects', type: 'relationship', relationTo: 'projects', hasMany: true, required: true, maxRows: 6 },
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
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'articleLayout',
      type: 'blocks',
      blocks: articleBlocks,
      required: false,
      admin: { description: 'Lienzo modular opcional. El contenido anterior permanece intacto durante la migración.' },
    },
    { name: 'publishedAt', type: 'date' },
    seoField,
  ],
}
