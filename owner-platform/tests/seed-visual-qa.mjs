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
