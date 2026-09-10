import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'

import { MANIFEST_NAME, MAX_MANIFEST_BYTES, digest, snapshotFiles, validateManifest, validateRevision, type Manifest } from './revision-manifest'

export class ObjectRevisionWriteError extends Error {
  constructor(readonly revision: string, cause: unknown) {
    super('Object revision write did not complete; retain its identifier for reconciliation.', { cause })
    this.name = 'ObjectRevisionWriteError'
  }
}

/** Internal transport only. The binding must authorize documents before calling it.
 * Client/namespace are trusted server configuration, not caller-controlled input.
 * The caller owns the client's lifetime. No bucket creation or deletion occurs.
 */
export const createObjectRevisionStore = ({ client, bucket, prefix, timeoutMs = 15000 }: {
  client: S3Client
  bucket: string
  prefix: string
  timeoutMs?: number
}) => {
  if (typeof bucket !== 'string' || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    typeof prefix !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(prefix) ||
    !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) {
    throw new Error('Explicit safe object storage namespace and bounded deadline required.')
  }
  const base = (revision: string) => `${prefix}/${validateRevision(revision)}/`
  const fileKey = (revision: string, index: number) => `${base(revision)}files/${index}`
  const manifestKey = (revision: string) => `${base(revision)}${MANIFEST_NAME}`

  const readBytes = async (key: string, limit: number, signal: AbortSignal): Promise<Buffer> => {
    signal.throwIfAborted()
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }), { abortSignal: signal })
    const body = response.Body
    if (!(body instanceof Readable)) throw new Error('Expected a bounded Node object stream.')
    const abort = () => body.destroy(new Error('Object storage deadline exceeded.'))
    try {
      if (!Number.isSafeInteger(response.ContentLength) || response.ContentLength! <= 0 || response.ContentLength! > limit) {
        throw new Error('Object length is missing or outside the permitted bound.')
      }
      signal.throwIfAborted()
      signal.addEventListener('abort', abort, { once: true })
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of body) {
        signal.throwIfAborted()
        const bytes = Buffer.from(chunk)
        size += bytes.length
        if (size > limit || size > response.ContentLength!) throw new Error('Object body exceeds its declared bound.')
        chunks.push(bytes)
      }
      signal.throwIfAborted()
      if (size !== response.ContentLength) throw new Error('Object body is incomplete.')
      return Buffer.concat(chunks, size)
    } finally {
      signal.removeEventListener('abort', abort)
      body.destroy()
    }
  }

  const assertInventory = async (revision: string, manifest: Manifest, signal: AbortSignal) => {
    const result = await client.send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: base(revision), MaxKeys: 18,
    }), { abortSignal: signal })
    const expected = new Set([manifestKey(revision), ...manifest.files.map((_, index) => fileKey(revision, index))])
    const keys = (result.Contents ?? []).map((entry) => entry.Key)
    if (result.IsTruncated || keys.length !== expected.size || new Set(keys).size !== expected.size ||
      keys.some((key) => !key || !expected.has(key))) {
      throw new Error('Object revision inventory is incomplete or contains unexpected keys.')
    }
  }

  const putRevision = async (manifest: Manifest, snapshot: { name: string; bytes: Buffer }[], signal: AbortSignal) => {
      const revision = manifest.revision
      const put = async (key: string, bytes: Buffer, contentType: string) => {
        signal.throwIfAborted()
        await client.send(new PutObjectCommand({
          Bucket: bucket, Key: key, Body: bytes, ContentLength: bytes.length,
          ContentType: contentType, CacheControl: 'private, no-store', IfNoneMatch: '*',
        }), { abortSignal: signal })
      }
      try {
        for (const [index, file] of snapshot.entries()) await put(fileKey(revision, index), file.bytes, 'application/octet-stream')
        await put(manifestKey(revision), Buffer.from(JSON.stringify(manifest)), 'application/json')
        signal.throwIfAborted()
        return revision
      } catch (cause) {
        // A lost response may hide a successful write. Never delete or overwrite.
        throw new ObjectRevisionWriteError(revision, cause)
      }
  }
  const readRevision = async (revision: string, signal: AbortSignal): Promise<{ name: string; bytes: Buffer }[]> => {
      validateRevision(revision)
      const bytes = await readBytes(manifestKey(revision), MAX_MANIFEST_BYTES, signal)
      const manifest = validateManifest(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)), revision)
      await assertInventory(revision, manifest, signal)
      const result = []
      for (const [index, entry] of manifest.files.entries()) {
        const content = await readBytes(fileKey(revision, index), entry.size, signal)
        if (content.length !== entry.size || digest(content) !== entry.sha256) throw new Error('Object does not match its revision manifest.')
        result.push({ name: entry.name, bytes: content })
      }
      await assertInventory(revision, manifest, signal)
      signal.throwIfAborted()
      return result
  }
  return {
    async write(files: { name: string; bytes: Buffer }[]): Promise<string> {
      const snapshot = snapshotFiles(files)
      const manifest: Manifest = {
        schema: 1, revision: randomUUID(),
        files: snapshot.map(({ name, bytes }) => ({ name, size: bytes.length, sha256: digest(bytes) })),
      }
      return putRevision(manifest, snapshot, AbortSignal.timeout(timeoutMs))
    },
    read(revision: string): Promise<{ name: string; bytes: Buffer }[]> {
      return readRevision(revision, AbortSignal.timeout(timeoutMs))
    },
    /** In-memory package only: caller must persist it in an approved private backup.
     * It contains no client credentials or namespace configuration.
     */
    async exportRevision(revision: string): Promise<{ manifest: Manifest; files: { name: string; bytes: Buffer }[] }> {
      const signal = AbortSignal.timeout(timeoutMs)
      const files = await readRevision(revision, signal)
      const manifest: Manifest = { schema: 1, revision, files: files.map(({ name, bytes }) => ({
        name, size: bytes.length, sha256: digest(bytes),
      })) }
      signal.throwIfAborted()
      return { manifest, files }
    },
    /** Recovery primitive for a server-approved backup, never a public upload API.
     * Destination revision prefix must be empty. Partial failures are retained:
     * retry in a fresh recovery namespace, not by overwriting a partial restore.
     * A manifest proves byte consistency, not the provenance of the backup.
     */
    async restore(revision: string, backupManifest: unknown, files: { name: string; bytes: Buffer }[]): Promise<string> {
      validateRevision(revision)
      const manifest = validateManifest(backupManifest, revision)
      const snapshot = snapshotFiles(files)
      if (snapshot.length !== manifest.files.length || snapshot.some((file, index) => {
        const entry = manifest.files[index]
        return file.name !== entry.name || file.bytes.length !== entry.size || digest(file.bytes) !== entry.sha256
      })) throw new Error('Recovery bytes do not match the approved manifest.')
      const signal = AbortSignal.timeout(timeoutMs)
      try {
        const existing = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: base(revision), MaxKeys: 1 }), { abortSignal: signal })
        if (existing.IsTruncated || existing.Contents?.length) throw new Error('Recovery destination is not empty.')
        await putRevision(manifest, snapshot, signal)
        const restored = await readRevision(revision, signal)
        if (restored.length !== snapshot.length || restored.some((file, index) =>
          file.name !== snapshot[index].name || !file.bytes.equals(snapshot[index].bytes))) {
          throw new Error('Recovered revision differs from the approved backup.')
        }
        signal.throwIfAborted()
        return revision
      } catch (cause) {
        if (cause instanceof ObjectRevisionWriteError) throw cause
        throw new ObjectRevisionWriteError(revision, cause)
      }
    },
  }
}
