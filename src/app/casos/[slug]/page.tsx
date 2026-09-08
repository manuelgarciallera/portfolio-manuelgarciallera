import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CasePage } from '@/features/redesign/case/CasePage'
import { getCaseBySlug, getPublishedCases } from '@/features/redesign/content/cases'
import { getNextCaseCard } from '@/features/redesign/content/card-data'
import { PERSON_LEGAL_NAME, SITE_URL } from '@/lib/site-config'

interface CaseRouteParams {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getPublishedCases().map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: CaseRouteParams): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseBySlug(slug)
  if (!study || !study.published) return { title: 'Caso no encontrado' }
  return {
    title: `${study.title}${study.titleAccent ?? ''} — Caso`,
    description: study.claim,
    alternates: { canonical: `/casos/${study.slug}` },
    openGraph: {
      type: 'article',
      url: `/casos/${study.slug}`,
      title: `${study.title}${study.titleAccent ?? ''} — Caso de producto`,
      description: study.claim,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${study.title}${study.titleAccent ?? ''}` }],
    },
  }
}

export default async function CaseRoute({ params }: CaseRouteParams) {
  const { slug } = await params
  const study = getCaseBySlug(slug)
  if (!study || !study.published) notFound()
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `${study.title}${study.titleAccent ?? ''}`,
    description: study.claim,
    url: `${SITE_URL}/casos/${study.slug}`,
    dateCreated: /^\d{4}$/.test(study.year) ? study.year : undefined,
    creator: { '@type': 'Person', name: PERSON_LEGAL_NAME, url: SITE_URL },
    keywords: study.stack.join(', '),
  }).replace(/</g, '\\u003c')

  return (
    <>
      <script id={`case-json-ld-${study.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <CasePage study={study} nextCase={getNextCaseCard(study.slug)} />
    </>
  )
}
