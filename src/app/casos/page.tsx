import type { Metadata } from 'next'

import { RedesignCasesIndex } from '@/features/redesign/case/RedesignCasesIndex'
import { OG_IMAGE } from '@/lib/site-config'
import { getCaseCards } from '@/features/redesign/content/card-data'

export const metadata: Metadata = {
  title: 'Casos',
  description:
    'Casos de diseño, prototipado y desarrollo: del research a la evidencia, del componente en Figma al componente en producción, con IA documentada en el proceso.',
  alternates: { canonical: '/casos' },
  openGraph: {
    url: '/casos',
    title: 'Casos de producto — Manuel García-Llera',
    description: 'Investigación, sistemas, prototipos e implementación explicados mediante decisiones y evidencia.',
    images: [OG_IMAGE],
  },
}

export default function CasosPage() {
  return <RedesignCasesIndex cases={getCaseCards()} />
}
