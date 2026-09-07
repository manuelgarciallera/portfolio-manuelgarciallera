import type { Metadata } from 'next'

import { AboutIdentity } from '@/features/redesign/about/AboutIdentity'
import { AboutPage } from '@/features/redesign/about/AboutPage'
import { getProfilePageJsonLd, OG_IMAGE } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Sobre mí',
  description:
    'Diseñador e investigador: de la escuela de arte a la cultura material, del diseño 3D y la arquitectura de interiores a UX y desarrollo full stack.',
  alternates: { canonical: '/sobre-mi' },
  openGraph: {
    url: '/sobre-mi',
    title: 'Sobre Manuel García-Llera — Product Designer y Design Engineer',
    description: 'Una trayectoria que conecta arte, cultura material, arquitectura de interiores, diseño 3D, UX, desarrollo full stack e investigación HCI.',
    images: [OG_IMAGE],
  },
}

// `ProfilePage` describe LA pagina de perfil. Estaba en el layout raiz y por tanto
// en todas las rutas; aqui es donde de verdad corresponde.
const profilePageJsonLd = JSON.stringify(getProfilePageJsonLd()).replace(/</g, '\\u003c')

export default function SobreMiPage() {
  return (
    <>
      <script
        id="profile-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: profilePageJsonLd }}
      />
      <AboutPage identity={<AboutIdentity />} />
    </>
  )
}
