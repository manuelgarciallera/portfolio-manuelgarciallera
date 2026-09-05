import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

import type { CaseStudy } from '../content/types'
import { CaseCard } from './CaseCard'

const publishedCase: CaseStudy = {
  slug: 'buy-sell-marketplace',
  index: '01',
  title: 'Buy&Sell ',
  titleAccent: 'Marketplace',
  claim: 'Del sistema de diseño al producto full stack.',
  summary: 'Caso real de diseño y desarrollo.',
  year: '2026',
  context: 'Trabajo Fin de Máster',
  role: 'UX/UI y desarrollo',
  stack: ['Figma', 'Angular', 'Node.js', 'MySQL'],
  tags: 'Figma → Angular · CRM · Roles',
  published: true,
  visual: {
    theme: 'buy-sell',
    logoSrc: '/projects/buy-sell/logo-lockup.svg',
    logoAlt: 'Buy&Sell',
    kicker: 'Marketplace tecnológico',
    statement: 'Diseño, producto y sistema full stack.',
    slides: [{ label: 'Producto final', src: '/projects/buy-sell/home-hd.webp', alt: 'Inicio de Buy&Sell' }],
  },
  phases: [],
  ai: {
    tool: '',
    phase: '',
    humanInput: '',
    output: '',
    criteria: '',
    limits: '',
    decision: '',
  },
  figmaLayers: [],
  learnings: [],
  futureQuestion: '',
}

const draftCase: CaseStudy = {
  ...publishedCase,
  slug: 'future-case',
  index: '02',
  title: 'Caso futuro',
  titleAccent: undefined,
  published: false,
}

const meta = {
  title: 'Portfolio/Casos/CaseCard',
  component: CaseCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    item: publishedCase,
  },
} satisfies Meta<typeof CaseCard>

export default meta
type Story = StoryObj<typeof meta>

export const Published: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', {
      name: 'Caso Buy&Sell Marketplace',
    })

    await expect(link).toHaveAttribute(
      'href',
      '/casos/buy-sell-marketplace',
    )
    await expect(
      canvas.getByRole('region', { name: 'Vista previa de Buy&Sell Marketplace' }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('img', { name: 'Buy&Sell' })).toBeInTheDocument()
    await expect(canvas.getAllByText('Ver caso de estudio').length).toBeGreaterThan(0)
  },
}

export const Draft: Story = {
  args: {
    item: draftCase,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: 'Caso Caso futuro' })

    await expect(link).toHaveAttribute('href', '/casos')
    await expect(canvas.getByRole('link', { name: 'En preparación: Caso futuro' })).toHaveAttribute('href', '/casos')
    await expect(canvas.queryByRole('link', { name: /Ver caso de estudio/ })).not.toBeInTheDocument()
    await expect(canvas.getAllByText('En preparación')).toHaveLength(2)
  },
}
