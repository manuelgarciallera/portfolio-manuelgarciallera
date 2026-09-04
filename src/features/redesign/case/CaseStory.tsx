import Image from 'next/image'

import type { CaseStudy } from '../content/types'
import { BuySellBrandScene } from './BuySellBrandScene'
import { CasePreludeProgress } from './CasePreludeProgress'
import { ProjectGateway } from './ProjectGateway'

export function CaseStory({ study }: { study: CaseStudy }) {
  if (!study.story?.length) return null

  return (
    <section className="rd-case-story" aria-label={`Historia visual de ${study.title}${study.titleAccent ?? ''}`}>
      <CasePreludeProgress />
      {study.story.map((block, index) => {
        if (block.kind === 'brand-scene') {
          return <div key={block.id} id="historia-opening" data-story-step="opening"><BuySellBrandScene /></div>
        }

        return (
          <article
            key={block.id}
            id={`historia-${block.id}`}
            data-story-step={block.id}
            className={`rd-case-story__chapter rd-case-story__chapter--${block.kind} ${index % 2 === 0 ? 'is-reversed' : ''}`}
          >
            <div className="rd-case-story__copy rd-reveal">
              <p>{block.eyebrow}</p>
              <h2>{block.title}</h2>
              <div>{block.body}</div>
              {block.links?.length ? (
                <div className="rd-case-story__actions">
                  {block.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    >
                      {link.label} <span aria-hidden="true">{link.external ? '↗' : '↓'}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            {block.image ? (
              <div className="rd-case-story__media rd-reveal">
                <div className={`rd-case-story__frame rd-case-story__frame--${study.visual?.theme ?? 'neutral'}`}>
                  <Image
                    src={block.image.src}
                    alt={block.image.alt}
                    width={1920}
                    height={1080}
                    sizes="(max-width: 760px) 100vw, 64vw"
                    style={{ objectFit: block.image.fit ?? 'cover' }}
                  />
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
      <ProjectGateway />
    </section>
  )
}
