import { APIError, type Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  PreviewSnapshots,
  enforcePreviewSnapshotOperation,
  enforceImmutablePreviewDelete,
  prepareImmutablePreviewSnapshot,
} from './PreviewSnapshots'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const hookArgs = (operation: 'create' | 'update', user: unknown, data = {}) =>
  ({ operation, data, req: { user } }) as never
const fieldNamed = (name: string): Field | undefined =>
  PreviewSnapshots.fields.find((field) => 'name' in field && field.name === name)

const manifestInput = {
  source: { collection: 'pages', documentId: 'home', versionId: 7 },
  brandTokens: { background: '#000000', text: '#FFFFFF' },
  pageBlocks: [{ type: 'hero', title: 'Portfolio' }],
  mediaReferences: ['media-1'],
  motion: { duration: 600, easing: 'ease-out', reducedMotion: 'reduce' },
}

describe('PreviewSnapshots collection', () => {
  it('is owner-only and append-only at the access layer', () => {
    expect(PreviewSnapshots.slug).toBe('preview-snapshots')
    expect(PreviewSnapshots.access?.create?.(accessArgs(null))).toBe(false)
    expect(PreviewSnapshots.access?.read?.(accessArgs(null))).toBe(false)
    expect(PreviewSnapshots.access?.create?.(accessArgs(owner))).toBe(true)
    expect(PreviewSnapshots.access?.read?.(accessArgs(owner))).toBe(true)
    expect(PreviewSnapshots.access?.update?.(accessArgs(owner))).toBe(false)
    expect(PreviewSnapshots.access?.delete?.(accessArgs(owner))).toBe(false)
  })

  it('stores only canonical provenance, manifest and hash fields', () => {
    expect(fieldNamed('schemaVersion')).toMatchObject({ type: 'number', required: true })
    expect(fieldNamed('sourceCollection')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('sourceDocumentId')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('sourceVersionId')).toMatchObject({ type: 'text', required: true })
    expect(fieldNamed('manifest')).toMatchObject({ type: 'json', required: true })
    expect(fieldNamed('manifestHash')).toMatchObject({ type: 'text', required: true, unique: true })
    expect(JSON.stringify(PreviewSnapshots.fields)).not.toMatch(/(?:secret|token|password|html|css|javascript)/i)
  })

  it('canonicalizes creation server-side and ignores forged derived fields', async () => {
    const result = await prepareImmutablePreviewSnapshot(
      hookArgs('create', owner, {
        input: manifestInput,
        schemaVersion: 99,
        sourceCollection: 'forged',
        manifestHash: 'sha256:forged',
      }),
    )
    expect(result).toMatchObject({
      schemaVersion: 1,
      sourceCollection: 'pages',
      sourceDocumentId: 'home',
      sourceVersionId: '7',
      manifestHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    })
    expect(result).not.toHaveProperty('input')
  })

  it('enforces owner creation even when a local API caller overrides access', async () => {
    await expect(prepareImmutablePreviewSnapshot(hookArgs('create', null, { input: manifestInput }))).rejects.toBeInstanceOf(
      APIError,
    )
  })

  it('enforces owner reads before a local API override can bypass collection access', async () => {
    await expect(
      enforcePreviewSnapshotOperation({ operation: 'read', req: { user: null } } as never),
    ).rejects.toBeInstanceOf(APIError)
    await expect(
      enforcePreviewSnapshotOperation({ operation: 'read', req: { user: owner } } as never),
    ).resolves.toBeUndefined()
  })

  it('rejects updates and deletes in hooks so local API override cannot mutate history', async () => {
    await expect(prepareImmutablePreviewSnapshot(hookArgs('update', owner))).rejects.toBeInstanceOf(APIError)
    await expect(enforceImmutablePreviewDelete({ req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
  })

  it('rejects unsafe manifests before persistence', async () => {
    await expect(
      prepareImmutablePreviewSnapshot(
        hookArgs('create', owner, {
          input: { ...manifestInput, pageBlocks: [{ type: 'hero', apiToken: 'leak' }] },
        }),
      ),
    ).rejects.toThrow(/secret|credential/i)
  })
})
