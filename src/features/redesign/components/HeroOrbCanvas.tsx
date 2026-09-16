'use client'

import { useEffect, useRef } from 'react'
import { ORB_FRAGMENT, ORB_VERTEX } from './organic-orb-shaders'

interface HeroOrbCanvasProps {
  isDark: boolean
  reduceMotion: boolean
  isCompact: boolean
  onReady?: () => void
  onFailure?: () => void
}

export function HeroOrbCanvas({ isDark, reduceMotion, isCompact, onReady, onFailure }: HeroOrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settings = useRef({ isDark, reduceMotion, onReady, onFailure })
  const refresh = useRef<(() => void) | null>(null)
  useEffect(() => {
    settings.current = { isDark, reduceMotion, onReady, onFailure }
    refresh.current?.()
  }, [isDark, reduceMotion, onReady, onFailure])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' })
    if (!gl) { settings.current.onFailure?.(); return }
    const shaders: WebGLShader[] = []
    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let frame = 0, elapsed = 0, previous = 0, lastDraw = 0
    let ready = false, inView = true, disposed = false
    let scrolling = false, resumeTimer = 0
    let pressAt = -10000, pressX = 0, pressY = 0
    let resize: ResizeObserver | undefined, intersection: IntersectionObserver | undefined
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0 }
    const dispose = () => {
      disposed = true; stop(); refresh.current = null
      window.clearTimeout(resumeTimer)
      canvas.removeEventListener('pointerdown', press)
      window.removeEventListener('scroll', scroll)
      resize?.disconnect(); intersection?.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      canvas.removeEventListener('webglcontextlost', lost)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach(shader => gl.deleteShader(shader))
    }
    const lost = (event: Event) => { event.preventDefault(); stop(); settings.current.onFailure?.() }
    // Only actual scrolling suspends drawing, never contact/holding a finger.
    // The finite impulse needs no pointerup, capture or blocking touch listener.
    const settle = () => {
      window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        scrolling = false
        restart()
      }, 180)
    }
    const press = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0 || settings.current.reduceMotion) return
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const scale = 2.8 / (isCompact ? 2.5 : 2.6)
      pressX = ((event.clientX - rect.left) * 2 - rect.width) / rect.height * scale
      pressY = (rect.height - (event.clientY - rect.top) * 2) / rect.height * scale
      if (Math.hypot(pressX, pressY) > 1.3) return
      pressAt = performance.now()
    }
    const scroll = () => { scrolling = true; stop(); settle() }
    const visibility = () => {
      if (document.hidden) { scrolling = false; pressAt = -10000; window.clearTimeout(resumeTimer) }
      restart()
    }
    let draw: (now: number) => void = () => {}
    const tick = (now: number) => {
      if (disposed || !inView || document.hidden || scrolling || settings.current.reduceMotion) return
      if (now - lastDraw >= 1000 / 30) {
        if (previous) elapsed += Math.min((now - previous) / 1000, .1)
        previous = now; lastDraw = now; draw(now)
      }
      frame = requestAnimationFrame(tick)
    }
    function restart() {
      stop()
      if (disposed || !inView || document.hidden || scrolling) return
      draw(performance.now())
      if (!settings.current.reduceMotion) frame = requestAnimationFrame(tick)
    }
    try {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)
        if (!shader) throw new Error('Shader allocation failed')
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Organic shader compilation failed')
        return shader
      }
      program = gl.createProgram()
      if (!program) throw new Error('Program allocation failed')
      gl.attachShader(program, compile(gl.VERTEX_SHADER, ORB_VERTEX))
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, ORB_FRAGMENT))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Organic shader linking failed')
      gl.useProgram(program)
      buffer = gl.createBuffer()
      if (!buffer) throw new Error('Buffer allocation failed')
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
      const position = gl.getAttribLocation(program, 'position')
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      const time = gl.getUniformLocation(program, 'time'), resolution = gl.getUniformLocation(program, 'resolution')
      const theme = gl.getUniformLocation(program, 'lightTheme'), zoom = gl.getUniformLocation(program, 'cameraZoom')
      const offset = gl.getUniformLocation(program, 'verticalOffset')
      const pressPoint = gl.getUniformLocation(program, 'pressPoint')
      const pressAge = gl.getUniformLocation(program, 'pressAge'), pressStrength = gl.getUniformLocation(program, 'pressStrength')
      draw = (now) => {
        const rect = canvas.getBoundingClientRect()
        if (!rect.width || !rect.height || disposed) return
        const ratio = Math.min(1.25, (isCompact ? 384 : 560) / Math.max(rect.width, rect.height))
        const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio))
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
        gl.viewport(0, 0, width, height)
        gl.uniform2f(resolution, width, height); gl.uniform1f(time, elapsed)
        gl.uniform1f(theme, settings.current.isDark ? 0 : 1)
        gl.uniform1f(zoom, isCompact ? 2.5 : 2.6)
        gl.uniform1f(offset, 0)
        const age = Math.max(0, (now - pressAt) / 1000)
        gl.uniform2f(pressPoint, pressX, pressY)
        gl.uniform1f(pressAge, Math.min(age, 2))
        gl.uniform1f(pressStrength, settings.current.reduceMotion ? 0 : Math.pow(Math.max(0, 1 - age / 1.4), 2))
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        if (!ready) { ready = true; settings.current.onReady?.() }
      }
      refresh.current = restart
      resize = new ResizeObserver(restart); resize.observe(canvas)
      intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; restart() })
      intersection.observe(canvas)
      document.addEventListener('visibilitychange', visibility)
      canvas.addEventListener('webglcontextlost', lost)
      canvas.addEventListener('pointerdown', press, { passive: true })
      if (isCompact) {
        window.addEventListener('scroll', scroll, { passive: true })
      }
      restart()
    } catch {
      dispose(); settings.current.onFailure?.()
    }
    return dispose
  }, [isCompact])

  return <canvas ref={canvasRef} className="rd-hero-canvas" aria-hidden="true" style={{ display: 'block' }} />
}
