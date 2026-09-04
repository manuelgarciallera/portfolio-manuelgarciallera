import { BUILD_ONLY_PAYLOAD_SECRET, DEVELOPMENT_PAYLOAD_SECRET } from '../config/runtime'

type Environment = { databaseUrl?: string; nodeEnv?: string; payloadSecret?: string }
const unsafeSecrets = new Set(['', 'change-me', DEVELOPMENT_PAYLOAD_SECRET, BUILD_ONLY_PAYLOAD_SECRET])

export const buildOwnerReadiness = ({ databaseUrl, nodeEnv, payloadSecret }: Environment) => {
  const postgres = typeof databaseUrl === 'string' && Boolean(databaseUrl.trim())
  const secureSecret = typeof payloadSecret === 'string' && payloadSecret.length >= 32 && !unsafeSecrets.has(payloadSecret)
  const blockers = [
    ...(!postgres ? ['postgres-database'] : []),
    ...(!secureSecret ? ['secure-payload-secret'] : []),
    'durable-media-storage',
    'public-content-bridge',
    'deployment-review',
  ]
  return {
    deploymentAllowed: false,
    productionReady: false,
    publicBridgeEnabled: false,
    runtime: {
      database: { durable: postgres, kind: postgres ? 'postgres' as const : 'sqlite' as const },
      mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' as const },
      mode: nodeEnv === 'production' ? 'production' as const : 'development' as const,
      payloadSecretConfigured: secureSecret,
    },
    blockers,
  }
}
