// Canonical link origin only. This does not verify DNS, ownership or delivery.
export const resolveOwnerServerURL = ({ value, productionBuild, nodeEnv }: {
  value?: string; productionBuild?: boolean; nodeEnv?: string
}): string | undefined => {
  if (productionBuild) return undefined
  if (value === undefined || value === '') {
    if (nodeEnv === 'production') throw new Error('OWNER_SERVER_URL is required in production runtime')
    return undefined
  }
  const invalid = () => new Error('OWNER_SERVER_URL must be an HTTPS origin without credentials, path, query or fragment')
  if (/[\s\\?#@]/.test(value) || !/^https?:\/\/[^/]+\/?$/i.test(value)) throw invalid()
  let url: URL
  try { url = new URL(value) } catch { throw invalid() }
  const localHTTP = nodeEnv !== 'production' && url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((!localHTTP && url.protocol !== 'https:') || !url.hostname || url.username || url.password || url.pathname !== '/') throw invalid()
  return url.origin
}
