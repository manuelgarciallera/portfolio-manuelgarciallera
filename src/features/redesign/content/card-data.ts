import type { CaseCardItem } from '../components/CaseCard'
import type { CaseStudy } from './types'
import { getPublishedCases } from './cases'

// Called by server routes: never send all case narratives in client JavaScript.
export function toCaseCard(study: CaseStudy): CaseCardItem {
  const { slug, index, title, titleAccent, claim, role, stack, tags, year, published, visual, status, contribution } = study
  return { slug, index, title, titleAccent, claim, role, stack, tags, year, published, visual, status, contribution }
}

export function getCaseCards(): CaseCardItem[] {
  return getPublishedCases().map(toCaseCard)
}

export function getNextCaseCard(slug: string): CaseCardItem {
  const cards = getCaseCards()
  return cards[(cards.findIndex(item => item.slug === slug) + 1) % cards.length]
}
