import type { Metadata } from 'next'
import { ArticlesIndex } from '@/features/redesign/articles/ArticlesIndex'
import { EditorialShell } from '@/features/redesign/components/EditorialShell'
import '@/features/redesign/redesign.css'
import { OG_IMAGE, PERSON_LEGAL_NAME } from '@/lib/site-config'
import { PUBLIC_ROUTES } from '@/lib/public-routes'
export const metadata: Metadata = {
  title: 'Blog sobre diseño, HCI e IA',
  description: 'Investigación y práctica de Manuel García-Llera sobre sistemas de diseño, HCI, producto e inteligencia artificial.',
  alternates: { canonical: PUBLIC_ROUTES.blog },
  openGraph: {
    url: PUBLIC_ROUTES.blog,
    title: `Blog de diseño, HCI e IA — ${PERSON_LEGAL_NAME}`,
    description: 'Ideas aplicadas sobre interfaces, sistemas, materia y colaboración humano-IA.',
    images: [OG_IMAGE],
  },
}
export default function Page() { return <EditorialShell><ArticlesIndex /></EditorialShell> }
