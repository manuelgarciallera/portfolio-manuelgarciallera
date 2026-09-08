import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { summarizeMeasurements } from './resource-measurements.mjs'
import { runClient } from './resource-client.mjs'

const sample = { rss: 100, heapUsed: 20, external: 30, arrayBuffers: 10 }
const response = { elapsedMs: 5, bytes: 7, status: 200, sha256: 'a'.repeat(64), expectedSha256: 'a'.repeat(64) }

// Catches selecting the final sample as peak and reporting header-only/count latency.
test('summarizes independent memory peaks and full-response latency with literal expectations', () => {
  assert.deepEqual(summarizeMeasurements({ samples: [sample,
    { rss: 300, heapUsed: 40, external: 80, arrayBuffers: 60 },
    { rss: 150, heapUsed: 50, external: 40, arrayBuffers: 20 }],
  responses: [{ ...response, elapsedMs: 9 }, response, { ...response, elapsedMs: 1 }, { ...response, elapsedMs: 3 }] }), {
    sampleCount: 3, memory: { baseline: { rss: 100, heapUsed: 20, external: 30, arrayBuffers: 10 },
      peak: { rss: 300, heapUsed: 50, external: 80, arrayBuffers: 60 },
      final: { rss: 150, heapUsed: 50, external: 40, arrayBuffers: 20 } },
    responseCount: 4, responseBytes: 28, latencyMs: { min: 1, median: 4, max: 9 },
  })
})

test('single and odd response counts retain the actual median', () => {
  assert.deepEqual(summarizeMeasurements({ samples: [sample], responses: [response] }).latencyMs, { min: 5, median: 5, max: 5 })
  assert.deepEqual(summarizeMeasurements({ samples: [sample], responses: [response, { ...response, elapsedMs: 19 }, { ...response, elapsedMs: 0 }] }).latencyMs,
    { min: 0, median: 5, max: 19 })
})

test('rejects absent, empty and sparse measurement inputs', () => {
  for (const input of [undefined, null, {}, { samples: [], responses: [] }, { samples: [sample], responses: [] },
    { samples: [], responses: [response] }, { samples: Array(1), responses: [response] }, { samples: [sample], responses: Array(1) }]) {
    assert.throws(() => summarizeMeasurements(input))
  }
})

test('rejects malformed or unsafe memory sizes before a success summary', () => {
  for (const field of ['rss', 'heapUsed', 'external', 'arrayBuffers']) {
    for (const value of [undefined, null, '12', NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => summarizeMeasurements({ samples: [{ ...sample, [field]: value }], responses: [response] }))
    }
  }
})

test('rejects malformed response timing, status, sizes and hashes', () => {
  const invalid = [null, {}, ...[undefined, null, '5', NaN, Infinity, -1].map((elapsedMs) => ({ ...response, elapsedMs })),
    ...[undefined, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, '7'].map((bytes) => ({ ...response, bytes })),
    ...[undefined, '200', 200.5, 404, 500].map((status) => ({ ...response, status })),
    ...['', 'A'.repeat(64), 'g'.repeat(64), 'a'.repeat(63), null].flatMap((hash) => [
      { ...response, sha256: hash }, { ...response, expectedSha256: hash }])]
  for (const item of invalid) assert.throws(() => summarizeMeasurements({ samples: [sample], responses: [item] }))
})

test('rejects a successful HTTP status with differing content hash', () => {
  assert.throws(() => summarizeMeasurements({ samples: [sample], responses: [{ ...response, expectedSha256: 'b'.repeat(64) }] }))
})

test('rejects an unsafe aggregate byte count', () => {
  assert.throws(() => summarizeMeasurements({ samples: [sample], responses: [{ ...response, bytes: Number.MAX_SAFE_INTEGER }, response] }))
})

const abcHash = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
const withServer = async (handler, body) => {
  const server = createServer(handler)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try { await body(`http://127.0.0.1:${server.address().port}`) }
  finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)) }
}
const clientInput = (origin, overrides = {}) => ({ origin, pathname: '/api/media/revision/1/synthetic/file.png',
  expectedBytes: 3, expectedSha256: abcHash, count: 8, concurrency: 4, ...overrides })

test('client hashes streamed bytes to EOF and enforces four in flight with no cookies', async () => {
  let active = 0
  let peak = 0
  const cookies = []
  await withServer((request, reply) => {
    cookies.push(request.headers.cookie)
    active += 1
    peak = Math.max(peak, active)
    reply.write('a')
    setTimeout(() => { active -= 1; reply.end('bc') }, 30)
  }, async (origin) => {
    const result = await runClient(clientInput(origin))
    assert.equal(result.responses.length, 8)
    assert.deepEqual(result.failures, [])
    for (const receipt of result.responses) {
      assert.equal(receipt.status, 200)
      assert.equal(receipt.bytes, 3)
      assert.equal(receipt.sha256, abcHash)
      assert(receipt.elapsedMs >= 20, 'Elapsed time includes delayed body')
    }
  })
  assert.equal(peak, 4)
  assert.deepEqual(cookies, [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined])
})

test('client refuses foreign origins, noncanonical URLs and unbounded inputs before requesting', async () => {
  for (const overrides of [{ origin: 'https://example.com' }, { origin: 'http://localhost:1234' }, { origin: 'http://127.0.0.1:1234/' },
    { pathname: '//127.0.0.1:4444/file' }, { pathname: '/api/media/revision/a?x=1' }, { count: 9 }, { concurrency: 5 },
    { expectedBytes: Number.MAX_SAFE_INTEGER }, { expectedSha256: 'invalid' }]) {
    await assert.rejects(runClient(clientInput('http://127.0.0.1:1234', overrides)))
  }
})

test('client retains mismatched bytes, hashes and non-200 status as failures without retries', async () => {
  let calls = 0
  await withServer((_request, reply) => { calls += 1; reply.statusCode = 404; reply.end('bad!') }, async (origin) => {
    const result = await runClient(clientInput(origin, { count: 1, concurrency: 1 }))
    assert.equal(result.responses.length, 1)
    assert.equal(result.responses[0].status, 404)
    assert.equal(result.responses[0].bytes, 4)
    assert.equal(result.failures.length, 1)
  })
  assert.equal(calls, 1)
})

test('client never follows redirects away from the exact delivery URL', async () => {
  let calls = 0
  await withServer((_request, reply) => { calls += 1; reply.writeHead(302, { Location: '/elsewhere' }); reply.end('abc') }, async (origin) => {
    const result = await runClient(clientInput(origin, { count: 1, concurrency: 1 }))
    assert.equal(result.responses[0].status, 302)
    assert.equal(result.failures.length, 1)
  })
  assert.equal(calls, 1)
})
