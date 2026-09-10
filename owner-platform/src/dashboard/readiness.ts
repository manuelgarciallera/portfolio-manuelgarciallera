import { isPostgresDatabaseUrl, isSecurePayloadSecret } from '../config/runtime'
import { createOwnerEmailAdapter } from '../config/email'
import { resolveOwnerServerURL } from '../config/server-url'

export type ReadinessEnvironment = { databaseUrl?: string; nodeEnv?: string; payloadSecret?: string; emailApiKey?: string; emailFrom?: string; serverURL?: string; mediaMode?: string; mediaLocalStorageDisabled?: boolean }

export const buildOwnerReadiness = ({ databaseUrl, nodeEnv, payloadSecret, emailApiKey, emailFrom, serverURL, mediaMode, mediaLocalStorageDisabled }: ReadinessEnvironment) => {
  // Observe the assembled server adapter as well as its selection. Neither is
  // evidence of provider persistence, permissions or a recoverable backup.
  const objectAdapter = mediaMode === 'objects' && mediaLocalStorageDisabled === true
  const localAdapter = (!mediaMode || mediaMode === 'legacy') && mediaLocalStorageDisabled !== true
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
      mediaStorage: { adapterConfigured: objectAdapter, durable: false, kind: objectAdapter ? 'objects' as const : localAdapter ? 'local' as const : 'unknown' as const },
      mode: nodeEnv === 'production' ? 'production' as const : 'development' as const,
      payloadSecretConfigured: secureSecret,
    },
    blockers,
  }
}
