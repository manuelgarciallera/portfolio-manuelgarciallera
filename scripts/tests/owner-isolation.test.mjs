import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { proveOwnerIsolation } from '../lib/owner-isolation.mjs'

const fixtures = join(import.meta.dirname, '..', '__fixtures__')

test('owner isolation proof combines dependency, boundary, and bundle evidence', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-isolation-'))
  await cp(join(fixtures, 'public-boundary', 'clean', 'src'), join(rootDir, 'src'), { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'tsconfig.json'), join(rootDir, 'tsconfig.json'))
  await cp(join(fixtures, 'public-bundle', '.next'), join(rootDir, '.next-proof'), { recursive: true })
  await mkdir(join(rootDir, 'owner-platform'))
  await writeFile(join(rootDir, 'public-dependency-allowlist.json'), JSON.stringify({ packages: [] }))
  await writeFile(join(rootDir, 'package.json'), JSON.stringify({ private: true, dependencies: { next: '1.0.0' } }))
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), JSON.stringify({ private: true, dependencies: { payload: '3.88.0' } }))
  await writeFile(
    join(rootDir, 'baseline.json'),
    JSON.stringify({
      schemaVersion: 1,
      tolerance: { percent: 0.01, bytes: 2048 },
      routes: {
        '/': { rawBytes: 50, gzipBytes: 90, files: ['static/chunks/common.js', 'static/chunks/home.js'] },
        '/casos': { rawBytes: 26, gzipBytes: 46, files: ['static/chunks/common.js'] },
        '/foo': { rawBytes: 23, gzipBytes: 43, files: ['static/chunks/grouped.js'] },
      },
    }),
  )

  const evidence = await proveOwnerIsolation({
    baselinePath: join(rootDir, 'baseline.json'),
    buildDir: join(rootDir, '.next-proof'),
    requireFreshBuild: false,
    rootDir,
  })

  assert.equal(evidence.passed, true)
  assert.deepEqual(evidence.publicBoundary.violations, [])
  assert.deepEqual(evidence.rootRuntimeOwnerDependencies, [])
  assert.equal(evidence.publicBundle.routeCount, 3)
  assert.deepEqual(evidence.publicBundle.regressions, [])
  await rm(rootDir, { recursive: true, force: true })
})

test('owner isolation proof fails closed when an owner dependency enters root runtime', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-isolation-dependency-'))
  await cp(join(fixtures, 'public-boundary', 'clean', 'src'), join(rootDir, 'src'), { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'tsconfig.json'), join(rootDir, 'tsconfig.json'))
  await cp(join(fixtures, 'public-bundle', '.next'), join(rootDir, '.next-proof'), { recursive: true })
  await mkdir(join(rootDir, 'owner-platform'))
  await writeFile(join(rootDir, 'public-dependency-allowlist.json'), JSON.stringify({ packages: [] }))
  await writeFile(join(rootDir, 'package.json'), JSON.stringify({ dependencies: { payload: '3.88.0' } }))
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), JSON.stringify({ private: true, dependencies: { payload: '3.88.0' } }))
  await writeFile(
    join(rootDir, 'baseline.json'),
    JSON.stringify({
      schemaVersion: 1,
      tolerance: { percent: 0.01, bytes: 2048 },
      routes: {
        '/': { rawBytes: 50, gzipBytes: 90, files: ['static/chunks/common.js', 'static/chunks/home.js'] },
        '/casos': { rawBytes: 26, gzipBytes: 46, files: ['static/chunks/common.js'] },
        '/foo': { rawBytes: 23, gzipBytes: 43, files: ['static/chunks/grouped.js'] },
      },
    }),
  )

  const evidence = await proveOwnerIsolation({
    baselinePath: join(rootDir, 'baseline.json'),
    buildDir: join(rootDir, '.next-proof'),
    requireFreshBuild: false,
    rootDir,
  })

  assert.equal(evidence.passed, false)
  assert.deepEqual(evidence.rootRuntimeOwnerDependencies, ['payload'])
  await rm(rootDir, { recursive: true, force: true })
})

test('owner isolation proof requires a fresh production build by default', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-isolation-stale-'))
  await mkdir(join(rootDir, 'owner-platform'), { recursive: true })
  await mkdir(join(rootDir, 'src', 'app'), { recursive: true })
  await writeFile(join(rootDir, 'package.json'), JSON.stringify({ private: true }))
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), JSON.stringify({ private: true }))
  await writeFile(join(rootDir, 'public-dependency-allowlist.json'), JSON.stringify({ packages: [] }))
  await writeFile(join(rootDir, 'baseline.json'), JSON.stringify({ schemaVersion: 1, tolerance: { percent: 0.01, bytes: 2048 }, routes: {} }))

  await assert.rejects(
    proveOwnerIsolation({ baselinePath: join(rootDir, 'baseline.json'), rootDir }),
    /production build provenance is missing/,
  )
  await rm(rootDir, { recursive: true, force: true })
})
