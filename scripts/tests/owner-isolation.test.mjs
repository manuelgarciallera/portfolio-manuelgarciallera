import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { proveOwnerIsolation } from '../lib/owner-isolation.mjs'

const fixtures = join(import.meta.dirname, '..', '__fixtures__')
const routes = {
  '/': { rawBytes: 50, gzipBytes: 90, files: ['static/chunks/common.js', 'static/chunks/home.js'] },
  '/casos': { rawBytes: 26, gzipBytes: 46, files: ['static/chunks/common.js'] },
  '/foo': { rawBytes: 23, gzipBytes: 43, files: ['static/chunks/grouped.js'] },
}

async function fixture(runtimeDependencies = { next: '1.0.0' }) {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-isolation-'))
  const artifactRoot = join(rootDir, 'owner-platform', '.data', 'verification-artifacts')
  const buildDir = join(artifactRoot, 'proof-build')
  await mkdir(artifactRoot, { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'src'), join(rootDir, 'src'), { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'tsconfig.json'), join(rootDir, 'tsconfig.json'))
  await cp(join(fixtures, 'public-bundle', '.next'), buildDir, { recursive: true })
  await writeFile(join(rootDir, 'public-dependency-allowlist.json'), JSON.stringify({ packages: [] }))
  await writeFile(join(rootDir, 'package.json'), JSON.stringify({ private: true, dependencies: runtimeDependencies }))
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), JSON.stringify({ private: true, dependencies: { payload: '3.88.0' } }))
  await writeFile(join(rootDir, 'package-lock.json'), '{"lockfileVersion":3}')
  await writeFile(join(rootDir, 'baseline.json'), JSON.stringify({ schemaVersion: 1, tolerance: { percent: 0.01, bytes: 2048 }, routes }))
  const lock = await readFile(join(rootDir, 'package-lock.json'))
  const checkpointBaseline = {
    checkpoint: { commit: 'checkpoint', tag: 'checkpoint/tag' },
    rootRuntimeManifest: { dependencies: { next: '1.0.0' }, optionalDependencies: {}, peerDependencies: {}, overrides: {} },
    rootPackageLockSha256: createHash('sha256').update(lock).digest('hex'),
  }
  return { artifactRoot, buildDir, checkpointBaseline, rootDir }
}

test('combines exact manifest, lock, boundary, bundle, and hash evidence', async () => {
  const setup = await fixture()
  const evidence = await proveOwnerIsolation({ ...setup, baselinePath: join(setup.rootDir, 'baseline.json'), gitHead: 'verified-head', requireFreshBuild: false })
  assert.equal(evidence.passed, true)
  assert.equal(evidence.verifiedGitHead, 'verified-head')
  assert.equal(evidence.rootRuntimeManifestMatchesCheckpoint, true)
  assert.equal(evidence.rootPackageLockMatchesCheckpoint, true)
  assert.match(evidence.publicInputSha256, /^[a-f0-9]{64}$/)
  assert.match(evidence.publicBundle.outputSha256, /^[a-f0-9]{64}$/)
  await rm(setup.rootDir, { recursive: true, force: true })
})

for (const dependency of ['graphql', 'better-sqlite3', 'sharp', 'pg']) {
  test(`fails closed for arbitrary root runtime dependency drift: ${dependency}`, async () => {
    const setup = await fixture({ next: '1.0.0', [dependency]: '1.0.0' })
    const evidence = await proveOwnerIsolation({ ...setup, baselinePath: join(setup.rootDir, 'baseline.json'), gitHead: 'verified-head', requireFreshBuild: false })
    assert.equal(evidence.passed, false)
    assert.equal(evidence.rootRuntimeManifestMatchesCheckpoint, false)
    await rm(setup.rootDir, { recursive: true, force: true })
  })
}

test('fails closed for any root lockfile drift', async () => {
  const setup = await fixture()
  await writeFile(join(setup.rootDir, 'package-lock.json'), '{"lockfileVersion":2}')
  const evidence = await proveOwnerIsolation({ ...setup, baselinePath: join(setup.rootDir, 'baseline.json'), gitHead: 'verified-head', requireFreshBuild: false })
  assert.equal(evidence.passed, false)
  assert.equal(evidence.rootPackageLockMatchesCheckpoint, false)
  await rm(setup.rootDir, { recursive: true, force: true })
})

test('rejects build paths outside the dedicated verification artifact root', async () => {
  const setup = await fixture()
  await assert.rejects(proveOwnerIsolation({ ...setup, buildDir: join(setup.rootDir, 'arbitrary-build'), requireFreshBuild: false }), /dedicated directory/)
  await rm(setup.rootDir, { recursive: true, force: true })
})

test('requires a fresh production build by default', async () => {
  const setup = await fixture()
  await rm(join(setup.buildDir, 'BUILD_ID'), { force: true })
  await assert.rejects(proveOwnerIsolation({ ...setup, baselinePath: join(setup.rootDir, 'baseline.json'), gitHead: 'verified-head' }), /production build provenance is missing/)
  await rm(setup.rootDir, { recursive: true, force: true })
})
