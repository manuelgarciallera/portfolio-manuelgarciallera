import type { Metadata } from 'next'

import { ProcessPage } from '@/features/redesign/process/ProcessPage'

export const metadata: Metadata = {
  title: 'Proceso',
  description:
    'El método completo: encuadre, research, sistema de diseño, prototipo, traspaso a código y verificación. Con la frontera explícita entre lo que decide una persona y lo que ejecuta la IA.',
  alternates: { canonical: '/proceso' },
  openGraph: {
    url: '/proceso',
    title: 'Proceso de diseño y desarrollo — Manuel García-Llera',
    description: 'De la pregunta a la evidencia, con responsabilidades humanas y de IA explícitamente documentadas.',
  },
}

export default function ProcesoPage() {
  return <ProcessPage />
}
