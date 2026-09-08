import { describe, it, expect } from 'vitest'
import { getCaseCards, getNextCaseCard } from './card-data'
import { getPublishedCases } from './cases'

describe('server card projection', () => {
  it('keeps every published visual and identity without serializing case narratives', () => {
    const cards = getCaseCards()
    expect(cards.map(card => card.slug)).toEqual(getPublishedCases().map(study => study.slug))
    cards.forEach((card, index) => {
      expect(card.visual).toEqual(getPublishedCases()[index].visual)
      for (const key of ['phases', 'ai', 'learnings', 'codeEvidence', 'story']) expect(card).not.toHaveProperty(key)
    })
  })
  it('connects TheUXUnion to NudeProject and loops the last case back to Buy&Sell', () => {
    expect(getNextCaseCard('the-ux-union').slug).toBe('nude-project')
    expect(getNextCaseCard('nude-project').slug).toBe('buy-sell-marketplace')
  })
})
