import path from 'node:path'
import { randomUUID } from 'node:crypto'

process.once('message', async input => {
  let payload
  try {
    process.env.PAYLOAD_SECRET = input.payloadSecret
    const { buildConfig, getPayload } = await import('payload')
    const { postgresAdapter } = await import('@payloadcms/db-postgres')
    const { createOwnerConfig } = await import('../../src/payload.config.ts')
    const { migrations } = input.objectMedia ? await import('../../database/object-storage/index.ts') : await import('../../database/baseline/index.ts')
    const config = createOwnerConfig()
    payload = await getPayload({ key: randomUUID(), config: await buildConfig({ ...config,
      telemetry: false, typescript: { ...config.typescript, autoGenerate: false },
      db: postgresAdapter({ pool: input.postgres, push: false, disableCreateDatabase: true,
        migrationDir: path.resolve('database/baseline') }),
    }) })
    await payload.db.migrate({ migrations })
    await payload.create({ collection: 'users', data: { ...input.credentials, role: 'owner' } })
    await payload.destroy()
    payload = undefined
    process.send({ ok: true, result: { seeded: true } }, () => process.exit(0))
  } catch {
    await payload?.destroy().catch(() => {})
    process.send({ ok: false, error: 'Synthetic production seed failed' }, () => process.exit(1))
  }
})
process.send({ ready: true })
