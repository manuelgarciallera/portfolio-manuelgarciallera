import { describe, expect, it } from 'vitest'

import { createDraftCapsule } from '../recovery/capsule'
import { createPublicationArtifact } from './artifact'
import { createPublicationBundle } from './bundle'
import { createPublicationExport } from './export'
import { createPublicationPreflight, hashPublicationPreflight } from './preflight'

const buildExport = (state: Record<string, unknown>) => {
  const capsule = createDraftCapsule({ source: { collection: 'pages', documentId: '7', versionId: 'current:now' }, state: { brandProfile: 3, slug: 'inicio', title: 'Inicio', ...state } })
  const bundle = createPublicationBundle({ entries: [{ capsule, draftHash: capsule.hash, pageId: '7', position: 0, previewHash: `sha256:${'a'.repeat(64)}`, releaseId: 44, sourceVersionId: 'current:now' }] })
  const artifact = createPublicationArtifact({ bundleHash: bundle.hash, bundleId: 80, pageCount: 1, reviewHash: `sha256:${'b'.repeat(64)}`, reviewId: 90 })
  return createPublicationExport({ artifact, bundle, exportedAt: '2026-09-05T08:00:00.000Z' })
}

describe('publication preflight', () => {
  it('marks a complete, supported page as ready with an immutable verifiable report', () => {
    const report = createPublicationPreflight(buildExport({
      layout: [{ blockType: 'hero', heading: 'Una portada' }, { blockType: 'media', asset: 12 }],
      seo: { canonicalUrl: 'https://example.com/', description: 'Una descripción completa.', title: 'Inicio' },
    }), '2026-09-05T08:10:00.000Z')
    expect(report).toMatchObject({ checkedAt: '2026-09-05T08:10:00.000Z', issueCount: 0, pageCount: 1, schemaVersion: 1, status: 'ready' })
    expect(report.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(hashPublicationPreflight(report)).toBe(report.hash)
    expect(Object.isFrozen(report.issues)).toBe(true)
  })

  it('blocks empty layouts, unknown blocks, and incomplete required block data', () => {
    const empty = createPublicationPreflight(buildExport({ layout: [] }), '2026-09-05T08:10:00.000Z')
    expect(empty.status).toBe('blocked')
    expect(empty.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'empty_layout', pageId: '7', severity: 'blocker' })]))

    const unsupported = createPublicationPreflight(buildExport({ layout: [{ blockType: 'embed', url: 'https://example.com' }] }), '2026-09-05T08:10:00.000Z')
    expect(unsupported.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'unsupported_block', blockPosition: 0, severity: 'blocker' })]))

    const incomplete = createPublicationPreflight(buildExport({ layout: [{ blockType: 'hero' }, { blockType: 'media' }] }), '2026-09-05T08:10:00.000Z')
    expect(incomplete.issues.map(({ code }) => code)).toEqual(['hero_heading_missing', 'media_asset_missing', 'seo_title_missing', 'seo_description_missing'])
  })

  it('reports editorial SEO warnings without falsely blocking structurally valid content', () => {
    const report = createPublicationPreflight(buildExport({ layout: [{ blockType: 'richText', content: { root: { children: [] } } }], seo: { noIndex: true } }), '2026-09-05T08:10:00.000Z')
    expect(report.status).toBe('ready_with_warnings')
    expect(report.issues).toEqual([
      { code: 'seo_title_missing', message: 'Falta el título SEO.', pageId: '7', severity: 'warning' },
      { code: 'seo_description_missing', message: 'Falta la descripción SEO.', pageId: '7', severity: 'warning' },
      { code: 'seo_no_index', message: 'La página está marcada para no indexarse.', pageId: '7', severity: 'warning' },
    ])
  })

  it('fails closed for invalid timestamps and tampered exports or reports', () => {
    const exported = buildExport({ layout: [{ blockType: 'hero', heading: 'Una portada' }] })
    expect(() => createPublicationPreflight(exported, 'today')).toThrow(/fecha/i)
    expect(() => createPublicationPreflight({ ...exported, pageCount: 2 }, '2026-09-05T08:10:00.000Z')).toThrow(/exportación|recuento|hash/i)
    const report = createPublicationPreflight(exported, '2026-09-05T08:10:00.000Z')
    expect(() => hashPublicationPreflight({ ...report, status: 'ready' })).toThrow(/hash|informe/i)
  })
})
