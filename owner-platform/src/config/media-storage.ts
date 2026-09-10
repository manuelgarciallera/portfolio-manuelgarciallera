import type { Config } from 'payload'

const fields = ['ENDPOINT', 'REGION', 'BUCKET', 'PREFIX', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'SCRATCH_DIR'] as const
const invalid = () => new Error('Invalid owner media storage configuration; explicit mode, namespace, credentials, origin and provisioned scratch directory required.')

// Server-owned selection, not a request/tenant parameter. Configuration validity
// does not prove provider permissions, persistence, backups or migration readiness.
export const configureMediaStorage = async (config: Config, env: Record<string, string | undefined>): Promise<Config> => {
  const mode = env.OWNER_MEDIA_MODE
  if (!mode || mode === 'legacy') {
    if (fields.some(field => Boolean(env[`OWNER_MEDIA_${field}`]))) throw invalid()
    return config
  }
  if (mode !== 'objects') throw invalid()
  const values = Object.fromEntries(fields.map(field => [field, env[`OWNER_MEDIA_${field}`]])) as Record<typeof fields[number], string>
  if (Object.values(values).some(value => typeof value !== 'string' || !value || value !== value.trim() || /[\r\n\t\0]/.test(value))) throw invalid()
  const origin = (value: string | undefined) => {
    if (!value || /[\s\\?#@]/.test(value)) throw invalid()
    let url: URL
    try { url = new URL(value) } catch { throw invalid() }
    const local = env.NODE_ENV !== 'production' && url.protocol === 'http:' && url.hostname === '127.0.0.1' && Boolean(url.port)
    if (url.origin !== value || (url.protocol !== 'https:' && !local)) throw invalid()
    return value
  }
  const endpoint = origin(values.ENDPOINT)
  const nativeFetchOrigin = origin(env.OWNER_SERVER_URL)
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(values.REGION) ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(values.BUCKET) ||
    !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(values.PREFIX)) throw invalid()
  const media = config.collections?.filter(collection => collection.slug === 'media')
  if (media?.length !== 1) throw invalid()
  // No client or credential chain is loaded for legacy installations.
  const [{ S3Client }, { createObjectRevisionStore }, { createTransportRevisionStorageCollection }] = await Promise.all([
    import('@aws-sdk/client-s3'), import('../media/object-revision-store'), import('../media/revision-storage-binding'),
  ])
  const client = new S3Client({ endpoint, region: values.REGION, forcePathStyle: true, maxAttempts: 1,
    credentials: { accessKeyId: values.ACCESS_KEY_ID, secretAccessKey: values.SECRET_ACCESS_KEY },
    requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
  try {
    const bound = await createTransportRevisionStorageCollection(media[0], {
      nativeFetchOrigin, staticDir: values.SCRATCH_DIR,
      store: createObjectRevisionStore({ client, bucket: values.BUCKET, prefix: values.PREFIX }),
    })
    return { ...config, collections: config.collections!.map(collection => collection.slug === 'media' ? bound : collection) }
  } catch {
    client.destroy()
    throw invalid()
  }
}
