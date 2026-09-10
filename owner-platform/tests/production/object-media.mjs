import assert from 'node:assert/strict'
import sharp from 'sharp'
import { readdir } from 'node:fs/promises'

export const verifyProductionObjectMedia = async ({ origin, token, environment }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const request = (route, options = {}, authenticated = true) => {
    const url = new URL(route, origin)
    assert.equal(url.origin, origin)
    return fetch(url, { ...options, signal: AbortSignal.timeout(15_000), headers: {
      ...(authenticated ? { Authorization: `JWT ${token}` } : {}), ...options.headers,
    } })
  }
  const bytes = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#224488' } }).png().toBuffer()
  const form = new FormData()
  form.set('_payload', JSON.stringify({ alt: 'Synthetic production object upload', _status: 'draft' }))
  form.set('file', new File([bytes], 'production-object.png', { type: 'image/png' }))
  const upload = await request('/api/media?draft=true', { method: 'POST', body: form })
  assert.equal(upload.status, 201, 'Production multipart upload with object storage')
  const original = (await upload.json()).doc
  assert.match(original.storageRevision, /^[a-f0-9-]{36}$/)
  const downloaded = await request(original.url)
  assert.equal(downloaded.status, 200)
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes)
  assert.equal((await request(original.url, {}, false)).status, 404, 'Draft binary must remain private')
  const replacementBytes = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#883322' } }).png().toBuffer()
  const replacement = new FormData()
  replacement.set('_payload', JSON.stringify({ alt: original.alt, _status: 'draft' }))
  replacement.set('file', new File([replacementBytes], 'production-object.png', { type: 'image/png' }))
  const edited = await request(`/api/media/${original.id}?draft=true`, { method: 'PATCH', body: replacement })
  assert.equal(edited.status, 200, 'Replacement upload with object storage')
  const current = (await edited.json()).doc
  assert.equal(current.width, 600)
  assert.equal(current.height, 400)
  assert.notEqual(current.storageRevision, original.storageRevision)
  const currentResponse = await request(current.url)
  assert.equal(currentResponse.status, 200)
  const currentBytes = Buffer.from(await currentResponse.arrayBuffer())
  assert.deepEqual(currentBytes, replacementBytes)
  const count = environment.provider.objects.size
  assert(count > 2)
  assert.deepEqual(await readdir(environment.environment.OWNER_MEDIA_SCRATCH_DIR), [])
  return async () => {
    const read = await request(`/api/media/${current.id}?draft=true&depth=0`)
    assert.equal(read.status, 200)
    assert.equal((await read.json()).storageRevision, current.storageRevision)
    for (const [url, expected] of [[original.url, bytes], [current.url, currentBytes]]) {
      const response = await request(url)
      assert.equal(response.status, 200, 'Historical and current bytes survive application restart')
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected)
      assert.equal((await request(url, {}, false)).status, 404)
    }
    assert.equal(environment.provider.objects.size, count)
    assert.deepEqual(await readdir(environment.environment.OWNER_MEDIA_SCRATCH_DIR), [])
    console.log('[production-http] object upload, replacement, private bytes and app restart passed')
  }
}
