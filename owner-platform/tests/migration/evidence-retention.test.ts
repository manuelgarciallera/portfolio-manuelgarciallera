import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createPostgresCluster } from '../recovery/postgres-runtime.mjs'
import { finalizeSqliteEvidence } from './evidence-lifecycle.mjs'

const caches: string[] = []

const postgresFixture = async () => {
  const cache = await mkdtemp(path.join(tmpdir(), 'owner-migration-retention-test-'))
  caches.push(cache)
  const postgres = await createPostgresCluster({ cache, kind: 'recovery', tools: {} })
  const marker = path.join(postgres.root, 'synthetic-evidence')
  await writeFile(marker, 'retained')
  return { marker, postgres }
}

afterEach(async () => {
  for (const cache of caches.splice(0)) await rm(cache, { recursive: true, force: true })
})

describe('failed migration evidence lifecycle', () => {
  it('retains the exact SQLite run root when the run failed', async () => {
    const cache = await mkdtemp(path.join(tmpdir(), 'owner-migration-retention-test-'))
    caches.push(cache)
    const root = await mkdtemp(path.join(cache, 'owner-media-migration-'))
    const marker = path.join(root, 'synthetic-evidence')
    await writeFile(marker, 'retained')

    await expect(finalizeSqliteEvidence({
      cache,
      childrenClosed: true,
      failure: new Error('synthetic migration failure'),
      root,
    })).resolves.toEqual({ retained: true, root })

    await expect(stat(marker)).resolves.toMatchObject({ size: 8 })
  })

  it('deletes the exact SQLite run root only after full success', async () => {
    const cache = await mkdtemp(path.join(tmpdir(), 'owner-migration-retention-test-'))
    caches.push(cache)
    const root = await mkdtemp(path.join(cache, 'owner-media-migration-'))

    await expect(finalizeSqliteEvidence({ cache, childrenClosed: true, root })).resolves.toEqual({ retained: false, root })

    await expect(stat(root)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it.each([false, undefined])('retains SQLite evidence when worker closure is %s', async (childrenClosed) => {
    const cache = await mkdtemp(path.join(tmpdir(), 'owner-migration-retention-test-'))
    caches.push(cache)
    const root = await mkdtemp(path.join(cache, 'owner-media-migration-'))
    const marker = path.join(root, 'synthetic-evidence')
    await writeFile(marker, 'retained')

    await expect(finalizeSqliteEvidence({ cache, childrenClosed, root })).rejects.toThrow(/retained/i)

    await expect(stat(marker)).resolves.toMatchObject({ size: 8 })
  })

  it('retains the exact PostgreSQL run root after a proved shutdown', async () => {
    const { marker, postgres } = await postgresFixture()

    await postgres.shutdown({ childrenClosed: true, retainRoot: true })

    await expect(stat(marker)).resolves.toMatchObject({ size: 8 })
  })

  it.each([false, undefined])('retains PostgreSQL evidence when worker closure is %s', async (childrenClosed) => {
    const { marker, postgres } = await postgresFixture()

    await expect(postgres.shutdown({ childrenClosed, retainRoot: true })).rejects.toThrow(/retained/i)

    await expect(stat(marker)).resolves.toMatchObject({ size: 8 })
  })

  it('deletes the exact PostgreSQL run root after full success', async () => {
    const { postgres } = await postgresFixture()
    const root = postgres.root

    await postgres.shutdown({ childrenClosed: true })

    await expect(stat(root)).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
