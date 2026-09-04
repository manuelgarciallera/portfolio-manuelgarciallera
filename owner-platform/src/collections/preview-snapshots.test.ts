import { APIError, type Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { PreviewSnapshots, enforceImmutablePreviewDelete, prepareImmutablePreviewSnapshot } from './PreviewSnapshots'
import { createPreviewManifest } from '../preview/manifest'

const owner = { id: 1, collection: 'users', role: 'owner' }
const accessArgs = (user: unknown) => ({ req: { user } }) as never
const manifest = createPreviewManifest({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, brandTokens: { colors: [], usageWeights: [], motion: {} }, pageBlocks: [], mediaReferences: [] })
const fieldNamed = (name: string): Field | undefined => PreviewSnapshots.fields.find((field) => 'name' in field && field.name === name)

describe('PreviewSnapshots collection', () => {
  it('disables direct creation and all anonymous/owner mutations except service-internal persistence', () => {
    expect(PreviewSnapshots.access?.create?.(accessArgs(owner))).toBe(false)
    expect(PreviewSnapshots.access?.read?.(accessArgs(owner))).toBe(true)
    expect(PreviewSnapshots.access?.read?.(accessArgs(null))).toBe(false)
    expect(PreviewSnapshots.access?.update?.(accessArgs(owner))).toBe(false)
    expect(PreviewSnapshots.access?.delete?.(accessArgs(owner))).toBe(false)
  })

  it('has no client input field and stores required canonical fields', () => {
    expect(fieldNamed('input')).toBeUndefined()
    expect(fieldNamed('schemaVersion')).toMatchObject({ type: 'number', required: true })
    expect(fieldNamed('manifest')).toMatchObject({ type: 'json', required: true })
    expect(fieldNamed('manifestHash')).toMatchObject({ type: 'text', required: true, unique: true })
  })

  it('verifies server-derived provenance and hash consistency before creation', async () => {
    const data = { schemaVersion: 1, sourceCollection: 'pages', sourceDocumentId: '7', sourceVersionId: 'current:now', manifest, manifestHash: manifest.hash, createdBy: 1 }
    await expect(prepareImmutablePreviewSnapshot({ operation: 'create', data, req: { user: owner } } as never)).resolves.toEqual(data)
    await expect(prepareImmutablePreviewSnapshot({ operation: 'create', data: { ...data, sourceDocumentId: 'forged' }, req: { user: owner } } as never)).rejects.toThrow(/procedencia/i)
    await expect(prepareImmutablePreviewSnapshot({ operation: 'create', data: { ...data, manifestHash: 'sha256:forged' }, req: { user: owner } } as never)).rejects.toThrow(/hash/i)
  })

  it('rejects updates and deletes in lifecycle hooks', async () => {
    await expect(prepareImmutablePreviewSnapshot({ operation: 'update', data: {}, req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
    await expect(enforceImmutablePreviewDelete({ req: { user: owner } } as never)).rejects.toBeInstanceOf(APIError)
  })
})
