'use client'

import { FormEvent, useRef, useState } from 'react'

import styles from './OwnerSearch.module.css'

type SearchResult = {
  adminPath: string
  collection: 'articles' | 'media' | 'pages' | 'projects'
  id: string | number
  label: string
  slug?: string
  status?: 'draft' | 'published'
  updatedAt: string
}

type SearchResponse = { search?: { count: number; results: SearchResult[] }; error?: string }
const labels: Record<SearchResult['collection'], string> = {
  articles: 'Artículo',
  media: 'Medio',
  pages: 'Página',
  projects: 'Proyecto',
}

export const OwnerSearch = () => {
  const controller = useRef<AbortController | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [message, setMessage] = useState('Busca por título, slug, texto alternativo o nombre de archivo.')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('q')?.toString().trim() ?? ''
    if (query.length < 2 || query.length > 80) {
      setResults([])
      setMessage('Escribe entre 2 y 80 caracteres.')
      return
    }
    controller.current?.abort()
    const nextController = new AbortController()
    controller.current = nextController
    setPending(true)
    setMessage('Buscando…')
    try {
      const response = await fetch(`/api/owner/search?q=${encodeURIComponent(query)}`, {
        credentials: 'same-origin',
        signal: nextController.signal,
      })
      const data = await response.json() as SearchResponse
      if (!response.ok || !data.search) throw new Error(data.error ?? 'Search failed')
      setResults(data.search.results)
      setMessage(data.search.count ? `${data.search.count} resultados.` : 'No hay resultados.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setResults([])
      setMessage('No se pudo completar la búsqueda. Inténtalo de nuevo.')
    } finally {
      if (controller.current === nextController) setPending(false)
    }
  }

  return (
    <section className={styles.search} aria-labelledby="owner-search-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Acceso rápido</p>
          <h1 id="owner-search-title" className={styles.title}>¿Qué quieres editar?</h1>
        </div>
        <p className={styles.description}>Encuentra contenido sin recorrer las colecciones.</p>
      </div>
      <form className={styles.form} onSubmit={submit} role="search">
        <label className={styles.srOnly} htmlFor="owner-search-query">Buscar contenido</label>
        <input id="owner-search-query" name="q" type="search" minLength={2} maxLength={80} placeholder="Proyecto, página, artículo o imagen…" autoComplete="off" />
        <button type="submit" disabled={pending}>{pending ? 'Buscando…' : 'Buscar'}</button>
      </form>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((result) => (
            <li key={`${result.collection}:${result.id}`}>
              <a href={result.adminPath}>
                <span>{result.label}</span>
                <small>{labels[result.collection]}{result.status ? ` · ${result.status === 'draft' ? 'Borrador' : 'Publicado'}` : ''}</small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
