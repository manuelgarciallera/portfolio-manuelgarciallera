'use client'
import Link from 'next/link'
import { useDocumentInfo } from '@payloadcms/ui'
export const PagePreviewLink = () => {
  const { id } = useDocumentInfo()
  if (id == null) return <p>Guarda el borrador para abrir su vista editorial.</p>
  return <p><Link href={`/admin/page-preview/${encodeURIComponent(String(id))}`} target="_blank" rel="noopener noreferrer">Ver borrador guardado ↗</Link></p>
}
