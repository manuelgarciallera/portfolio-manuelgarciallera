import Link from 'next/link'
import Image from 'next/image'
import { ArticleCover } from '../components/ArticlesSection'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ARTICLE_AUTHOR, ARTICLES, type Article } from '../content/articles'
import { PROFILE_LINKS } from '../../../lib/site-config'

export function ArticlePage({ article }: { article: Article }) {
  const relatedArticles = ARTICLES.filter(({ slug }) => slug !== article.slug).slice(0, 2)
  return <main className="rd-article-page" id="main-content">
    <header><Breadcrumbs items={[{ href: '/articulos', label: 'Cuaderno' }, { label: article.title }]} /><p>{article.category}</p><h1>{article.title}</h1><strong>{article.summary}</strong><span>Por {ARTICLE_AUTHOR.name} · {article.readTime} de lectura</span></header>
    <ArticleCover theme={article.theme} index={article.index} />
    <article className="rd-article-prose">{article.sections.map((section, index) => <section key={section.heading ?? index}>{section.heading ? <h2>{section.heading}</h2> : null}{section.paragraphs.map((paragraph, paragraphIndex) => {
      const sentenceEnd = paragraph.indexOf('.')
      const opening = paragraphIndex === 0 && sentenceEnd > 0 ? paragraph.slice(0, sentenceEnd + 1) : null
      return <p key={paragraph}>{opening ? <><strong>{opening}</strong>{paragraph.slice(sentenceEnd + 1)}</> : paragraph}</p>
    })}{section.related ? <Link className="rd-article-related" href={section.related.href}>{section.related.label} <span aria-hidden="true">→</span></Link> : null}</section>)}</article>
    <aside className="rd-author">
      <Image className="rd-author__portrait" src={ARTICLE_AUTHOR.image} alt={`Retrato de ${ARTICLE_AUTHOR.name}`} width={144} height={144} />
      <p><strong>{ARTICLE_AUTHOR.name}</strong><span>{ARTICLE_AUTHOR.role}</span>{ARTICLE_AUTHOR.bio}<a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">Conectar en LinkedIn ↗</a></p>
    </aside>
    <aside className="rd-more-articles" aria-labelledby="more-articles-title">
      <header><p>Más en el cuaderno</p><h2 id="more-articles-title">Una idea abre la siguiente.</h2></header>
      <div>{relatedArticles.map((related) => <article key={related.slug}>
        <Link href={`/articulos/${related.slug}`} aria-label={`Artículo ${related.index}: ${related.title}`}><ArticleCover theme={related.theme} index={related.index} /></Link>
        <p>{related.category}</p>
        <h3><Link href={`/articulos/${related.slug}`}>{related.title}</Link></h3>
        <span>{related.readTime} de lectura</span>
      </article>)}</div>
    </aside>
    <nav className="rd-article-next"><span>Sigue leyendo</span><Link href="/articulos">Explorar el cuaderno →</Link></nav>
  </main>
}
