import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { describe, expect, it, vi } from 'vitest'
import { createRecoveryAdmissionStore, recoveryAdmissionDDL } from './recovery-admission'

const secret = 'synthetic-secret-at-least-thirty-two-characters'
const schemaName = 'admission_unit_fixture'
const asPool = (value: unknown) => value as PostgresAdapter['pool']

describe('recovery admission defensive boundary', () => {
  it.each(['public; DROP SCHEMA public', '', 'a.b', 'MixedCase', 'a'.repeat(64)])('rejects unsafe schema %s before SQL', schemaName => {
    expect(() => recoveryAdmissionDDL(schemaName)).toThrow('Invalid recovery admission schema')
    expect(() => createRecoveryAdmissionStore({ pool: asPool({}), secret, schemaName })).toThrow('Invalid recovery admission schema')
  })

  it('rejects a weak or absent pseudonymization key', () => {
    expect(() => createRecoveryAdmissionStore({ pool: asPool({}), secret: '', schemaName })).toThrow('Recovery admission secret')
  })

  it.each(['', 'not-email', 'x'.repeat(255) + '@example.invalid', 'a@b\n.invalid'])('rejects malformed input before connecting: %s', async email => {
    const connect = vi.fn()
    const store = createRecoveryAdmissionStore({ pool: asPool({ connect }), secret, schemaName })
    await expect(store.admit(email)).rejects.toThrow('Invalid recovery email')
    expect(connect).not.toHaveBeenCalled()
  })

  it('does not leak a connection error or admit on outage', async () => {
    const connect = vi.fn().mockRejectedValue(new Error('postgres://private-secret'))
    const store = createRecoveryAdmissionStore({ pool: asPool({ connect }), secret, schemaName })
    await expect(store.admit('owner@example.invalid')).rejects.toThrow(/^Recovery admission unavailable$/)
  })

  it('destroys a client if transaction rollback fails', async () => {
    const query = vi.fn().mockRejectedValue(new Error('connection lost'))
    const release = vi.fn()
    const store = createRecoveryAdmissionStore({ pool: asPool({ connect: async () => ({ query, release }) }), secret, schemaName })
    await expect(store.admit('owner@example.invalid')).rejects.toThrow('Recovery admission unavailable')
    expect(release).toHaveBeenCalledExactlyOnceWith(true)
  })
})
