import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { analyzePublicBoundary } from '../lib/public-boundary.mjs'
import {
  assertFreshBuild,
  compareBundleSnapshot,
  createBundleSnapshot,
} from '../lib/public-bundle.mjs'

const fixtures = join(import.meta.dirname, '..', '__fixtures__')

test('public boundary parses TypeScript import forms without regex bypasses', async () => {
  const result = await analyzePublicBoundary({
    rootDir: join(fixtures, 'public-boundary', 'forbidden'),
  })

  assert.deepEqual(
    result.violations.map(({ importer, specifier, reason }) => ({ importer, specifier, reason })),
    [
      { importer: 'src/features/site/cycle-b.ts', specifier: '@payloadcms/ui', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/lazy.ts', specifier: '@/owner/editor', reason: 'private owner/admin module' },
      { importer: 'src/features/site/syntax.ts', specifier: '@lexical/react', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/syntax.ts', specifier: '@measured/puck', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/syntax.ts', specifier: '@payloadcms/ui', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/syntax.ts', specifier: 'lexical', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/syntax.ts', specifier: 'payload', reason: 'explicitly forbidden public dependency' },
      { importer: 'src/features/site/syntax.ts', specifier: 'unreviewed-package', reason: 'public dependency is not allowlisted' },
    ],
  )
  assert.match(result.violations[0].trace.join(' -> '), /src\/app\/page\.tsx/)
})

test('public boundary ignores private app entries and accepts a clean public graph', async () => {
  const result = await analyzePublicBoundary({
    rootDir: join(fixtures, 'public-boundary', 'clean'),
  })

  assert.deepEqual(result.violations, [])
  assert.ok(result.entries.includes('src/app/(admin)/foo/page.tsx'))
})

test('public boundary follows CSS imports and CSS url references into private styles', async () => {
  const result = await analyzePublicBoundary({
    rootDir: join(fixtures, 'public-boundary', 'css-forbidden'),
  })

  assert.deepEqual(result.violations.map(({ importer, reason }) => ({ importer, reason })), [
    { importer: 'src/styles/public.css', reason: 'private owner/admin module' },
    { importer: 'src/styles/public.css', reason: 'private owner/admin module' },
  ])
})

test('bundle snapshot strips route groups but excludes real owner URL segments', async () => {
  const snapshot = await createBundleSnapshot({
    buildDir: join(fixtures, 'public-bundle', '.next'),
  })

  assert.deepEqual(Object.keys(snapshot.routes), ['/', '/casos', '/foo'])
  assert.deepEqual(snapshot.routes['/'].files, [
    'static/chunks/common.js',
    'static/chunks/home.js',
  ])
  assert.equal(snapshot.routes['/'].rawBytes, 50)
})

test('bundle comparison fails a regression beyond the larger of 1% or 2KB', () => {
  const baseline = {
    schemaVersion: 1,
    tolerance: { percent: 0.01, bytes: 2048 },
    routes: { '/': { rawBytes: 10_000, gzipBytes: 5_000, files: [] } },
  }
  const current = {
    ...baseline,
    routes: { '/': { rawBytes: 12_049, gzipBytes: 7_049, files: [] } },
  }

  assert.deepEqual(compareBundleSnapshot(current, baseline), [
    '/ raw increased by 2049 B (limit 2048 B)',
    '/ gzip increased by 2049 B (limit 2048 B)',
  ])
})

test('bundle comparison fails for missing and new public routes', () => {
  const baseline = {
    schemaVersion: 1,
    tolerance: { percent: 0.01, bytes: 2048 },
    routes: {
      '/': { rawBytes: 1, gzipBytes: 1, files: [] },
      '/casos': { rawBytes: 1, gzipBytes: 1, files: [] },
    },
  }
  const current = {
    ...baseline,
    routes: {
      '/': { rawBytes: 1, gzipBytes: 1, files: [] },
      '/articulos': { rawBytes: 1, gzipBytes: 1, files: [] },
    },
  }

  assert.deepEqual(compareBundleSnapshot(current, baseline), [
    'missing public route: /casos',
    'public route has no baseline: /articulos',
  ])
})

test('bundle comparison rejects malformed baseline metrics and tolerance', () => {
  const current = {
    schemaVersion: 1,
    tolerance: { percent: 0.01, bytes: 2048 },
    routes: { '/': { rawBytes: 1, gzipBytes: 1, files: [] } },
  }
  const malformed = {
    schemaVersion: 1,
    tolerance: { percent: -1, bytes: Number.NaN },
    routes: { '/': { rawBytes: 'large', gzipBytes: -1, files: 'chunk.js' } },
  }

  assert.deepEqual(compareBundleSnapshot(current, malformed), [
    'baseline tolerance.percent must be a finite nonnegative number',
    'baseline tolerance.bytes must be a finite nonnegative number',
    'baseline route / rawBytes must be a finite nonnegative number',
    'baseline route / gzipBytes must be a finite nonnegative number',
    'baseline route / files must be an array of strings',
  ])
})

test('bundle snapshot rejects malformed manifest chunk arrays', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'portfolio-bundle-shape-'))
  const buildDir = join(temporaryRoot, '.next')
  await cp(join(fixtures, 'public-bundle', '.next'), buildDir, { recursive: true })
  const manifestPath = join(buildDir, 'server', 'app', 'page_client-reference-manifest.js')
  const manifest = await readFile(manifestPath, 'utf8')
  await writeFile(manifestPath, manifest.replace('"chunks":[', '"chunks":"invalid", "ignored":['))

  await assert.rejects(createBundleSnapshot({ buildDir }), /chunks must be an array/)
  await rm(temporaryRoot, { recursive: true, force: true })
})

test('standalone bundle guard rejects a build older than public source', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'portfolio-bundle-stale-'))
  const buildDir = join(temporaryRoot, '.next')
  await cp(join(fixtures, 'public-bundle', '.next'), buildDir, { recursive: true })
  await cp(join(fixtures, 'public-boundary', 'clean', 'src'), join(temporaryRoot, 'src'), { recursive: true })
  await writeFile(join(temporaryRoot, 'package.json'), '{}')
  await writeFile(join(buildDir, 'BUILD_ID'), 'fixture-build')
  const future = new Date(Date.now() + 10_000)
  await import('node:fs/promises').then(({ utimes }) => utimes(join(temporaryRoot, 'src', 'app', 'page.tsx'), future, future))

  await assert.rejects(assertFreshBuild({ rootDir: temporaryRoot, buildDir }), /production build is stale/)
  await rm(temporaryRoot, { recursive: true, force: true })
})

test('bundle snapshot fails when a manifest references a missing client file', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'portfolio-bundle-guard-'))
  const buildDir = join(temporaryRoot, '.next')
  await cp(join(fixtures, 'public-bundle', '.next'), buildDir, { recursive: true })
  const manifestPath = join(buildDir, 'server', 'app', 'page_client-reference-manifest.js')
  const manifest = await readFile(manifestPath, 'utf8')
  await writeFile(manifestPath, manifest.replace('home.js', 'missing.js'))

  await assert.rejects(
    createBundleSnapshot({ buildDir }),
    /missing client chunk.*missing\.js/,
  )
  await rm(temporaryRoot, { recursive: true, force: true })
})
