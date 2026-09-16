export type Selection = { google: boolean; umami: boolean }
export type Consent = Selection & { version: 1; savedAt: number }
export const CONSENT_KEY = 'portfolio-analytics-consent-v1'
export const CONSENT_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000
export const NO_ANALYTICS: Selection = { google: false, umami: false }

export function createConsent(selection: Selection, now: number): Consent {
  return { version: 1, savedAt: now, ...selection }
}
export function readConsent(raw: string | null, now: number): Consent | null {
  if (!raw || !Number.isFinite(now)) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const candidate = value as Partial<Consent>
    if (candidate.version !== 1 || typeof candidate.google !== 'boolean' ||
      typeof candidate.umami !== 'boolean' || typeof candidate.savedAt !== 'number' ||
      !Number.isFinite(candidate.savedAt) || candidate.savedAt < 0 ||
      candidate.savedAt > now || now - candidate.savedAt >= CONSENT_LIFETIME_MS) return null
    return createConsent({ google: candidate.google, umami: candidate.umami }, candidate.savedAt)
  } catch { return null }
}
export function effectiveConsent(consent: Consent | null, privacy = false): Selection {
  return consent && !privacy
    ? { google: consent.google, umami: consent.umami }
    : { ...NO_ANALYTICS }
}
