'use client'

import Link from 'next/link'
import { articleHref, PUBLIC_ROUTES } from '../../../lib/public-routes'
import { useEffect, useRef, useState } from 'react'
import { ARTICLES } from '../content/articles'
import { RailControls } from '../visual-gallery/RailControls'
import '../visual-gallery/visual-gallery.css'
import './articles-rail.css'

export function ArticleCover({ theme, index }: { theme: string; index: string }) {
  const coverRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const cover = coverRef.current
    if (!cover || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '10% 0px', threshold: 0.08 },
    )
    observer.observe(cover)
    return () => observer.disconnect()
  }, [])

  return <div ref={coverRef} className={`rd-article-cover rd-article-cover--${theme}`} data-active={active ? 'true' : 'false'} aria-hidden="true"><span>{index}</span><i /><i /><i /></div>
}

export function ArticlesSection() {
  return (
    <section className="rd-editorial rd-editorial--rail" id="articulos">
      <header><p>BLOG <span aria-hidden="true">●</span> INVESTIGACIÓN Y PRÁCTICA</p><h2>Ideas que continúan después del proyecto.</h2></header>
      <div className="rd-editorial__navigation"><p id="articles-help">Explora los artículos de lado a lado.</p><RailControls trackId="articles-track" content="artículos" /></div>
      <div id="articles-track" className="rd-editorial__rail" role="region" aria-label="Artículos del blog" aria-describedby="articles-help" tabIndex={0}>
        {ARTICLES.map((article) => <article key={article.slug}><Link href={articleHref(article.slug)} aria-label={`Artículo ${article.index}: ${article.title}`}><ArticleCover theme={article.theme} index={article.index} /></Link><p>{article.category}</p><h3><Link href={articleHref(article.slug)}>{article.title}</Link></h3><span>{article.readTime} de lectura</span></article>)}
      </div>
      <Link className="rd-editorial__all" href={PUBLIC_ROUTES.blog}>Ver todos los artículos →</Link>
    </section>
  )
}
