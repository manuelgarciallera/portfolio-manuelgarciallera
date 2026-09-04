import { describe, expect, it } from 'vitest'

import { buildOwnerReadiness } from './readiness'

describe('buildOwnerReadiness', () => {
  it('reports local runtime blockers without exposing configured values', () => {
    const result = buildOwnerReadiness({ databaseUrl: undefined, nodeEnv: 'development', payloadSecret: 'short-secret' })
    expect(result).toEqual({
      deploymentAllowed: false,
      productionReady: false,
      publicBridgeEnabled: false,
      runtime: {
        database: { durable: false, kind: 'sqlite' },
        mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' },
        mode: 'development',
        payloadSecretConfigured: false,
      },
      blockers: ['postgres-database', 'secure-payload-secret', 'durable-media-storage', 'public-content-bridge', 'deployment-review'],
    })
    expect(JSON.stringify(result)).not.toContain('short-secret')
  })

  it('recognizes production database and secret while keeping unimplemented boundaries blocked', () => {
    const result = buildOwnerReadiness({ databaseUrl: 'postgresql://private-host/db', nodeEnv: 'production', payloadSecret: 'a-secure-runtime-secret-with-32-characters' })
    expect(result.runtime).toMatchObject({ database: { durable: true, kind: 'postgres' }, mode: 'production', payloadSecretConfigured: true })
    expect(result.blockers).toEqual(['durable-media-storage', 'public-content-bridge', 'deployment-review'])
    expect(JSON.stringify(result)).not.toContain('private-host')
  })
})
