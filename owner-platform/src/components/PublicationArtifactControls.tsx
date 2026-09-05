'use client'

import { useDocumentInfo } from '@payloadcms/ui'

import styles from './PublicationBundleControls.module.css'

const safeId = (value: unknown): string | number | null => (typeof value === 'string' || typeof value === 'number') && /^[A-Za-z0-9_-]{1,128}$/.test(String(value)) ? value : null

export const PublicationArtifactControls = () => {
  const { id } = useDocumentInfo()
  const artifactId = safeId(id)
  if (artifactId === null) return null
  return <aside className={styles.panel}>
    <strong>Exportación revisable</strong>
    <p>Descarga un JSON íntegro para validación externa. No escribe, publica ni despliega la web.</p>
    <a href={`/api/owner/publication-artifacts/${encodeURIComponent(String(artifactId))}/export`} download>Descargar paquete JSON</a>
  </aside>
}
