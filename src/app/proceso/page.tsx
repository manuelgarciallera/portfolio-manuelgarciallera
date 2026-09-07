import type { Metadata } from 'next'

import { ProcessPage } from '@/features/redesign/process/ProcessPage'
import { OG_IMAGE } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Proceso',
  description:
    'Encuadre, research, sistema de diseño, prototipo y traspaso a código, con la frontera explícita entre lo que decide una persona y lo que ejecuta la IA.',
  alternates: { canonical: '/proceso' },
  openGraph: {
    url: '/proceso',
    title: 'Proceso de diseño y desarrollo — Manuel García-Llera',
    description: 'De la pregunta a la evidencia, con responsabilidades humanas y de IA explícitamente documentadas.',
    images: [OG_IMAGE],
  },
}

export default function ProcesoPage() {
  return <ProcessPage />
}
