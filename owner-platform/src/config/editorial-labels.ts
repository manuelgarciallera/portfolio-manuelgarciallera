import type { CollectionConfig } from 'payload'

// Display names only. Slugs, schema fields, hooks and access contracts remain
// owned by each collection; no stored content is translated by this map.
const labels: Record<string, [singular: string, plural: string]> = {
  projects: ['Proyecto', 'Proyectos'],
  articles: ['Artículo', 'Artículos'],
  pages: ['Página', 'Páginas'],
  technologies: ['Tecnología', 'Tecnologías'],
  media: ['Medio', 'Medios'],
  'media-placements': ['Encuadre', 'Encuadres'],
  'brand-profiles': ['Perfil de marca', 'Perfiles de marca'],
  'preview-snapshots': ['Captura de vista previa', 'Capturas de vista previa'],
  releases: ['Versión verificada', 'Versiones verificadas'],
  'assistance-proposals': ['Propuesta asistida', 'Propuestas asistidas'],
  'restore-plans': ['Plan de restauración', 'Planes de restauración'],
  'draft-snapshots': ['Copia de borrador', 'Copias de borradores'],
  'publication-bundles': ['Paquete de publicación', 'Paquetes de publicación'],
  'publication-reviews': ['Revisión de publicación', 'Revisiones de publicación'],
  'publication-artifacts': ['Archivo de publicación', 'Archivos de publicación'],
  'publication-preflights': ['Comprobación de publicación', 'Comprobaciones de publicación'],
  'figma-import-plans': ['Plan de importación Figma', 'Planes de importación Figma'],
  'figma-import-reviews': ['Revisión de importación Figma', 'Revisiones de importación Figma'],
  'figma-import-executions': ['Importación Figma', 'Importaciones Figma'],
  users: ['Usuario', 'Usuarios'],
  'audit-events': ['Evento de auditoría', 'Registro de auditoría'],
  'analytics-snapshots': ['Informe analítico', 'Informes analíticos'],
}

export function editorialLabels(slug: string): CollectionConfig['labels'] {
  const entry = labels[slug]
  return entry ? { singular: entry[0], plural: entry[1] } : undefined
}
