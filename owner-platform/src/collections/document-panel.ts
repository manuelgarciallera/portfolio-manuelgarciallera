import type { UIField } from 'payload'

// Multi-line workflows belong to the document flow, never to Payload\'s
// fixed-height sticky button toolbar. UI fields are not persisted as content.
export const documentPanel = (component: string): UIField => ({
  name: 'ownerActions',
  type: 'ui',
  admin: { disableListColumn: true, components: { Field: component } },
})
