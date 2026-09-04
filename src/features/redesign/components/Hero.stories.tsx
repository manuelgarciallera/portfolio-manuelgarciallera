import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'

import { Hero } from './Hero'

const meta = {
  title: 'Portfolio/Home/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'off',
    },
  },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const LayoutFirst: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.rd-hero-canvas')).not.toBeInTheDocument()
  },
}
