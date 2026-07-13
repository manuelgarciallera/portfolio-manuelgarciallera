import type { Metadata } from 'next'

import { RedesignCasesIndex } from '@/features/redesign/case/RedesignCasesIndex'

export const metadata: Metadata = {
  title: 'Casos',
  description:
    'Casos de diseño, prototipado y desarrollo: del research a la evidencia, del componente en Figma al componente en producción, con IA documentada en el proceso.',
}

export default function CasosPage() {
  return <RedesignCasesIndex />
}
