'use client'

import Link from 'next/link'

import { CASES } from '../content/cases'

export function CasesSection() {
  return (
    <section className="rd-section" id="casos">
      <p className="rd-label rd-reveal" data-index="03">
        Casos seleccionados
      </p>
      <div className="rd-cases">
        {CASES.map((item) => {
          const href = item.published ? `/casos/${item.slug}` : '/casos'
          return (
            <Link
              key={item.slug}
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
        })}
      </div>
    </section>
  )
}
