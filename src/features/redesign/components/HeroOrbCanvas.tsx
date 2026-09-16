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
    let pressAt = -10000, pressX = 0, pressY = 0
    let activePointer: number | null = null, releasedAt = -10000
    let resize: ResizeObserver | undefined, intersection: IntersectionObserver | undefined
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0 }
    const dispose = () => {
      disposed = true; stop(); refresh.current = null
      canvas.removeEventListener('pointerdown', press)
      canvas.removeEventListener('contextmenu', contextMenu)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', clearPress)
      resize?.disconnect(); intersection?.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      canvas.removeEventListener('webglcontextlost', lost)
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach(shader => gl.deleteShader(shader))
    }
    const lost = (event: Event) => { event.preventDefault(); stop(); settings.current.onFailure?.() }
    // Keep native scrolling; no pointer capture or blocking touch listeners.
    // Suppress only the decorative canvas's native long-press context menu.
    const contextMenu = (event: Event) => event.preventDefault()
    const clearPress = () => {
      if (activePointer === null) return
      activePointer = null; releasedAt = performance.now()
    }
    const release = (event: PointerEvent) => {
      if (event.pointerId === activePointer) clearPress()
    }
    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      const scale = 2.8 / (isCompact ? 2.5 : 2.6)
      pressX = ((event.clientX - rect.left) * 2 - rect.width) / rect.height * scale
      pressY = (rect.height - (event.clientY - rect.top) * 2) / rect.height * scale
      return Math.hypot(pressX, pressY) <= 1.3
    }
    const move = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      if (event.buttons === 0 || !locate(event)) clearPress()
    }
    const press = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0 || settings.current.reduceMotion) return
      if (!locate(event)) return
      activePointer = event.pointerId
      pressAt = performance.now()
    }
    const visibility = () => {
      if (document.hidden) { activePointer = null; pressAt = -10000; releasedAt = -10000 }
      restart()
    }
    let draw: (now: number) => void = () => {}
    const tick = (now: number) => {
      if (disposed || !inView || document.hidden || settings.current.reduceMotion) return
      if (now - lastDraw >= 1000 / 30) {
        if (previous) elapsed += Math.min((now - previous) / 1000, .1)
        previous = now; lastDraw = now; draw(now)
      }
      frame = requestAnimationFrame(tick)
    }
    function restart() {
      stop()
      if (disposed || !inView || document.hidden) return
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
      // Only dimensions are cached: pointer coordinates still use a fresh rect
      // after scrolling. Animation does not need a layout read on every frame.
      let rect = canvas.getBoundingClientRect()
      draw = (now) => {
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
        const releaseAge = Math.max(0, (now - releasedAt) / 1000)
        gl.uniform1f(pressAge, age)
        gl.uniform1f(pressStrength, settings.current.reduceMotion ? 0 : activePointer !== null ? 1 : Math.pow(Math.max(0, 1 - releaseAge / 1.4), 2))
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        if (!ready) { ready = true; settings.current.onReady?.() }
      }
      refresh.current = restart
      resize = new ResizeObserver(() => { rect = canvas.getBoundingClientRect(); restart() }); resize.observe(canvas)
      intersection = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; restart() })
      intersection.observe(canvas)
      document.addEventListener('visibilitychange', visibility)
      canvas.addEventListener('webglcontextlost', lost)
      canvas.addEventListener('pointerdown', press, { passive: true })
      canvas.addEventListener('contextmenu', contextMenu)
      window.addEventListener('pointermove', move, { passive: true })
      window.addEventListener('pointerup', release, { passive: true })
      window.addEventListener('pointercancel', release, { passive: true })
      window.addEventListener('blur', clearPress)
      restart()
    } catch {
      dispose(); settings.current.onFailure?.()
    }
    return dispose
  }, [isCompact])

  return <canvas ref={canvasRef} className="rd-hero-canvas" aria-hidden="true" style={{ display: 'block' }} />
}
