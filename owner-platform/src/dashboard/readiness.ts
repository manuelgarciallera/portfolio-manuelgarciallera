import { isPostgresDatabaseUrl, isSecurePayloadSecret } from '../config/runtime'
import { createOwnerEmailAdapter } from '../config/email'
import { resolveOwnerServerURL } from '../config/server-url'

export type ReadinessEnvironment = { databaseUrl?: string; nodeEnv?: string; payloadSecret?: string; emailApiKey?: string; emailFrom?: string; serverURL?: string }

export const buildOwnerReadiness = ({ databaseUrl, nodeEnv, payloadSecret, emailApiKey, emailFrom, serverURL }: ReadinessEnvironment) => {
  const postgres = isPostgresDatabaseUrl(databaseUrl)
  const secureSecret = isSecurePayloadSecret(payloadSecret)
  let mailConfigured = false
  let originConfigured = false
  // Configuration validation only: never instantiate delivery or call a provider.
  try {
    createOwnerEmailAdapter({ apiKey: emailApiKey, fromAddress: emailFrom, nodeEnv: 'production' })
    mailConfigured = true
  } catch { /* Report a boolean, never provider configuration or error text. */ }
  try { originConfigured = Boolean(resolveOwnerServerURL({ value: serverURL, nodeEnv: 'production' })) } catch { /* Not ready. */ }
  const blockers = [
    ...(!postgres ? ['postgres-database'] : []),
    ...(!secureSecret ? ['secure-payload-secret'] : []),
    ...(!mailConfigured ? ['owner-email-configuration'] : []),
    ...(!originConfigured ? ['owner-canonical-origin'] : []),
    'owner-email-delivery-verification',
    'database-restore-verification',
    'durable-media-storage',
    'public-content-bridge',
    'deployment-review',
  ]
  return {
    deploymentAllowed: false,
    productionReady: false,
    publicBridgeEnabled: false,
    runtime: {
      accountRecovery: { mailConfigured, originConfigured, deliveryVerified: false },
      database: { configured: postgres, durable: false, verification: 'not-tested' as const, kind: postgres ? 'postgres' as const : 'sqlite' as const },
      mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' as const },
      mode: nodeEnv === 'production' ? 'production' as const : 'development' as const,
      payloadSecretConfigured: secureSecret,
    },
    blockers,
  }
}
