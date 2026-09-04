import { ASSIST_CAPABILITIES, type AssistCapability } from '../assist/contracts'
import type { FigmaPlan } from '../connectors/figma/types'

type Input = { figmaPlan?: string; figmaToken?: string; switches: Record<string, unknown> }
const figmaPlans = new Set<FigmaPlan>(['starter', 'professional', 'organization', 'enterprise'])

export const buildIntegrationStatus = ({ figmaPlan, figmaToken, switches }: Input) => {
  const plan = figmaPlans.has(figmaPlan as FigmaPlan) ? figmaPlan as FigmaPlan : 'starter'
  const capabilities = Object.fromEntries(ASSIST_CAPABILITIES.map((capability: AssistCapability) => [capability, {
    enabled: switches[capability] === true,
    operational: capability !== 'suggestLayout' && capability !== 'suggestCrop',
  }])) as Record<AssistCapability, { enabled: boolean; operational: boolean }>
  return {
    assistant: { apply: false, capabilities, deploy: false, providerConfigured: false, publish: false },
    connectors: {
      figma: { access: 'read-only' as const, auth: 'personal-access-token' as const, configured: typeof figmaToken === 'string' && Boolean(figmaToken.trim()), plan },
      linocube: { access: 'disabled' as const, configured: false },
    },
  }
}
