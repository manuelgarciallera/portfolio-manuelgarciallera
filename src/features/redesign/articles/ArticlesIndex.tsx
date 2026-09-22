import Link from 'next/link'
import { articleHref } from '../../../lib/public-routes'
import { ArticleCover } from '../components/ArticlesSection'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ARTICLES } from '../content/articles'
import './articles-index.css'

export function ArticlesIndex() {
  return (
    <main className="rd-articles-index" id="main-content">
      <header><Breadcrumbs items={[{ label: 'Blog' }]} /><p>Blog</p><h1>Escribo para pensar mejor lo que construyo.</h1><span>Notas de trabajo sobre sistemas, interfaces, materia e inteligencia: preguntas abiertas, decisiones concretas y lo que aprendo al llevarlas a producto.</span></header>
      <section className="rd-editorial" id="articulos">
        <header><p>BLOG <span aria-hidden="true">●</span> INVESTIGACIÓN Y PRÁCTICA</p><h2>Ideas que continúan después del proyecto.</h2></header>
        <div className="rd-editorial__grid">
          {ARTICLES.map((article) => (
            <article key={article.slug}>
              <Link href={articleHref(article.slug)} aria-label={`Artículo ${article.index}: ${article.title}`}><ArticleCover theme={article.theme} index={article.index} /></Link>
              <p>{article.category}</p>
              <h3><Link href={articleHref(article.slug)}>{article.title}</Link></h3>
              <span>{article.readTime} de lectura</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
