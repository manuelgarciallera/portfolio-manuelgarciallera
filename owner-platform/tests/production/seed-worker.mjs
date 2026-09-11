import path from 'node:path'
import { randomUUID } from 'node:crypto'

process.once('message', async input => {
  let payload
  try {
    process.env.PAYLOAD_SECRET = input.payloadSecret
    const { buildConfig, getPayload } = await import('payload')
    const { recoveryPostgresAdapter } = await import('../../src/auth/recovery-postgres.ts')
    const { createOwnerConfig } = await import('../../src/payload.config.ts')
    const { migrations: recoveryMigrations } = await import('../../database/recovery-admission/index.ts')
    // Local-media QA needs the baseline and the independent admission delta,
    // not nullable object-storage fields absent from that configuration.
    const migrations = input.objectMedia ? recoveryMigrations
      : [...(await import('../../database/baseline/index.ts')).migrations, recoveryMigrations.at(-1)]
    const config = createOwnerConfig()
    payload = await getPayload({ key: randomUUID(), config: await buildConfig({ ...config,
      telemetry: false, typescript: { ...config.typescript, autoGenerate: false },
      db: recoveryPostgresAdapter({ pool: input.postgres, push: false, disableCreateDatabase: true,
        migrationDir: path.resolve('database/recovery-admission') }),
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
