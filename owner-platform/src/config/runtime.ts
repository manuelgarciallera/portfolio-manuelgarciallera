export const DEVELOPMENT_PAYLOAD_SECRET = 'owner-platform-development-only-secret'
export const BUILD_ONLY_PAYLOAD_SECRET = 'owner-platform-build-only-non-runtime-secret'

const UNSAFE_PRODUCTION_SECRETS = new Set([
  '',
  'change-me',
  DEVELOPMENT_PAYLOAD_SECRET,
  BUILD_ONLY_PAYLOAD_SECRET,
])

export const isSecurePayloadSecret = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length >= 32 && !UNSAFE_PRODUCTION_SECRETS.has(value.trim())

// This validates configuration syntax only, never connectivity, TLS or backups.
export const isPostgresDatabaseUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || value !== value.trim() || /[\r\n\t]/.test(value)) return false
  try {
    const url = new URL(value)
    return ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname) && !url.hash
  } catch {
    return false
  }
}

export type RuntimeConfigInput = {
  databaseUrl?: string
  localDatabaseName?: string
  nextPhase?: string
  nodeEnv?: string
  payloadSecret?: string
}

export type OwnerRuntimeConfig = {
  database:
    | { kind: 'postgres'; url: string }
    | { kind: 'sqlite'; url: string }
  payloadSecret: string
  productionBuild: boolean
}

export const assertProductionRuntimeEnvironment = ({
  databaseUrl,
  nodeEnv,
  payloadSecret,
}: Omit<RuntimeConfigInput, 'nextPhase'>): void => {
  if (nodeEnv !== 'production') return

  if (!isSecurePayloadSecret(payloadSecret)) {
    throw new Error('A secure PAYLOAD_SECRET is required in production runtime')
  }
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in production runtime')
  }
  if (!isPostgresDatabaseUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL')
  }
}

export const assertCurrentProductionRuntime = (): void =>
  assertProductionRuntimeEnvironment({
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    payloadSecret: process.env.PAYLOAD_SECRET,
  })

export const resolveRuntimeConfig = ({
  databaseUrl,
  localDatabaseName,
  nextPhase,
  nodeEnv,
  payloadSecret,
}: RuntimeConfigInput): OwnerRuntimeConfig => {
  const productionBuild =
    nodeEnv === 'production' && nextPhase === 'phase-production-build'

  if (productionBuild) {
    return {
      database: { kind: 'sqlite', url: 'file::memory:' },
      payloadSecret: payloadSecret || BUILD_ONLY_PAYLOAD_SECRET,
      productionBuild: true,
    }
  }

  if (nodeEnv === 'production') {
    assertProductionRuntimeEnvironment({ databaseUrl, nodeEnv, payloadSecret })

    return {
      database: { kind: 'postgres', url: databaseUrl! },
      payloadSecret: payloadSecret!,
      productionBuild: false,
    }
  }

  if (localDatabaseName !== undefined && !/^[A-Za-z0-9_-]{1,80}$/.test(localDatabaseName)) {
    throw new Error('LOCAL_DATABASE_NAME must be a plain local filename without an extension')
  }
  if (databaseUrl && !isPostgresDatabaseUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL')
  }
  return {
    database: databaseUrl
      ? { kind: 'postgres', url: databaseUrl }
      : { kind: 'sqlite', url: `file:.data/${localDatabaseName ?? 'owner-platform'}.db` },
    payloadSecret: payloadSecret || DEVELOPMENT_PAYLOAD_SECRET,
    productionBuild: false,
  }
}
