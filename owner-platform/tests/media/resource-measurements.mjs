const memoryKeys = ['rss', 'heapUsed', 'external', 'arrayBuffers']
const hash = /^[0-9a-f]{64}$/
const size = (value, minimum = 0) => Number.isSafeInteger(value) && value >= minimum

export const summarizeMeasurements = (input) => {
  const { samples, responses } = input ?? {}
  if (!Array.isArray(samples) || !samples.length || !Array.isArray(responses) || !responses.length) {
    throw new Error('Nonempty memory samples and responses are required.')
  }
  const peak = Object.fromEntries(memoryKeys.map((key) => [key, 0]))
  for (const sample of samples) {
    for (const key of memoryKeys) {
      if (!size(sample?.[key])) throw new Error(`Invalid memory size: ${key}.`)
      peak[key] = Math.max(peak[key], sample[key])
    }
  }
  let responseBytes = 0
  const latencies = []
  for (const response of responses) {
    if (!response || !Number.isFinite(response.elapsedMs) || response.elapsedMs < 0 || !size(response.bytes, 1)
      || response.status !== 200 || typeof response.sha256 !== 'string' || !hash.test(response.sha256)
      || typeof response.expectedSha256 !== 'string' || !hash.test(response.expectedSha256)
      || response.sha256 !== response.expectedSha256) throw new Error('Invalid or failed full-response receipt.')
    responseBytes += response.bytes
    if (!size(responseBytes, 1)) throw new Error('Unsafe aggregate response size.')
    latencies.push(response.elapsedMs)
  }
  latencies.sort((a, b) => a - b)
  const middle = Math.floor(latencies.length / 2)
  const copyMemory = (sample) => Object.fromEntries(memoryKeys.map((key) => [key, sample[key]]))
  return {
    sampleCount: samples.length,
    memory: { baseline: copyMemory(samples[0]), peak, final: copyMemory(samples.at(-1)) },
    responseCount: responses.length, responseBytes,
    latencyMs: { min: latencies[0], median: latencies.length % 2 ? latencies[middle]
      : latencies[middle - 1] / 2 + latencies[middle] / 2, max: latencies.at(-1) },
  }
}
