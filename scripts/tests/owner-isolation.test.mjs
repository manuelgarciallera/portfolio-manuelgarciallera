import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { hashPublicInputs, proveOwnerIsolation } from '../lib/owner-isolation.mjs'

const fixtures = join(import.meta.dirname, '..', '__fixtures__')
const routes = {
  '/': { rawBytes: 50, gzipBytes: 90, files: ['static/chunks/common.js', 'static/chunks/home.js'] },
  '/casos': { rawBytes: 26, gzipBytes: 46, files: ['static/chunks/common.js'] },
  '/foo': { rawBytes: 23, gzipBytes: 43, files: ['static/chunks/grouped.js'] },
}
const runGit = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

async function fixture() {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-isolation-'))
  const artifactRoot = join(rootDir, 'owner-platform', '.data', 'verification-artifacts')
  const buildDir = join(artifactRoot, 'proof-build')
  await mkdir(artifactRoot, { recursive: true })
  await writeFile(join(rootDir, 'package.json'), JSON.stringify({ private: true, dependencies: { next: '1.0.0' } }))
  await writeFile(join(rootDir, 'package-lock.json'), '{"lockfileVersion":3}')
  runGit(rootDir, ['init']); runGit(rootDir, ['config', 'user.email', 'test@example.invalid']); runGit(rootDir, ['config', 'user.name', 'Test'])
  runGit(rootDir, ['add', 'package.json', 'package-lock.json']); runGit(rootDir, ['commit', '-m', 'checkpoint'])
  const checkpointCommit = runGit(rootDir, ['rev-parse', 'HEAD'])
  const checkpointTag = 'checkpoint/pre-editor-test'; runGit(rootDir, ['tag', checkpointTag])
  await cp(join(fixtures, 'public-boundary', 'clean', 'src'), join(rootDir, 'src'), { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'tsconfig.json'), join(rootDir, 'tsconfig.json'))
  await cp(join(fixtures, 'public-bundle', '.next'), buildDir, { recursive: true })
  await writeFile(join(buildDir, 'BUILD_ID'), 'fixture-build')
  await writeFile(join(rootDir, 'public-dependency-allowlist.json'), JSON.stringify({ packages: [] }))
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), JSON.stringify({ private: true }))
  await writeFile(join(rootDir, 'scripts-baseline.json'), JSON.stringify({ schemaVersion: 1, tolerance: { percent: 0.01, bytes: 2048 }, routes }))
  await mkdir(join(rootDir, 'scripts')); await cp(join(rootDir, 'scripts-baseline.json'), join(rootDir, 'scripts', 'public-bundle-baseline.json'))
  const verifiedGitHead = checkpointCommit
  const publicInputSha256 = await hashPublicInputs(rootDir)
  const buildId = (await readFile(join(buildDir, 'BUILD_ID'), 'utf8')).trim()
  await writeFile(join(buildDir, '.owner-public-build-provenance.json'), JSON.stringify({ schemaVersion: 1, verifiedGitHead, publicInputSha256, buildId }))
  return { artifactRoot, buildDir, checkpointCommit, checkpointTag, gitHead: verifiedGitHead, requireFreshBuild: false, rootDir }
}

test('derives checkpoint manifest and lock directly from the immutable tagged commit', async () => {
  const setup = await fixture(); const evidence = await proveOwnerIsolation(setup)
  assert.equal(evidence.passed, true); assert.equal(evidence.rootRuntimeManifestMatchesCheckpoint, true); assert.equal(evidence.buildProvenanceMatches, true)
  await rm(setup.rootDir, { recursive: true, force: true })
})

for (const dependency of ['graphql', 'better-sqlite3', 'sharp', 'pg']) {
  test(`rejects current/baseline collusion for injected runtime dependency: ${dependency}`, async () => {
    const setup = await fixture()
    await writeFile(join(setup.rootDir, 'package.json'), JSON.stringify({ dependencies: { next: '1.0.0', [dependency]: '1.0.0' } }))
    const evidence = await proveOwnerIsolation(setup)
    assert.equal(evidence.passed, false)
    assert.equal(evidence.rootRuntimeManifestMatchesCheckpoint, false)
    assert.equal(evidence.buildProvenanceMatches, false)
    await rm(setup.rootDir, { recursive: true, force: true })
  })
}

test('rejects a fake checkpoint or a tag moved away from the immutable commit', async () => {
  const setup = await fixture()
  await assert.rejects(proveOwnerIsolation({ ...setup, checkpointCommit: '0000000000000000000000000000000000000000' }))
  runGit(setup.rootDir, ['commit', '--allow-empty', '-m', 'other']); runGit(setup.rootDir, ['tag', '-f', setup.checkpointTag])
  await assert.rejects(proveOwnerIsolation(setup), /checkpoint tag/)
  await rm(setup.rootDir, { recursive: true, force: true })
})

test('rejects a tampered marker and a touched or future-dated build', async () => {
  const setup = await fixture()
  await writeFile(join(setup.buildDir, '.owner-public-build-provenance.json'), '{}')
  assert.equal((await proveOwnerIsolation(setup)).passed, false)
  const future = new Date(Date.now() + 60_000); await utimes(join(setup.buildDir, 'BUILD_ID'), future, future)
  await assert.rejects(proveOwnerIsolation(setup), /timestamps/)
  await rm(setup.rootDir, { recursive: true, force: true })
})

test('rejects descendant links that escape the workspace artifact tree', async () => {
  const setup = await fixture(); const outside = await mkdtemp(join(tmpdir(), 'owner-outside-'))
  const link = join(setup.buildDir, 'server', 'escape')
  await symlink(outside, link, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(proveOwnerIsolation(setup), /escapes the artifact root/)
  await rm(setup.rootDir, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true })
})
