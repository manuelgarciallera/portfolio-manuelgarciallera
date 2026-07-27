import Link from 'next/link'

import type { CaseStudy } from '../content/types'

export type CaseCardItem = Pick<
  CaseStudy,
  'slug' | 'index' | 'title' | 'titleAccent' | 'tags' | 'year' | 'published'
>

export interface CaseCardProps {
  item: CaseCardItem
}

export function CaseCard({ item }: CaseCardProps) {
  const href = item.published ? `/casos/${item.slug}` : '/casos'

  return (
    <Link
      className={`rd-case rd-reveal${item.published ? '' : ' rd-case--draft'}`}
      href={href}
      aria-label={`Caso ${item.title}${item.titleAccent ?? ''}`}
    >
      <span className="rd-case-index">{item.index}</span>
      <h3 className="rd-case-title">
        {item.title}
        {item.titleAccent ? <em>{item.titleAccent}</em> : null}
      </h3>
      <span className="rd-case-tags">
        {item.published ? `${item.tags} · ${item.year}` : 'En preparación'}
      </span>
      <span className="rd-case-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
