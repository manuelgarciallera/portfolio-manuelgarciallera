import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { isOwner } from '../access/owner'
import { loadPageVisualPreview } from '../preview/visual-service'
import { PagePreviewCanvas } from './PagePreviewCanvas'
import { PagePreviewDocument } from './PagePreviewDocument'
import styles from './PagePreview.module.css'

export const PagePreviewView = async ({ initPageResult, params }: AdminViewServerProps) => {
  const req = initPageResult.req
  if (!isOwner(req.user)) redirect('/admin/login')
  const segments = params?.segments
  const id = Array.isArray(segments) ? segments[1] : undefined
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) notFound()
  let preview
  try { preview = await loadPageVisualPreview({ payload: req.payload, req, pageId: id }) }
  catch { return <section className={styles.view}><h1>No se pudo preparar la vista previa</h1><p>Comprueba los bloques, enlaces y recursos del borrador guardado.</p><Link href={`/admin/collections/pages/${encodeURIComponent(id)}`}>Volver al editor</Link></section> }
  return <section className={styles.view}>
    <header><h1>Vista editorial: {preview.title}</h1><Link href={`/admin/collections/pages/${encodeURIComponent(id)}`}>Volver al editor</Link></header>
    <p>Revisión guardada: {preview.updatedAt} · {preview.status === 'draft' ? 'Borrador' : 'Publicado en el CMS'}. Los cambios sin guardar no aparecen aquí.</p>
    <p>Vista privada de contenido y encuadre; no es la portada pública ni una comprobación de sus animaciones. No publica ni modifica contenido.</p>
    {preview.warnings.length > 0 && <details open><summary>Avisos de esta revisión ({preview.warnings.length})</summary><ul>{preview.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
    <PagePreviewCanvas><PagePreviewDocument preview={preview} /></PagePreviewCanvas>
  </section>
}
