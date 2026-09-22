import Image from 'next/image'
import type { CSSProperties } from 'react'
import { isPortraitEvidence, projectImageDimensions } from './projectImageDimensions'
import './project-evidence.css'

export function ProjectEvidenceImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [width, height] = projectImageDimensions[src] ?? [1600, 1000]
  const portrait = isPortraitEvidence(src)
  return <a className="rd-project-evidence" href={src} target="_blank" rel="noreferrer"
    aria-label={`Ampliar imagen: ${alt}`} data-portrait={portrait ? 'true' : 'false'}
    data-device={portrait && (src.includes('/nude-project/') || src.includes('/theuxunion/')) ? 'true' : undefined}
    style={{ '--evidence-ratio': width / height, '--evidence-source-width': `${width}px` } as CSSProperties}>
    <Image src={src} alt={alt} width={width} height={height} quality={92}
      sizes={portrait ? '(max-width: 760px) 82vw, 23rem' : sizes} />
    <span className="rd-project-evidence__hint">Ampliar imagen <span aria-hidden="true">↗</span></span>
  </a>
}
