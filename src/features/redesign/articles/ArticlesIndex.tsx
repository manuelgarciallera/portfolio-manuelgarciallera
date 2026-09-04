import { ArticlesSection } from '../components/ArticlesSection'
import { Breadcrumbs } from '../components/Breadcrumbs'

export function ArticlesIndex() { return <main className="rd-articles-index" id="main-content"><header><Breadcrumbs items={[{ label: 'Cuaderno' }]} /><p>Cuaderno</p><h1>Escribo para pensar mejor lo que construyo.</h1><span>Notas de trabajo sobre sistemas, interfaces, materia e inteligencia: preguntas abiertas, decisiones concretas y lo que aprendo al llevarlas a producto.</span></header><ArticlesSection /></main> }
