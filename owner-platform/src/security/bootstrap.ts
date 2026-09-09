import { createHash, timingSafeEqual } from 'node:crypto'

const FIRST_USER_BOOTSTRAP_PATH = '/api/users/first-register'
const MINIMUM_BOOTSTRAP_SECRET_LENGTH = 32

export const isFirstUserBootstrapPath = (input: string): boolean => {
  try {
    // Next decodes route segments before Payload reconstructs the endpoint.
    // Protect equivalent URL spellings, not just the literal request URL.
    const pathname = decodeURIComponent(new URL(input).pathname).replace(/\/$/, '')
    return pathname.toLowerCase() === FIRST_USER_BOOTSTRAP_PATH
  } catch {
    return false
  }
}

const digest = (value: string): Buffer => createHash('sha256').update(value).digest()

export const authorizeFirstUserBootstrap = (
  configuredSecret?: string,
  providedSecret?: string | null,
): boolean => {
  if (
    !configuredSecret ||
    !providedSecret ||
    configuredSecret.length < MINIMUM_BOOTSTRAP_SECRET_LENGTH
  ) {
    return false
  }

  return timingSafeEqual(digest(configuredSecret), digest(providedSecret))
}
