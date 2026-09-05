import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

// Run only against the separately started QA database, never the normal owner port.
const base = 'http://127.0.0.1:3011'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email || !password) throw new Error('Provide credentials for the isolated QA owner.')
const json = async (path, options) => {
  const response = await fetch(`${base}${path}`, options)
  if (!response.ok) throw new Error(`QA request ${path} returned HTTP ${response.status}`)
  return response.json()
}
const login = await json('/api/users/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
const headers = { Authorization: `JWT ${login.token}` }
const bytes = await readFile(new URL('../../public/art/hero-refractive-orb-fallback-v2.webp', import.meta.url))
const form = new FormData()
form.append('file', new Blob([bytes], { type: 'image/webp' }), `qa-visual-${randomUUID()}.webp`)
form.append('_payload', JSON.stringify({ alt: 'Órbita de prueba editorial' }))
const media = await json('/api/media?draft=true', { method: 'POST', headers, body: form })
const page = await json('/api/pages?draft=true', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({
  title: 'QA vista editorial', slug: `qa-vista-${randomUUID()}`, layout: [
    { blockType: 'hero', eyebrow: 'VISTA PRIVADA', heading: 'De la investigación al código.' },
    { blockType: 'media', asset: media.doc.id, caption: 'Imagen de prueba sin modificar el original.' },
    { blockType: 'customFeature', featureKey: 'project-reel', heading: 'Reel de proyectos' },
  ],
}) })
console.log(JSON.stringify({ pageId: page.doc.id, previewURL: `${base}/admin/page-preview/${page.doc.id}` }))

const content = { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [
  { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'Contenido de prueba editorial, sin publicación.', format: 0, detail: 0, mode: 'normal', style: '' }] },
] } }
const save = (collection, data) => json(`/api/${collection}?draft=true`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
const article = await save('articles', {
  title: 'QA artículo modular', slug: `qa-articulo-${randomUUID()}`, excerpt: 'Prueba privada de galería, cita y nota.', coverImage: media.doc.id, content,
  articleLayout: [
    { blockType: 'articleGallery', items: [{ asset: media.doc.id, alt: 'Primera vista de la órbita', caption: 'Primer encuadre' }, { asset: media.doc.id, alt: 'Segunda vista de la órbita', caption: 'Segundo encuadre' }] },
    { blockType: 'articleQuote', quote: 'Una idea antes de publicar.', attribution: 'Prueba editorial' },
    { blockType: 'articleCallout', tone: 'note', heading: 'Nota de revisión', content },
  ],
})
const project = await save('projects', {
  title: 'QA caso modular', slug: `qa-caso-${randomUUID()}`, summary: 'Prueba privada del caso de estudio.', heroImage: media.doc.id, body: content,
  caseStudyLayout: [
    { blockType: 'caseSection', eyebrow: 'INVESTIGACIÓN', heading: 'El contexto', content },
    { blockType: 'caseMetrics', items: [{ value: '3', label: 'Roles' }, { value: '2', label: 'Recorridos' }] },
    { blockType: 'caseQuote', quote: 'Una conclusión de investigación.', attribution: 'Prueba editorial' },
    { blockType: 'caseFeature', featureKey: 'technology-stack', heading: 'Stack tecnológico' },
  ],
})
console.log(JSON.stringify({ articleURL: `${base}/admin/content-preview/articles/${article.doc.id}`, projectURL: `${base}/admin/content-preview/projects/${project.doc.id}` }))
