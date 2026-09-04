import { describe, expect, it } from 'vitest'

import { AssistantSettings } from './AssistantSettings'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never

describe('AssistantSettings global', () => {
  it('is visible and mutable only to the authenticated owner', () => {
    expect(AssistantSettings.slug).toBe('assistant-settings')
    expect(AssistantSettings.access?.read?.(accessArgs(owner))).toBe(true)
    expect(AssistantSettings.access?.update?.(accessArgs(owner))).toBe(true)
    expect(AssistantSettings.access?.read?.(accessArgs(null))).toBe(false)
    expect(AssistantSettings.access?.update?.(accessArgs(null))).toBe(false)
  })

  it('starts every proposal capability disabled and exposes no apply or publish authority', () => {
    const serialized = JSON.stringify(AssistantSettings.fields)
    for (const capability of [
      'suggestCopy',
      'suggestPalette',
      'suggestLayout',
      'suggestCrop',
      'suggestMotion',
    ]) {
      expect(serialized).toContain(capability)
      const field = AssistantSettings.fields.find(
        (candidate) => 'name' in candidate && candidate.name === capability,
      )
      expect(field).toMatchObject({ type: 'checkbox', defaultValue: false })
    }
    expect(serialized).not.toMatch(/(?:applyChanges|autoApply|publish|deploy|productionWrite)/i)
  })

  it('keeps bounded history so permission changes remain reversible', () => {
    expect(AssistantSettings.versions).toMatchObject({ max: 50 })
  })
})
