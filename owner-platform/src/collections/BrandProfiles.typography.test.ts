import { describe, expect, it } from 'vitest'
import { BrandProfiles } from './BrandProfiles'

describe('brand typography editing', () => {
  it('exposes the visual family editor for both stored text fields without changing their schema', () => {
    const group = BrandProfiles.fields.find((field) => 'name' in field && field.name === 'typography')
    if (!group || !('fields' in group)) throw new Error('Missing typography group')
    for (const name of ['primaryFamily', 'secondaryFamily']) {
      const field = group.fields.find((entry) => 'name' in entry && entry.name === name)
      expect(field?.type).toBe('text')
      expect(field?.admin?.components?.Field).toBe('./components/TypographyFamilyField#TypographyFamilyField')
    }
  })
})
