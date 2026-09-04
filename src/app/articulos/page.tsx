import type { Metadata } from 'next'
import { ArticlesIndex } from '@/features/redesign/articles/ArticlesIndex'
import { EditorialShell } from '@/features/redesign/components/EditorialShell'
import '@/features/redesign/redesign.css'
export const metadata: Metadata = {
  title: 'Artículos sobre diseño, HCI e IA',
  description: 'Investigación y práctica de Manuel García-Llera sobre sistemas de diseño, HCI, producto e inteligencia artificial.',
  alternates: { canonical: '/articulos' },
  openGraph: {
    url: '/articulos',
    title: 'Cuaderno de diseño, HCI e IA — Manuel García-Llera',
    description: 'Ideas aplicadas sobre interfaces, sistemas, materia y colaboración humano-IA.',
  },
}
export default function Page() { return <EditorialShell><ArticlesIndex /></EditorialShell> }
