import { describe, expect, it } from 'vitest'

import { buildOwnerReadiness } from './readiness'

describe('buildOwnerReadiness', () => {
  it.each(['https://private-host/db', 'file:owner.db', 'postgresql:///db', 'not-a-url'])('keeps invalid database configuration blocked: %s', (databaseUrl) => {
    const result = buildOwnerReadiness({ databaseUrl, payloadSecret: ' '.repeat(40) })
    expect(result.blockers).toContain('postgres-database')
    expect(result.blockers).toContain('secure-payload-secret')
    expect(result.runtime.database.durable).toBe(false)
    expect(JSON.stringify(result)).not.toContain(databaseUrl)
  })
  it('never presents configuration alone as a verified connection or durable backup', () => {
    const result = buildOwnerReadiness({ databaseUrl: 'postgres://localhost/qa' })
    expect(result.runtime.database).toMatchObject({ kind: 'postgres', configured: true, durable: false, verification: 'not-tested' })
    expect(result.blockers).toContain('database-restore-verification')
  })
  it('reports local runtime blockers without exposing configured values', () => {
    const result = buildOwnerReadiness({ databaseUrl: undefined, nodeEnv: 'development', payloadSecret: 'short-secret' })
    expect(result).toEqual({
      deploymentAllowed: false,
      productionReady: false,
      publicBridgeEnabled: false,
      runtime: {
        database: { configured: false, durable: false, verification: 'not-tested', kind: 'sqlite' },
        mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' },
        mode: 'development',
        payloadSecretConfigured: false,
      },
      blockers: ['postgres-database', 'secure-payload-secret', 'database-restore-verification', 'durable-media-storage', 'public-content-bridge', 'deployment-review'],
    })
    expect(JSON.stringify(result)).not.toContain('short-secret')
  })

  it('recognizes production database and secret while keeping unimplemented boundaries blocked', () => {
    const result = buildOwnerReadiness({ databaseUrl: 'postgresql://private-host/db', nodeEnv: 'production', payloadSecret: 'a-secure-runtime-secret-with-32-characters' })
    expect(result.runtime).toMatchObject({ database: { configured: true, durable: false, verification: 'not-tested', kind: 'postgres' }, mode: 'production', payloadSecretConfigured: true })
    expect(result.blockers).toEqual(['database-restore-verification', 'durable-media-storage', 'public-content-bridge', 'deployment-review'])
    expect(JSON.stringify(result)).not.toContain('private-host')
  })
})
