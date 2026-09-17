import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it} from 'vitest'
import {ArticlesIndex} from './ArticlesIndex'
import {ArticlesSection} from '../components/ArticlesSection'
import {ARTICLES} from '../content/articles'

describe('blog and landing article layouts',()=>{
  it('shows every blog article in the large-cover list without carousel controls or a self link',()=>{
    const html=renderToStaticMarkup(<ArticlesIndex />)
    expect(html).toContain('class="rd-editorial__grid"')
    expect(html).not.toContain('articles-track')
    expect(html).not.toContain('Ver todos los artículos')
    for(const article of ARTICLES) expect(html).toContain(`href="/articulos/${article.slug}"`)
    expect(html.match(/class="rd-article-cover /g)).toHaveLength(ARTICLES.length)
  })
  it('keeps the landing carousel and its navigation unchanged',()=>{
    const html=renderToStaticMarkup(<ArticlesSection />)
    expect(html).toContain('class="rd-editorial__rail"')
    expect(html.match(/aria-controls="articles-track"/g)).toHaveLength(2)
    expect(html).toContain('Ver todos los artículos')
  })
})
