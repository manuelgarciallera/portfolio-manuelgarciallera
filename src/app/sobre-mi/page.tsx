import type { Metadata } from 'next'

import { AboutPage } from '@/features/redesign/about/AboutPage'

export const metadata: Metadata = {
  title: 'Sobre mí',
  description:
    'Diseñador e investigador: de la escuela de arte a la cultura material, del máster en experiencia de usuario al desarrollo full stack. Cinco etapas que se explican entre sí.',
}

export default function SobreMiPage() {
  return <AboutPage />
}
