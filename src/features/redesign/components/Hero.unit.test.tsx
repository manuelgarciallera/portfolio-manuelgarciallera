import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Hero } from './Hero'

describe('Hero', () => {
  it('opens with one human promise, one visual and one primary action', () => {
    const markup = renderToStaticMarkup(<Hero />)

    expect(markup).toContain('hero-refractive-orb-fallback-v2.webp')
    expect(markup).toContain('rd-hero-canvas-stage')
    expect(markup).toContain('data-ready="false"')
    expect(markup.match(/rd-hero-art-fallback/g)).toHaveLength(1)
    expect(markup).toContain('fetchPriority="high"')
    expect(markup).toContain('Diseño sistemas digitales que conectan investigación, interfaz y código')
    expect(markup).not.toContain('productos que se entienden, se usan y evolucionan')
    expect(markup).toContain('Ver proyectos')
    expect(markup).toContain('href="#casos"')
    expect(markup).not.toContain('rd-hero-kicker')
    expect(markup).not.toContain('rd-hero-specialties')
    expect(markup).not.toContain('rd-hero-corner')
    expect(markup).not.toContain('rd-hero-scroll')
    expect(markup).not.toContain('Cómo trabajo')
  })

  it('mounts one continuous WebGL object immediately instead of swapping it after interaction', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/Hero.tsx'), 'utf8')

    expect(source).toContain("dynamic(() => import('./HeroOrbCanvas')")
    expect(source).toContain('<HeroOrbCanvas')
    expect(source).not.toContain('canvasActive')
    expect(source).not.toContain('activateCanvas')
    expect(source).not.toContain('onPointerEnter')
    expect(source).not.toContain('onPointerDown')
    expect(source).toContain('onReady={() => setCanvasReady(true)}')
  })

  it('uses the exact page colours inside the transparent WebGL stage', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/HeroOrbCanvas.tsx'), 'utf8')
    expect(source).toContain("isDark ? '#0d0e0c' : '#fafaf6'")
  })
})
