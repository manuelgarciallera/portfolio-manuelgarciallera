import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CasePage } from '@/features/redesign/case/CasePage'
import { getCaseBySlug, getPublishedCases } from '@/features/redesign/content/cases'

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
  }
}

export default async function CaseRoute({ params }: CaseRouteParams) {
  const { slug } = await params
  const study = getCaseBySlug(slug)
  if (!study || !study.published) notFound()
  return <CasePage study={study} />
}
