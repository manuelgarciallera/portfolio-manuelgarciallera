import type { Metadata } from 'next'

import { ProcessPage } from '@/features/redesign/process/ProcessPage'

export const metadata: Metadata = {
  title: 'Proceso',
  description:
    'El método completo: encuadre, research, sistema de diseño, prototipo, traspaso a código y verificación. Con la frontera explícita entre lo que decide una persona y lo que ejecuta la IA.',
}

export default function ProcesoPage() {
  return <ProcessPage />
}
