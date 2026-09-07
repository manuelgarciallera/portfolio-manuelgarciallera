import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticlePage } from '@/features/redesign/articles/ArticlePage'
import { EditorialShell } from '@/features/redesign/components/EditorialShell'
import { ARTICLES, ARTICLE_AUTHOR, getArticleBySlug } from '@/features/redesign/content/articles'
import { SITE_URL } from '@/lib/site-config'
import '@/features/redesign/redesign.css'
export const generateStaticParams = () => ARTICLES.map(({ slug }) => ({ slug }))
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.summary,
    keywords: [article.category, 'Product Design', 'HCI', 'Design Systems', 'Human-AI Interaction'],
    authors: [{ name: ARTICLE_AUTHOR.name, url: SITE_URL }],
    alternates: { canonical: `/articulos/${slug}` },
    openGraph: {
      type: 'article',
      url: `/articulos/${slug}`,
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
      authors: [SITE_URL],
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: article.title }],
    },
  }
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    inLanguage: 'es',
    mainEntityOfPage: `${SITE_URL}/articulos/${article.slug}`,
    author: { '@type': 'Person', name: ARTICLE_AUTHOR.name, url: SITE_URL },
    publisher: { '@type': 'Person', name: ARTICLE_AUTHOR.name, url: SITE_URL },
  }).replace(/</g, '\\u003c')
  return <EditorialShell><script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} /><ArticlePage article={article} /></EditorialShell>
}
