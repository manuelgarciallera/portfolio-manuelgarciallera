import type { Metadata } from 'next'

import { AboutPage } from '@/features/redesign/about/AboutPage'

export const metadata: Metadata = {
  title: 'Sobre mí',
  description:
    'Diseñador e investigador: de la escuela de arte a la cultura material, del diseño 3D y la arquitectura de interiores a UX y desarrollo full stack.',
  alternates: { canonical: '/sobre-mi' },
  openGraph: {
    url: '/sobre-mi',
    title: 'Sobre Manuel García-Llera — Product Designer y Design Engineer',
    description: 'Una trayectoria que conecta arte, cultura material, arquitectura de interiores, diseño 3D, UX, desarrollo full stack e investigación HCI.',
  },
}

export default function SobreMiPage() {
  return <AboutPage />
}
