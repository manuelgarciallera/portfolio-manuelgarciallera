'use client'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'
import { isPreviewCollection } from '../preview/content-layout'
export const PagePreviewLink = () => {
  const { id, collectionSlug } = useDocumentInfo()
  if (!isPreviewCollection(collectionSlug)) return null
  if (id == null) return <p>Guarda el borrador para abrir su vista editorial.</p>
  return <p><Link href={`/admin/content-preview/${collectionSlug}/${encodeURIComponent(String(id))}`} target="_blank" rel="noopener noreferrer">Ver borrador guardado ↗</Link></p>
}
