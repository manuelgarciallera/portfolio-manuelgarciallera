import { describe, expect, it } from 'vitest'

import { buildOwnerReadiness } from './readiness'

describe('buildOwnerReadiness', () => {
  it('keeps account recovery blocked when mail and canonical origin are absent', () => {
    const result = buildOwnerReadiness({})
    expect(result.runtime).toMatchObject({ accountRecovery: { mailConfigured: false, originConfigured: false, deliveryVerified: false } })
    expect(result.blockers).toEqual(expect.arrayContaining(['owner-email-configuration', 'owner-canonical-origin', 'owner-email-delivery-verification']))
  })
  it('does not equate valid recovery configuration with verified delivery or expose secrets', () => {
    const result = buildOwnerReadiness({ emailApiKey: 're_private_test_only', emailFrom: 'private@example.invalid', serverURL: 'https://private-owner.example.invalid' })
    expect(result.runtime).toMatchObject({ accountRecovery: { mailConfigured: true, originConfigured: true, deliveryVerified: false } })
    expect(result.blockers).not.toContain('owner-email-configuration')
    expect(result.blockers).not.toContain('owner-canonical-origin')
    expect(result.blockers).toContain('owner-email-delivery-verification')
    expect(JSON.stringify(result)).not.toMatch(/private|re_private_test_only/)
    expect(result.productionReady).toBe(false)
  })
  it('uses production validation for malformed mail settings and insecure origins', () => {
    const result = buildOwnerReadiness({ emailApiKey: 'not-an-api-key', emailFrom: 'Name <private@example.invalid>', serverURL: 'http://localhost:3001' })
    expect(result.runtime).toMatchObject({ accountRecovery: { mailConfigured: false, originConfigured: false, deliveryVerified: false } })
  })
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
        accountRecovery: { mailConfigured: false, originConfigured: false, deliveryVerified: false },
        database: { configured: false, durable: false, verification: 'not-tested', kind: 'sqlite' },
        mediaStorage: { adapterConfigured: false, durable: false, kind: 'local' },
        mode: 'development',
        payloadSecretConfigured: false,
      },
      blockers: ['postgres-database', 'secure-payload-secret', 'owner-email-configuration', 'owner-canonical-origin', 'owner-email-delivery-verification', 'database-restore-verification', 'durable-media-storage', 'public-content-bridge', 'deployment-review'],
    })
    expect(JSON.stringify(result)).not.toContain('short-secret')
  })

  it('recognizes production database and secret while keeping unimplemented boundaries blocked', () => {
    const result = buildOwnerReadiness({ databaseUrl: 'postgresql://private-host/db', nodeEnv: 'production', payloadSecret: 'a-secure-runtime-secret-with-32-characters' })
    expect(result.runtime).toMatchObject({ database: { configured: true, durable: false, verification: 'not-tested', kind: 'postgres' }, mode: 'production', payloadSecretConfigured: true })
    expect(result.blockers).toEqual(['owner-email-configuration', 'owner-canonical-origin', 'owner-email-delivery-verification', 'database-restore-verification', 'durable-media-storage', 'public-content-bridge', 'deployment-review'])
    expect(JSON.stringify(result)).not.toContain('private-host')
  })
})
