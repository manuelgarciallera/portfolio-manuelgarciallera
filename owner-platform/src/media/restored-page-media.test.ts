import { describe, expect, it } from 'vitest'
import { createPreviewManifest } from '../preview/manifest'
import { Pages } from '../collections/Pages'
import { bindRestoredPageMedia, resolveRestoredPageMedia, withRestoredPageMedia } from './restored-page-media'

describe('server-owned restored page media', () => {
  it('exposes an editable virtual command only for restored pages', () => {
    const command = Pages.fields.find(field => 'name' in field && field.name === 'useCurrentMedia')
    expect(command).toMatchObject({ type: 'checkbox', virtual: true, defaultValue: false, admin: { readOnly: false } })
    expect(command?.admin?.condition?.({ restoredMediaSnapshot: 1 }, {}, {} as never)).toBe(true)
    expect(command?.admin?.condition?.({}, {}, {} as never)).toBe(false)
  })
  it('clears only on an explicit command and gives restoration priority', async () => {
    const req = {}
    const invoke = (useCurrentMedia: unknown) => bindRestoredPageMedia({ req, data: { useCurrentMedia }, originalDoc: { restoredMediaSnapshot: 3 } } as never)
    expect(await invoke(true)).toMatchObject({ restoredMediaSnapshot: null })
    for (const value of [false, undefined, null, 'true', 1]) expect(await invoke(value)).toMatchObject({ restoredMediaSnapshot: 3 })
    await withRestoredPageMedia(req, 7, async () => {
      expect(await invoke(true)).toMatchObject({ restoredMediaSnapshot: 7 })
    })
  })
  it('ignores client data and context, and releases capability on failure', async () => {
    const req = { context: { restoredMediaSnapshot: 99 } }
    const invoke = () => bindRestoredPageMedia({ req, data: { restoredMediaSnapshot: 99 }, originalDoc: { restoredMediaSnapshot: 3 } } as never)
    expect(await invoke()).toMatchObject({ restoredMediaSnapshot: 3 })
    await expect(withRestoredPageMedia(req, 7, async () => {
      expect(await invoke()).toMatchObject({ restoredMediaSnapshot: 7 })
      throw new Error('rollback')
    })).rejects.toThrow('rollback')
    expect(await invoke()).toMatchObject({ restoredMediaSnapshot: 3 })
  })

  it('rejects a correctly hashed snapshot belonging to another page', async () => {
    const manifest = createPreviewManifest({ source: { collection: 'pages', documentId: 'other', versionId: 'current:1' }, brandTokens: {}, mediaReferences: [], pageBlocks: [] })
    await expect(resolveRestoredPageMedia({ payload: { findByID: async () => ({ manifest, manifestHash: manifest.hash }) } as never,
      req: {} as never, page: { id: 'page', restoredMediaSnapshot: 1 },
    })).rejects.toThrow(/corresponde/i)
  })

  it('does not replace a newly selected media ID absent from the captured version', async () => {
    const manifest = createPreviewManifest({ source: { collection: 'pages', documentId: 'page', versionId: 'current:1' }, brandTokens: {}, mediaReferences: [], pageBlocks: [] })
    const resolve = await resolveRestoredPageMedia({ payload: { findByID: async () => ({ manifest, manifestHash: manifest.hash }) } as never,
      req: {} as never, page: { id: 'page', restoredMediaSnapshot: 1 },
    })
    const media = { id: 2, url: '/api/media/file/new.png' }
    expect(resolve(media)).toBe(media)
  })
})
