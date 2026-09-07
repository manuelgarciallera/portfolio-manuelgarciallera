import type { Metadata } from 'next'

import { ResearchPage } from '@/features/redesign/research/ResearchPage'

export const metadata: Metadata = {
  title: 'Investigación',
  description:
    'Del objeto a la interfaz: genealogía háptico-óptica del diseño, HCI aplicado e interacción humano-IA. Líneas abiertas, método y marco teórico.',
  alternates: { canonical: '/investigacion' },
  openGraph: {
    url: '/investigacion',
    title: 'Investigación — Manuel García-Llera',
    description:
      'Cómo el diseño del siglo XX eliminó la dimensión háptica y qué efecto tiene recuperarla en la comprensión, la confianza y la decisión de quien usa una interfaz.',
  },
}

export default function InvestigacionPage() {
  return <ResearchPage />
}
