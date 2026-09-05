import { createElement, type CSSProperties } from 'react'
import { RichText, LinkJSXConverter } from '@payloadcms/richtext-lexical/react'
import type { MediaPlacement } from '../media/placement'
import type { PageVisualPreview, PreviewText } from '../preview/visual-service'
import styles from './PagePreview.module.css'

const PreviewMedia = ({ id, preview, placement }: { id?: string; preview: PageVisualPreview; placement?: MediaPlacement }) => {
  const asset = id ? preview.assets[id] : undefined
  if (!asset) return <p className={styles.notice}>Imagen no disponible en esta revisión.</p>
  const base = { frame: 'auto', fit: 'contain', focalX: .5, focalY: .5, zoom: 1, ...placement }
  const imageStyle: Record<string, string | number> = {}
  for (const breakpoint of ['desktop', 'tablet', 'mobile'] as const) {
    const values = { ...base, ...(breakpoint === 'desktop' ? {} : placement?.overrides[breakpoint]) }
    imageStyle[`--${breakpoint}-ratio`] = values.frame === 'auto' ? `${asset.width ?? 16} / ${asset.height ?? 9}` : values.frame.replace(':', ' / ')
    imageStyle[`--${breakpoint}-fit`] = values.fit
    imageStyle[`--${breakpoint}-position`] = `${values.focalX * 100}% ${values.focalY * 100}%`
    imageStyle[`--${breakpoint}-zoom`] = values.zoom
  }
  return <div className={styles.image} style={imageStyle as CSSProperties}>
    {/* Owner-local images keep the reversible placement; no public optimizer or remote asset fetch is involved. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.url} alt={asset.alt} width={asset.width} height={asset.height} loading="lazy" />
  </div>
}

const Text = ({ content, preview }: { content?: PreviewText; preview: PageVisualPreview }) => content ? <RichText data={content} converters={({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: ({ linkNode }) => {
    const doc = linkNode.fields.doc
    if (!doc) return '#'
    const value = typeof doc.value === 'object' ? doc.value.id : doc.value
    return `/admin/collections/${encodeURIComponent(doc.relationTo)}/${encodeURIComponent(String(value))}`
  } }),
  heading: ({ node, nodesToJSX }) => createElement(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag) ? node.tag : 'h2', null, nodesToJSX({ nodes: node.children })),
  list: ({ node, nodesToJSX }) => createElement(node.tag === 'ol' ? 'ol' : 'ul', null, nodesToJSX({ nodes: node.children })),
  upload: ({ node }) => <PreviewMedia id={String(typeof node.value === 'object' ? node.value.id : node.value)} preview={preview} />,
  relationship: () => <p className={styles.notice}>Referencia relacionada: consulta el documento desde el editor.</p>,
})} /> : null

export const PagePreviewDocument = ({ preview }: { preview: PageVisualPreview }) => {
  const colors = Object.fromEntries(preview.brand?.colors.map(({ role, value }) => [role, value]) ?? [])
  return <article className={styles.document} style={{ '--preview-background': colors.background ?? '#ffffff', '--preview-text': colors.text ?? '#161616', '--preview-surface': colors.surface ?? '#f2f2f2', '--preview-accent': colors.accent ?? '#165dcc' } as CSSProperties}>
    {preview.blocks.length === 0 && <p>Esta página todavía no tiene bloques.</p>}
    {preview.blocks.map((block, index) => <section className={styles.block} key={index} data-block-type={block.type}>
      {block.eyebrow && <p className={styles.eyebrow}>{block.eyebrow}</p>}
      {block.heading && (index === 0 && block.type === 'hero' ? <h1>{block.heading}</h1> : <h2>{block.heading}</h2>)}
      {(block.type === 'hero' || block.type === 'richText') && <Text content={block.content} preview={preview} />}
      {(block.type === 'media' || (block.type === 'hero' && block.assetId)) && <figure><PreviewMedia id={block.assetId} preview={preview} placement={block.placement} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>}
      {block.type === 'projectGrid' && <div className={styles.grid}>{block.projects?.map((project, projectIndex) => <div className={styles.card} key={`${project.id}:${projectIndex}`}>
        <PreviewMedia id={project.assetId} preview={preview} /><h3>{project.title}</h3><p>{project.summary}</p><a href={`/admin/collections/projects/${encodeURIComponent(project.id)}`}>Editar proyecto</a>
      </div>)}</div>}
      {block.type === 'customFeature' && <p className={styles.notice}>Módulo «{block.featureKey}»: su composición y animación específicas no están conectadas a esta vista editorial.</p>}
      {!['hero', 'richText', 'media', 'projectGrid', 'customFeature'].includes(block.type) && <p className={styles.notice}>Este bloque no tiene un visor compatible.</p>}
    </section>)}
  </article>
}
