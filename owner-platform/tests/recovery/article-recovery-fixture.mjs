import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createLocalReq } from 'payload'
import { loadContentVisualPreview } from '../../src/preview/visual-service.ts'

const options = owner => ({ user: owner, overrideAccess: false, depth: 0, draft: true })
const readArticle = async (fixture, owner, id) => {
  const payload = fixture.payload
  const article = await payload.findByID({ ...options(owner), collection: 'articles', id })
  const versions = await payload.findVersions({ ...options(owner), collection: 'articles',
    where: { parent: { equals: id } }, limit: 100, sort: 'id' })
  assert(versions.totalDocs >= 2)
  assert.equal(versions.docs.length, versions.totalDocs)
  const image = article.articleLayout.find(block => block.blockType === 'articleMedia')
  const placement = await payload.findByID({ ...options(owner), collection: 'media-placements', id: image.placement })
  const visual = await loadContentVisualPreview({ payload, req: await createLocalReq({ user: owner }, payload),
    collection: 'articles', documentId: String(id) })
  assert.deepEqual(visual.blocks.map(block => block.type), ['hero', 'quote', 'media'])
  assert.equal(visual.blocks[2].alt, 'Contexto del artículo restaurable')
  assert.equal(visual.blocks[2].placement.zoom, 2)
  assert.equal(visual.blocks[2].placement.overrides.mobile.zoom, 3)
  const response = await fixture.request(visual.assets[String(image.asset)].url)
  assert.equal(response.status, 200)
  const imageHash = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')
  assert([403, 404].includes((await fixture.request(`/api/articles/${id}?draft=true`, {}, false)).status))
  assert.equal((await fixture.request('/api/articles/versions', {}, false)).status, 403)
  return JSON.parse(JSON.stringify({ article, versions: versions.docs, placement, visual, imageHash }))
}

export const seedRecoveryArticle = async (fixture, owner, mediaId) => {
  const placement = await fixture.payload.create({ ...options(owner), collection: 'media-placements', data: {
    name: 'Recorte del artículo recuperable', placement: { asset: mediaId, zoom: 2, focalX: 0.2, focalY: 0.7,
      frame: '4:3', fit: 'cover', overrides: { mobile: { zoom: 3, focalX: 1, focalY: 0 } } },
  } })
  const article = await fixture.payload.create({ ...options(owner), collection: 'articles', data: {
    title: 'Artículo antes de copiar', slug: 'articulo-recuperable', excerpt: 'Datos sintéticos para verificar recuperación.',
    content: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
      { type: 'paragraph', version: 1, direction: null, format: '', indent: 0, children: [
        { type: 'text', version: 1, text: 'Texto clásico que debe sobrevivir.', detail: 0, format: 0, mode: 'normal', style: '' },
      ] },
    ] } },
    articleLayout: [
      { blockType: 'articleQuote', quote: 'Un producto debe poder recuperarse.', attribution: 'Ensayo sintético' },
      { blockType: 'articleMedia', asset: mediaId, placement: placement.id, alt: 'Contexto del artículo restaurable', caption: 'Archivo y receta separados' },
    ],
  } })
  await fixture.payload.update({ ...options(owner), collection: 'articles', id: article.id,
    data: { title: 'Artículo revisado antes de copiar' } })
  return readArticle(fixture, owner, article.id)
}

export const verifyRecoveryArticle = async (fixture, owner, expected, edit) => {
  const restored = await readArticle(fixture, owner, expected.article.id)
  assert.deepEqual(restored, expected, 'Article, complete history, placement, preview and image bytes survive physical recovery')
  if (edit) {
    const response = await fixture.request(`/api/articles/${expected.article.id}?draft=true`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Artículo editado en la copia recuperada' }),
    })
    assert.equal(response.status, 200)
    const after = await readArticle(fixture, owner, expected.article.id)
    assert.equal(after.article.title, 'Artículo editado en la copia recuperada')
    assert.deepEqual(after.article.articleLayout, expected.article.articleLayout)
    assert.deepEqual(after.article.content, expected.article.content)
    assert.equal(after.imageHash, expected.imageHash)
    assert(after.versions.length > expected.versions.length)
  }
  return { articleRecovered: true, articleVersionsRestored: restored.versions.length, articleEditedAfterRecovery: edit }
}
