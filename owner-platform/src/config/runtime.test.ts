import { describe, expect, it } from 'vitest'

import { assertProductionRuntimeEnvironment, resolveRuntimeConfig } from './runtime'

describe('owner platform runtime configuration', () => {
  it('uses ignored SQLite storage and an explicit development-only secret locally', () => {
    expect(
      resolveRuntimeConfig({
        nodeEnv: 'development',
        nextPhase: undefined,
        payloadSecret: undefined,
        databaseUrl: undefined,
      }),
    ).toEqual({
      database: { kind: 'sqlite', url: 'file:.data/owner-platform.db' },
      payloadSecret: 'owner-platform-development-only-secret',
      productionBuild: false,
    })
  })

  it('selects PostgreSQL whenever DATABASE_URL is explicitly configured', () => {
    expect(
      resolveRuntimeConfig({
        nodeEnv: 'development',
        nextPhase: undefined,
        payloadSecret: 'local-custom-secret',
        databaseUrl: 'postgresql://localhost/portfolio_owner',
      }).database,
    ).toEqual({ kind: 'postgres', url: 'postgresql://localhost/portfolio_owner' })
  })

  it.each([undefined, '', 'change-me', 'owner-platform-development-only-secret'])(
    'refuses an unsafe PAYLOAD_SECRET in a production runtime (%s)',
    (payloadSecret) => {
      expect(() =>
        resolveRuntimeConfig({
          nodeEnv: 'production',
          nextPhase: 'phase-production-server',
          payloadSecret,
          databaseUrl: 'postgresql://db/owner',
        }),
      ).toThrow(/PAYLOAD_SECRET/)
    },
  )

  it('requires PostgreSQL in a production runtime', () => {
    expect(() =>
      resolveRuntimeConfig({
        nodeEnv: 'production',
        nextPhase: 'phase-production-server',
        payloadSecret: 'a-real-secret-with-enough-entropy-for-runtime',
        databaseUrl: undefined,
      }),
    ).toThrow(/DATABASE_URL/)
  })

  it('rejects a production secret that is too short to be credible', () => {
    expect(() =>
      resolveRuntimeConfig({
        nodeEnv: 'production',
        nextPhase: 'phase-production-server',
        payloadSecret: 'short-secret',
        databaseUrl: 'postgresql://db/owner',
      }),
    ).toThrow(/PAYLOAD_SECRET/)
  })

  it('permits a build-only closed configuration without production credentials', () => {
    expect(
      resolveRuntimeConfig({
        nodeEnv: 'production',
        nextPhase: 'phase-production-build',
        payloadSecret: undefined,
        databaseUrl: undefined,
      }),
    ).toEqual({
      database: { kind: 'sqlite', url: 'file::memory:' },
      payloadSecret: 'owner-platform-build-only-non-runtime-secret',
      productionBuild: true,
    })
  })

  it('never accepts the build-only escape hatch as a production runtime', () => {
    expect(() =>
      assertProductionRuntimeEnvironment({
        nodeEnv: 'production',
        payloadSecret: 'owner-platform-build-only-non-runtime-secret',
        databaseUrl: undefined,
      }),
    ).toThrow(/PAYLOAD_SECRET/)
  })
})
