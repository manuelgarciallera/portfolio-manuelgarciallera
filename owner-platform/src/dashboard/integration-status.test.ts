import { describe, expect, it } from 'vitest'

import { buildIntegrationStatus } from './integration-status'

describe('buildIntegrationStatus', () => {
  it('reports connector readiness and effective proposal capabilities without secrets', () => {
    const status = buildIntegrationStatus({
      figmaPlan: 'professional',
      figmaToken: 'private-token',
      switches: { suggestCopy: true, suggestPalette: false, suggestLayout: true, suggestCrop: true, suggestMotion: true },
    })
    expect(status).toEqual({
      assistant: {
        apply: false,
        capabilities: {
          suggestCopy: { enabled: true, operational: true },
          suggestCrop: { enabled: true, operational: false },
          suggestLayout: { enabled: true, operational: true },
          suggestMotion: { enabled: true, operational: true },
          suggestPalette: { enabled: false, operational: true },
        },
        deploy: false,
        providerConfigured: false,
        publish: false,
      },
      connectors: {
        figma: { access: 'read-only', auth: 'personal-access-token', configured: true, plan: 'professional' },
        linocube: { access: 'disabled', configured: false },
      },
    })
    expect(JSON.stringify(status)).not.toContain('private-token')
  })

  it('normalizes missing configuration and unknown plans safely', () => {
    const status = buildIntegrationStatus({ figmaPlan: 'unknown', figmaToken: ' ', switches: {} })
    expect(status.connectors.figma).toMatchObject({ configured: false, plan: 'starter' })
    expect(Object.values(status.assistant.capabilities).every(({ enabled }) => !enabled)).toBe(true)
  })
})
