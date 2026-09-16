import { describe, expect, it } from 'vitest'
import { readConsent, createConsent, effectiveConsent, CONSENT_LIFETIME_MS } from './policy'

const now = Date.UTC(2026, 8, 16)
describe('consent policy', () => {
  it('requires an affirmative choice for each provider', () => {
    expect(effectiveConsent(null)).toEqual({ google: false, umami: false })
    expect(effectiveConsent(createConsent({ google: true, umami: false }, now)))
      .toEqual({ google: true, umami: false })
  })
  it('round trips a versioned dated choice', () => {
    const choice = createConsent({ google: false, umami: true }, now)
    expect(readConsent(JSON.stringify(choice), now + 1)).toEqual(choice)
  })
  it.each([null, '', '{}', 'false', '{broken', '{"version":0}',
    JSON.stringify({ version: 1, savedAt: now, google: 'true', umami: true }),
    JSON.stringify({ version: 1, savedAt: now + 1, google: true, umami: true }),
  ])('fails closed for invalid storage %s', (raw) => {
    expect(readConsent(raw, now)).toBeNull()
  })
  it('expires at 180 days, not only on the next visit', () => {
    const raw = JSON.stringify(createConsent({ google: true, umami: true }, now))
    expect(readConsent(raw, now + CONSENT_LIFETIME_MS - 1)).not.toBeNull()
    expect(readConsent(raw, now + CONSENT_LIFETIME_MS)).toBeNull()
  })
  it('respects privacy signals over a saved acceptance', () => {
    const choice = createConsent({ google: true, umami: true }, now)
    expect(effectiveConsent(choice, true)).toEqual({ google: false, umami: false })
  })
})
