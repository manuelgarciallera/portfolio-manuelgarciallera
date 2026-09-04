'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type Pixel = { x: number; y: number; tone: number; delay: number; size: number }

function seededNoise(value: number): number {
  const x = Math.sin(value * 91.133) * 43758.5453
  return x - Math.floor(x)
}

function createArchitecture(width: number, height: number, iteration = 0): Pixel[] {
  const unit = Math.max(4, Math.round(Math.min(width, height) / 126))
  const pixels: Pixel[] = []
  const cx = width * 0.58
  const base = height * 0.87
  const addMass = (left: number, top: number, right: number, bottom: number, seed: number) => {
    for (let y = top; y < bottom; y += unit) {
      for (let x = left; x < right; x += unit) {
        const edge = x < left + unit * 2 || x > right - unit * 3 || y < top + unit * 2
        const voidCell = seededNoise(x * 0.13 + y * 0.07 + seed) > (edge ? 0.99 : 0.975)
        if (voidCell) continue
        const vertical = (base - y) / Math.max(1, base)
        const horizontal = 1 - x / Math.max(1, width)
        pixels.push({
          x,
          y,
          size: unit,
          tone: 0.6 + seededNoise(x * 0.37 + y * 0.61 + seed * 17) * 0.1,
          delay: vertical * 0.72 + horizontal * 0.28 + seededNoise(x * y + seed) * 0.08,
        })
      }
    }
  }

  addMass(cx - width * 0.26, base - height * 0.22, cx + width * 0.31, base, 1 + iteration)
  addMass(cx - width * 0.18, base - height * 0.47, cx + width * 0.2, base - height * 0.2, 2 + iteration)
  addMass(cx - width * 0.08, base - height * 0.68, cx + width * 0.1, base - height * 0.45, 3 + iteration)
  addMass(cx - width * 0.31, base - height * 0.34, cx - width * 0.17, base - height * 0.12, 4 + iteration)
  addMass(cx + width * 0.19, base - height * 0.38, cx + width * 0.35, base - height * 0.08, 5 + iteration)
  return pixels
}

export function PixelArchitectureLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [iteration, setIteration] = useState(0)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return () => undefined
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return () => undefined
    const bounds = canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(bounds.width * ratio)
    canvas.height = Math.round(bounds.height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const pixels = createArchitecture(bounds.width, bounds.height, iteration)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()

    const frame = (now: number) => {
      const progress = reducedMotion ? 1 : Math.min(1, (now - start) / 3600)
      context.fillStyle = '#080808'
      context.fillRect(0, 0, bounds.width, bounds.height)

      context.strokeStyle = 'rgba(255,255,255,.045)'
      context.lineWidth = 1
      for (let x = 0; x < bounds.width; x += 32) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, bounds.height); context.stroke()
      }

      for (const pixel of pixels) {
        const local = Math.max(0, Math.min(1, (progress - pixel.delay * 0.82) / 0.18))
        if (local <= 0) continue
        const alpha = Math.min(1, local * 1.7)
        const tone = Math.round(255 * pixel.tone)
        context.fillStyle = `rgba(${tone},${tone},${tone},${alpha})`
        const inset = (1 - local) * pixel.size * 0.45
        context.fillRect(pixel.x + inset, pixel.y + inset, Math.max(1, pixel.size - inset * 2), Math.max(1, pixel.size - inset * 2))
      }

      if (progress < 1) animationRef.current = window.requestAnimationFrame(frame)
    }
    animationRef.current = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(animationRef.current)
  }, [iteration])

  useEffect(() => {
    const cleanup = render()
    const resize = () => { cleanup(); render() }
    window.addEventListener('resize', resize)
    return () => { cleanup(); window.removeEventListener('resize', resize) }
  }, [render])

  return (
    <main className="pixel-lab">
      <header className="pixel-lab__header">
        <Link href="/">Manuel García-Llera</Link>
        <span>Prueba 01 · arquitectura generativa</span>
      </header>
      <section className="pixel-lab__hero">
        <div className="pixel-lab__copy">
          <span>Product Designer · Design Engineer</span>
          <h1>Construyo<br />sistemas que<br /><em>pueden evolucionar.</em></h1>
          <p>Diseño, investigación HCI e implementación conectadas en una misma práctica.</p>
        </div>
        <canvas ref={canvasRef} className="pixel-lab__canvas" aria-hidden="true" />
        <button type="button" className="pixel-lab__replay" onClick={() => setIteration((value) => value + 1)}>
          Repetir construcción <span aria-hidden="true">↻</span>
        </button>
      </section>
    </main>
  )
}
