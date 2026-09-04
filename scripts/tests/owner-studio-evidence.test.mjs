import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { assertEvidenceOnlyChanges, createOwnerStudioEvidence, verifyOwnerStudioEvidence } from '../lib/owner-studio-evidence.mjs'

const fixture = async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'owner-studio-evidence-'))
  await mkdir(join(rootDir, 'owner-platform', 'src', 'brand'), { recursive: true })
  await mkdir(join(rootDir, 'owner-platform', 'scripts'), { recursive: true })
  await mkdir(join(rootDir, 'docs', 'owner-platform'), { recursive: true })
  await writeFile(join(rootDir, 'owner-platform', 'src', 'brand', 'model.ts'), 'export const version = 1\n')
  await writeFile(join(rootDir, 'owner-platform', 'package.json'), '{"name":"owner","private":true}\n')
  await writeFile(join(rootDir, 'owner-platform', 'package-lock.json'), '{"lockfileVersion":3}\n')
  await writeFile(join(rootDir, 'owner-platform', 'next.config.mjs'), 'export default {}\n')
  await writeFile(join(rootDir, 'owner-platform', 'tsconfig.json'), '{}\n')
  await writeFile(join(rootDir, 'owner-platform', 'scripts', 'build.mjs'), 'export const build = true\n')
  const isolation = {
    schemaVersion: 3,
    passed: true,
    verifiedGitHead: 'a'.repeat(40),
    publicBoundary: { violations: [] },
    publicBundle: { regressions: [], routeCount: 9 },
  }
  await writeFile(join(rootDir, 'docs', 'owner-platform', 'isolation-evidence-2026-09-04.json'), `${JSON.stringify(isolation)}\n`)
  execFileSync('git', ['init', '--quiet'], { cwd: rootDir })
  execFileSync('git', ['add', 'owner-platform'], { cwd: rootDir })
  return rootDir
}

test('creates deterministic evidence bound to the verified git head and isolation record', async () => {
  const rootDir = await fixture()
  const first = await createOwnerStudioEvidence({ rootDir })
  const second = await createOwnerStudioEvidence({ rootDir })
  assert.deepEqual(first, second)
  assert.equal(Object.hasOwn(first, 'passed'), false)
  assert.equal(first.verifiedGitHead, 'a'.repeat(40))
  assert.match(first.ownerTrackedSurfaceSha256, /^[a-f0-9]{64}$/)
  assert.match(first.ownerPackageLockSha256, /^[a-f0-9]{64}$/)
  assert.match(first.isolationEvidenceSha256, /^[a-f0-9]{64}$/)
})

test('fails closed when isolation did not pass or is not bound to a commit', async () => {
  const rootDir = await fixture()
  const path = join(rootDir, 'docs', 'owner-platform', 'isolation-evidence-2026-09-04.json')
  await writeFile(path, JSON.stringify({ schemaVersion: 3, passed: false, verifiedGitHead: 'bad' }))
  await assert.rejects(createOwnerStudioEvidence({ rootDir }), /isolation evidence/i)
})

test('changes its source digest when an owner studio source file changes', async () => {
  const rootDir = await fixture()
  const before = await createOwnerStudioEvidence({ rootDir })
  await writeFile(join(rootDir, 'owner-platform', 'src', 'brand', 'model.ts'), 'export const version = 2\n')
  const after = await createOwnerStudioEvidence({ rootDir })
  assert.notEqual(before.ownerTrackedSurfaceSha256, after.ownerTrackedSurfaceSha256)
})

test('changes its tracked surface digest when the owner build script changes', async () => {
  const rootDir = await fixture()
  const before = await createOwnerStudioEvidence({ rootDir })
  await writeFile(join(rootDir, 'owner-platform', 'scripts', 'build.mjs'), 'export const build = false\n')
  await assert.rejects(verifyOwnerStudioEvidence(before, { rootDir }), /does not match/i)
})

test('allows only the isolation record and its owner-studio companion after the verified commit', () => {
  assert.doesNotThrow(() => assertEvidenceOnlyChanges([
    'docs/owner-platform/isolation-evidence-2026-09-04.json',
    'docs/owner-platform/owner-studio-phase-2-evidence.json',
  ], 'docs/owner-platform/isolation-evidence-2026-09-04.json'))
  assert.throws(() => assertEvidenceOnlyChanges([
    'docs/owner-platform/isolation-evidence-2026-09-04.json',
    'src/app/page.tsx',
  ], 'docs/owner-platform/isolation-evidence-2026-09-04.json'), /other than/i)
})
