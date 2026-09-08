import { createHash } from 'node:crypto'

export const runClient = async ({ origin, pathname, expectedBytes, expectedSha256, count, concurrency }) => {
  const base = new URL(origin)
  const url = new URL(pathname, base)
  if (base.origin !== origin || base.protocol !== 'http:' || base.hostname !== '127.0.0.1' || !base.port
    || base.username || base.password || typeof pathname !== 'string' || !pathname.startsWith('/api/media/revision/')
    || url.origin !== origin || url.href !== origin + pathname || url.search || url.hash || url.username || url.password
    || !Number.isSafeInteger(expectedBytes) || expectedBytes <= 0 || expectedBytes > 64 * 1024 * 1024
    || typeof expectedSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(expectedSha256)
    || ![1, 8].includes(count) || ![1, 4].includes(concurrency) || concurrency > count) {
    throw new Error('Client requires exact loopback delivery, valid receipts and bounded requests.')
  }
  const responses = []
  const failures = []
  const started = performance.now()
  const request = async (index) => {
    const start = performance.now()
    let bytes = 0
    let status = 0
    const digest = createHash('sha256')
    let error
    let complete = false
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
      status = response.status
      if (response.url !== url.href || !response.body) throw new Error('Unexpected response URL or absent body.')
      for await (const chunk of response.body) {
        bytes += chunk.byteLength
        digest.update(chunk)
        if (bytes > 64 * 1024 * 1024) throw new Error('Response exceeded the revision cap.')
      }
      complete = true
    } catch (cause) { error = `${cause.name}: ${cause.message}` }
    const receipt = { index, status, bytes, sha256: digest.digest('hex'), expectedSha256,
      elapsedMs: performance.now() - start, complete }
    responses.push(receipt)
    if (error || !complete || status !== 200 || bytes !== expectedBytes || receipt.sha256 !== expectedSha256) {
      failures.push({ index, error: error ?? 'Response status, byte length or SHA-256 mismatch.' })
    }
  }
  // Fixed batches cap concurrency; after a failure no further batch is scheduled.
  for (let offset = 0; offset < count && !failures.length; offset += concurrency) {
    await Promise.all(Array.from({ length: Math.min(concurrency, count - offset) }, (_, index) => request(offset + index)))
  }
  return { requested: count, concurrency, elapsedMs: performance.now() - started,
    responses: responses.sort((a, b) => a.index - b.index), failures }
}

if (process.send) {
  process.once('message', async (input) => {
    try { process.send({ ok: true, result: await runClient(input) }) }
    catch (error) { process.exitCode = 1; process.send({ ok: false, error: error.message }) }
    finally { process.disconnect() }
  })
  process.send({ ready: true })
}
