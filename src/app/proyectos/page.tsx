import type { Metadata } from 'next'

import { RedesignCasesIndex } from '@/features/redesign/case/RedesignCasesIndex'
import { OG_IMAGE, PERSON_LEGAL_NAME } from '@/lib/site-config'
import { getCaseCards } from '@/features/redesign/content/card-data'
import { PUBLIC_ROUTES } from '@/lib/public-routes'

export const metadata: Metadata = {
  title: 'Proyectos',
  description:
    'Casos de diseño, prototipado y desarrollo: del research a la evidencia, del componente en Figma al componente en producción, con IA documentada en el proceso.',
  alternates: { canonical: PUBLIC_ROUTES.projects },
  openGraph: {
    url: PUBLIC_ROUTES.projects,
    title: `Proyectos de producto — ${PERSON_LEGAL_NAME}`,
    description: 'Investigación, sistemas, prototipos e implementación explicados mediante decisiones y evidencia.',
    images: [OG_IMAGE],
  },
}

export default function CasosPage() {
  return <RedesignCasesIndex cases={getCaseCards()} />
}
