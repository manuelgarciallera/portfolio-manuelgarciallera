import { PortfolioRuntime } from '@/features/portfolio'

import { VisualGallery } from '@/features/redesign/visual-gallery/VisualGallery'
import { getCaseCards } from '@/features/redesign/content/card-data'

export default function Home() {
  return <PortfolioRuntime visualGallery={<VisualGallery />} cases={getCaseCards()} />
}


