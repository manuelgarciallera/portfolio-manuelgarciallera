import { isPostgresDatabaseUrl, isSecurePayloadSecret } from '../config/runtime'

type Environment = { databaseUrl?: string; nodeEnv?: string; payloadSecret?: string }

export const buildOwnerReadiness = ({ databaseUrl, nodeEnv, payloadSecret }: Environment) => {
  const postgres = isPostgresDatabaseUrl(databaseUrl)
  const secureSecret = isSecurePayloadSecret(payloadSecret)
  const blockers = [
    ...(!postgres ? ['postgres-database'] : []),
    ...(!secureSecret ? ['secure-payload-secret'] : []),
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
      database: { configured: postgres, durable: false, verification: 'not-tested' as const, kind: postgres ? 'postgres' as const : 'sqlite' as const },
      mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' as const },
      mode: nodeEnv === 'production' ? 'production' as const : 'development' as const,
      payloadSecretConfigured: secureSecret,
    },
    blockers,
  }
}
