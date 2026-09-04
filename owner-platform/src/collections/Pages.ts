import type { Block, CollectionConfig } from 'payload'

import { editorialAccess, editorialVersions, slugField } from './shared'

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
  orderable: true,
  trash: true,
  versions: editorialVersions,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'layout', type: 'blocks', blocks: pageBlocks, required: true },
  ],
}
