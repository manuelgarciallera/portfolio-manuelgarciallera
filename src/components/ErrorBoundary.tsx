'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary captured runtime error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#0a0a0a', color: '#f5f5f7', fontFamily: "-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif" }}>
            <div style={{ textAlign: 'center', maxWidth: '620px' }}>
              <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: '0.75rem' }}>Portfolio temporalmente no disponible</h1>
              <p style={{ color: '#86868b', lineHeight: 1.6 }}>
                Se ha producido un error en la experiencia interactiva. Recarga la pagina o vuelve a intentarlo en unos segundos.
              </p>
            </div>
          </main>
        )
      )
    }

    return this.props.children
  }
}
