import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server'
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match'

import nextConfig from '../../next.config'
import { metadata as projectsMetadata } from '../app/proyectos/page'
import CaseRoute, { generateMetadata as projectMetadata, generateStaticParams as projectParams } from '../app/proyectos/[slug]/page'
import { metadata as blogMetadata } from '../app/blog/page'
import ArticleRoute, { generateMetadata as articleMetadata } from '../app/blog/[slug]/page'
import sitemap from '../app/sitemap'
import { metadata as privacyMetadata } from '../app/privacidad/page'

describe('canonical public section URLs', () => {
  it.each([
    ['/casos', '/proyectos'],
    ['/articulos', '/blog'],
  ])('matches an exact index redirect before the empty wildcard for %s', async (oldPath, canonicalPath) => {
    const redirects = await nextConfig.redirects!()
    const firstMatch = redirects.find(({ source }) => getPathMatch(source)(oldPath) !== false)

    // The experimental response helper normalises the empty wildcard, but the
    // production deployment emitted /proyectos/ and /blog/, adding a second 308.
    // Check the ordered route contract before that normalisation can hide it.
    expect(firstMatch).toMatchObject({
      source: oldPath,
      destination: canonicalPath,
      permanent: true,
    })
  })

  it.each([
    ['/casos', '/proyectos'],
    ['/casos/buy-sell-marketplace?from=cv', '/proyectos/buy-sell-marketplace?from=cv'],
    ['/articulos', '/blog'],
    ['/articulos/del-objeto-a-la-interfaz?from=cv', '/blog/del-objeto-a-la-interfaz?from=cv'],
  ])('permanently redirects the old URL %s to its equivalent in one hop', async (oldPath, newPath) => {
    const response = await unstable_getResponseFromNextConfig({ url: `https://portfolio.test${oldPath}`, nextConfig })
    expect(response.status).toBe(308)
    expect(getRedirectUrl(response)).toBe(`https://portfolio.test${newPath}`)
    const destination = await unstable_getResponseFromNextConfig({ url: `https://portfolio.test${newPath}`, nextConfig })
    expect(getRedirectUrl(destination)).toBeNull()
  })

  it('does not redirect unrelated sections with a similar prefix', async () => {
    for (const path of ['/casos-extra', '/articulos-extra', '/investigacion', '/api/contact']) {
      const response = await unstable_getResponseFromNextConfig({ url: `https://portfolio.test${path}`, nextConfig })
      expect(getRedirectUrl(response)).toBeNull()
    }
  })

  it('shares and indexes the same URL visitors see for both section indexes', () => {
    expect(projectsMetadata.alternates?.canonical).toBe('/proyectos')
    expect(projectsMetadata.openGraph?.url).toBe('/proyectos')
    expect(blogMetadata.alternates?.canonical).toBe('/blog')
    expect(blogMetadata.openGraph?.url).toBe('/blog')
  })

  it('shares the privacy page itself with its own description and preview image', () => {
    expect(privacyMetadata.alternates?.canonical).toBe('/privacidad')
    expect(privacyMetadata.openGraph?.url).toBe('/privacidad')
    expect(privacyMetadata.openGraph?.description).toBe('Información sobre la medición de visitas y el contacto en el portfolio de Manuel García-Llera Añón.')
    expect(privacyMetadata.openGraph?.images).toEqual(expect.arrayContaining([expect.objectContaining({ url: '/opengraph-image' })]))
    expect(privacyMetadata.openGraph?.locale).toBe('es_ES')
  })

  it.each(['buy-sell-marketplace', 'laliga-club-operations-hub', 'coordination-hub', 'the-ux-union', 'nude-project'])(
    'keeps the published project slug %s on the canonical project path', async (slug) => {
      const metadata = await projectMetadata({ params: Promise.resolve({ slug }) })
      expect(metadata.alternates?.canonical).toBe(`/proyectos/${slug}`)
      expect(metadata.openGraph?.url).toBe(`/proyectos/${slug}`)
    },
  )

  it.each(['del-objeto-a-la-interfaz', 'sistemas-de-diseno-de-figma-a-codigo', 'colaboracion-humano-ia-con-autoria', 'interfaces-para-roles-y-estados-complejos'])(
    'keeps the published article slug %s on the canonical blog path', async (slug) => {
      const metadata = await articleMetadata({ params: Promise.resolve({ slug }) })
      expect(metadata.alternates?.canonical).toBe(`/blog/${slug}`)
      expect(metadata.openGraph?.url).toBe(`/blog/${slug}`)
    },
  )

  it('emits structured data with the canonical project and article URLs', async () => {
    const projectPage = await CaseRoute({ params: Promise.resolve({ slug: 'buy-sell-marketplace' }) })
    const articlePage = await ArticleRoute({ params: Promise.resolve({ slug: 'del-objeto-a-la-interfaz' }) })
    // Exercise the route's actual JSON-LD output without rendering visual Server
    // Components that require Next's request storage outside the page contract.
    const project = renderToStaticMarkup(projectPage.props.children[0])
    const article = renderToStaticMarkup(articlePage.props.children[0])
    const projectData = JSON.parse(project.match(/<script id="case-json-ld-buy-sell-marketplace"[^>]*>(.*?)<\/script>/)![1])
    const articleData = JSON.parse(article.match(/<script id="article-jsonld"[^>]*>(.*?)<\/script>/)![1])
    expect(new URL(projectData.url).pathname).toBe('/proyectos/buy-sell-marketplace')
    expect(new URL(articleData.mainEntityOfPage).pathname).toBe('/blog/del-objeto-a-la-interfaz')
  })

  it('lists only canonical published URLs in the sitemap', () => {
    expect(sitemap().map(({ url }) => new URL(url).pathname).sort()).toEqual([
      '/', '/proyectos', '/investigacion', '/sobre-mi', '/proceso', '/blog',
      '/proyectos/buy-sell-marketplace', '/proyectos/laliga-club-operations-hub', '/proyectos/coordination-hub', '/proyectos/the-ux-union', '/proyectos/nude-project',
      '/blog/del-objeto-a-la-interfaz', '/blog/sistemas-de-diseno-de-figma-a-codigo', '/blog/colaboracion-humano-ia-con-autoria', '/blog/interfaces-para-roles-y-estados-complejos',
    ].sort())
  })

  it('keeps unpublished projects out of generated routes', async () => {
    expect(projectParams().map(({ slug }) => slug).sort()).toEqual([
      'buy-sell-marketplace', 'laliga-club-operations-hub', 'coordination-hub', 'the-ux-union', 'nude-project',
    ].sort())
    await expect(CaseRoute({ params: Promise.resolve({ slug: 'fintech-app' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
    await expect(CaseRoute({ params: Promise.resolve({ slug: 'unknown-project' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404')
  })
})
