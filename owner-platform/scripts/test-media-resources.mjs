import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, mkdir, mkdtemp, readdir, realpath, rmdir, unlink, writeFile } from 'node:fs/promises'
import { freemem, totalmem, type, release, arch } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { runCommand, redact, assertTaskRoot } from '../tests/recovery/postgres-runtime.mjs'
import { runWorker, workersClosed } from '../tests/recovery/worker-runner.mjs'
import { summarizeMeasurements } from '../tests/media/resource-measurements.mjs'

// Owns the cleanup gate even when initialization never returns a fixture handle.
export const createMeasurementFixtureLifecycle = () => {
  let fixture
  let serverClosed = true
  return {
    get serverClosed() { return serverClosed },
    async start(initialize) {
      // Initialization can open resources and then reject without returning a handle.
      // Until close resolves, absence of a handle is not evidence of shutdown.
      serverClosed = false
      fixture = await initialize()
      return fixture
    },
    async close() {
      if (fixture) {
        await fixture.close()
        fixture = undefined
        serverClosed = true
      }
    },
    async cleanup(removeKnownFiles) {
      assert(serverClosed, 'Cleanup requires confirmed server shutdown or no initialization attempt')
      await removeKnownFiles()
    },
  }
}

// Importing this orchestration boundary in focused tests must not run a benchmark.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ownerRoot = fileURLToPath(new URL('../', import.meta.url))
  const cache = path.join(ownerRoot, 'node_modules', '.cache')
  const prefix = 'owner-media-resources-'
  const rssStopBytes = 2 * 1024 ** 3
  const minimumAvailableBytes = 4 * 1024 ** 3
  const availableBytes = freemem()
  const result = { gate: 'not-run', startedAt: new Date().toISOString(),
    environment: { node: process.version, os: type(), release: release(), architecture: arch(), totalBytes: totalmem(), availableBytes },
    limits: { rssStopBytes, minimumAvailableBytes, sampleIntervalMs: 25, responseDeadlineMs: 15_000, processTimeoutMs: 120_000 },
    groups: [], failures: [] }
  if (availableBytes < minimumAvailableBytes) {
    console.error(JSON.stringify({ ...result, gate: 'blocked', failures: ['Reported available memory below 4 GiB.'] }, null, 2))
    process.exitCode = 1
  } else {
    await mkdir(cache, { recursive: true })
    const root = await mkdtemp(path.join(cache, prefix))
    await assertTaskRoot(cache, root, prefix)
    const resultPath = path.join(root, 'result.json')
    const fixturePath = path.join(root, 'http-fixture.mjs')
    const seedPath = path.join(root, 'resource-seed-worker.mjs')
    const credentials = { email: `resources-${randomUUID()}@example.invalid`, password: randomUUID() + randomUUID() }
    const payloadSecret = randomUUID() + randomUUID()
    let fixture
    let seeded
    const lifecycle = createMeasurementFixtureLifecycle()
    const ownedFiles = new Set(['http-fixture.mjs', 'resource-seed-worker.mjs', 'owner.db', 'owner.db-wal', 'owner.db-shm', 'owner.db-journal'])
    const ownedDirectories = new Set(['revisions', 'unused-native-media'])
    const persist = () => writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`)
    const hashFile = async (relativeFile) => {
      const digest = createHash('sha256')
      for await (const chunk of createReadStream(path.join(root, relativeFile))) digest.update(chunk)
      return digest.digest('hex')
    }
    try {
      result.applicationCommit = (await runCommand('git', ['rev-parse', 'HEAD'], { cwd: ownerRoot })).stdout.trim()
      // Both bundles are constructed before sampling. No source or active config is edited.
      for (const [source, outfile] of [['tests/media/http-fixture.ts', fixturePath], ['tests/media/resource-seed-worker.mjs', seedPath]]) {
        await build({ absWorkingDir: ownerRoot, bundle: true, entryPoints: [source], format: 'esm', outfile,
          packages: 'external', platform: 'node', target: 'node20' })
      }
      result.harnessSha256 = {}
      for (const relative of ['scripts/test-media-resources.mjs', 'tests/media/resource-seed-worker.mjs', 'tests/media/resource-client.mjs', 'tests/media/resource-measurements.mjs']) {
        const digest = createHash('sha256')
        for await (const chunk of createReadStream(path.join(ownerRoot, relative))) digest.update(chunk)
        result.harnessSha256[relative] = digest.digest('hex')
      }
      const seedStart = performance.now()
      seeded = await runWorker(seedPath, { mode: 'resource-seed', root, credentials, payloadSecret }, ownerRoot)
      assert(workersClosed(), 'Seed worker must actually close before opening the measurement server')
      result.seedElapsedMs = performance.now() - seedStart
      result.seedProcessClosedBeforeMeasurement = true
      result.datasets = seeded.datasets
      result.environment.sqliteVersion = seeded.sqliteVersion
      for (const dataset of seeded.datasets) {
        ownedDirectories.add(`revisions/${dataset.revision}`)
        ownedFiles.add(`revisions/${dataset.revision}/manifest.json`)
        for (const file of dataset.files) ownedFiles.add(file.relativeFile)
      }
      await persist()
      if (!seeded.nearLimitInRange) throw new Error(`Bound input outside 90–100% aggregate cap: ${seeded.datasets[1].aggregateBytes} bytes. No automatic recipe adjustment.`)
      const { startMediaHTTPFixture } = await import(pathToFileURL(fixturePath).href)
      fixture = await lifecycle.start(() => startMediaHTTPFixture({ root, revisionRoot: path.join(root, 'revisions'), staticDir: path.join(root, 'unused-native-media'),
        credentials, secret: payloadSecret, seed: false, database: { engine: 'sqlite', filename: path.join(root, 'owner.db') } }))
      result.serverPID = process.pid
      const ordinary = seeded.datasets[0].files.find((file) => file.variant === 'original')
      const nearOriginal = seeded.datasets[1].files.find((file) => file.variant === 'original')
      const nearSmall = seeded.datasets[1].files.filter((file) => file.variant !== 'original').sort((a, b) => a.bytes - b.bytes)[0]
      for (const [scenario, file] of [['ordinary-original', ordinary], ['near-limit-original', nearOriginal], ['near-limit-smallest-derivative', nearSmall]]) {
        for (const [phase, count, concurrency] of [['warm-up', 1, 1], ['serial', 8, 1], ['concurrent', 8, 4]]) {
          const group = { scenario, phase, count, concurrency, pathname: file.pathname, samples: [] }
          result.groups.push(group)
          let budgetExceeded = false
          const sample = () => {
            const { rss, heapUsed, external, arrayBuffers } = process.memoryUsage()
            group.samples.push({ elapsedMs: performance.now() - started, rss, heapUsed, external, arrayBuffers })
            if (rss > rssStopBytes) budgetExceeded = true
          }
          const started = performance.now()
          sample()
          if (budgetExceeded) throw new Error(`Server RSS exceeded 2 GiB before ${scenario}/${phase}; no client scheduled.`)
          const timer = setInterval(sample, 25)
          try {
            group.client = await runWorker(path.join(ownerRoot, 'tests/media/resource-client.mjs'), {
              mode: 'resource-client', origin: fixture.origin, pathname: file.pathname, expectedBytes: file.bytes,
              expectedSha256: file.sha256, count, concurrency,
            }, ownerRoot)
          } catch (error) { group.error = error.message; throw error }
          finally { clearInterval(timer); sample(); group.elapsedMs = performance.now() - started }
          assert(workersClosed(), 'Client must actually close before group completion')
          if (group.client.failures.length || group.client.responses.length !== count) throw new Error(`Delivery/client failure in ${scenario}/${phase}; receipts preserved.`)
          group.summary = summarizeMeasurements({ samples: group.samples, responses: group.client.responses })
          group.budgetExceeded = budgetExceeded
          await persist()
          console.log(`[resources] ${scenario}/${phase}: ${count} responses; peak RSS ${group.summary.memory.peak.rss}; ${group.elapsedMs.toFixed(1)} ms`)
          if (budgetExceeded) throw new Error(`Observed server RSS exceeded 2 GiB in ${scenario}/${phase}; no further groups scheduled.`)
        }
      }
      await lifecycle.close()
      fixture = undefined
      for (const dataset of seeded.datasets) for (const file of dataset.files) {
        assert.equal((await lstat(path.join(root, file.relativeFile))).size, file.bytes)
        assert.equal(await hashFile(file.relativeFile), file.sha256, 'Synthetic revision bytes unchanged after all downloads')
      }
      result.syntheticRevisionBytesUnchanged = true
      result.gate = 'passed'
    } catch (error) {
      result.gate = 'failed'
      result.failures.push(redact(error.stack ?? error.message, [credentials.password, payloadSecret]))
      process.exitCode = 1
    } finally {
      try { await lifecycle.close() }
      catch (error) { result.failures.push(`Server close failed: ${redact(error.message, [credentials.password, payloadSecret])}`); result.gate = 'failed'; process.exitCode = 1 }
      result.clientsClosed = workersClosed()
      result.serverClosed = lifecycle.serverClosed
      result.finishedAt = new Date().toISOString()
      try {
        assert(workersClosed(), 'Cleanup requires actual client shutdown')
        await lifecycle.cleanup(async () => {
          await assertTaskRoot(cache, root, prefix)
          const files = []
          const directories = []
          const inventory = async (directory, relative = '') => {
            for (const entry of await readdir(directory, { withFileTypes: true })) {
              const child = relative ? `${relative}/${entry.name}` : entry.name
              const absolute = path.join(root, child)
              const stats = await lstat(absolute)
              assert(!stats.isSymbolicLink() && path.relative(await realpath(absolute), path.resolve(absolute)) === '', `Linked cleanup entry: ${child}`)
              if (stats.isDirectory()) {
                assert(ownedDirectories.has(child), `Unknown synthetic directory retained: ${child}`)
                await inventory(absolute, child)
                directories.push(absolute)
              } else {
                assert(stats.isFile() && stats.nlink === 1, `Unsafe cleanup entry: ${child}`)
                if (child === 'result.json') continue
                assert(ownedFiles.has(child), `Unknown synthetic file retained: ${child}`)
                files.push(absolute)
              }
            }
          }
          // Validate the entire known inventory first; unlink only files, then empty dirs.
          await inventory(root)
          for (const file of files) await unlink(file)
          for (const directory of directories) await rmdir(directory)
          result.cleanup = { removedKnownSyntheticFiles: files.length, removedEmptyDirectories: directories.length, retained: 'result.json only' }
        })
      } catch (error) {
        result.cleanup = { error: error.message, retainedRoot: root }
        result.gate = 'failed'
        process.exitCode = 1
      }
      await persist()
      console.log(JSON.stringify({ gate: result.gate, groups: result.groups.length, failures: result.failures, cleanup: result.cleanup, resultPath }, null, 2))
    }
  }
}
