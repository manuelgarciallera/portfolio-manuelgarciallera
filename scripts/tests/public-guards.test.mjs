import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { analyzePublicBoundary } from '../lib/public-boundary.mjs'
import {
  compareBundleSnapshot,
  createBundleSnapshot,
} from '../lib/public-bundle.mjs'

const fixtures = join(import.meta.dirname, '..', '__fixtures__')

test('public boundary follows aliases, re-exports, dynamic imports and cycles', async () => {
  const result = await analyzePublicBoundary({
    rootDir: join(fixtures, 'public-boundary', 'forbidden'),
  })

  assert.deepEqual(
    result.violations.map(({ importer, specifier }) => ({ importer, specifier })),
    [
      { importer: 'src/features/site/cycle-b.ts', specifier: '@payloadcms/ui' },
      { importer: 'src/features/site/lazy.ts', specifier: '@/owner/editor' },
    ],
  )
  assert.match(result.violations[0].trace.join(' -> '), /src\/app\/page\.tsx/)
})

test('public boundary ignores private app entries and accepts a clean public graph', async () => {
  const result = await analyzePublicBoundary({
    rootDir: join(fixtures, 'public-boundary', 'clean'),
  })

  assert.deepEqual(result.violations, [])
})

test('bundle snapshot counts each route chunk once and ignores owner routes', async () => {
  const snapshot = await createBundleSnapshot({
    buildDir: join(fixtures, 'public-bundle', '.next'),
  })

  assert.deepEqual(Object.keys(snapshot.routes), ['/', '/casos'])
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
