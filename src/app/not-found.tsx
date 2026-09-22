import type { Metadata } from 'next'
import Link from 'next/link'

import { EditorialShell } from '@/features/redesign/components/EditorialShell'
import { PUBLIC_ROUTES } from '@/lib/public-routes'
import { PERSON_LEGAL_NAME } from '@/lib/site-config'
import '@/features/redesign/redesign.css'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: `La ruta solicitada no existe. Explora los casos de producto, sistemas de diseño e investigación de ${PERSON_LEGAL_NAME}.`,
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <EditorialShell>
      <main className="rd-not-found" id="main-content">
        <p className="rd-label">Error 404</p>
        <h1>Esta ruta no existe.<br /><em>La siguiente decisión, sí.</em></h1>
        <p>Vuelve a los casos para recorrer el trabajo o cuéntame qué producto tienes entre manos.</p>
        <nav aria-label="Opciones para continuar">
          <Link href={PUBLIC_ROUTES.projects}>Ver proyectos <span aria-hidden="true">→</span></Link>
          <Link href="/#contacto">Abrir una conversación <span aria-hidden="true">↗</span></Link>
        </nav>
      </main>
    </EditorialShell>
  )
}
