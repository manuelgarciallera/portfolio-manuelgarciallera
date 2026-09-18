import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'

// Removing the transparent overscan must fail on the real animated silhouette.
const source = await readFile('src/features/redesign/components/organic-orb-shaders.ts', 'utf8')
const component = await readFile('src/features/redesign/components/HeroOrbCanvas.tsx', 'utf8')
const overscan = Number(component.match(/const ORB_OVERSCAN = ([\d.]+)/)?.[1] || 1)
const vertex = source.match(/ORB_VERTEX = `([\s\S]*?)`/)[1]
const fragment = source.match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]
const original = execFileSync('git', ['show', 'c14921b:src/features/redesign/components/organic-orb-shaders.ts'], { encoding: 'utf8' }).match(/ORB_FRAGMENT = `([\s\S]*?)`/)[1]
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const result = await page.evaluate(({ vertex, fragment, original, overscan }) => {
    const canvas = document.createElement('canvas')
    const size = Math.round(128 * overscan)
    canvas.width = canvas.height = size
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader))
      return shader
    }
    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment))
    gl.linkProgram(program); gl.useProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program))
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.viewport(0, 0, size, size)
    gl.uniform2f(gl.getUniformLocation(program, 'resolution'), size, size)
    const pixels = new Uint8Array(size * size * 4)
    const reference = gl.createProgram()
    gl.attachShader(reference, compile(gl.VERTEX_SHADER, vertex))
    gl.attachShader(reference, compile(gl.FRAGMENT_SHADER, original))
    gl.linkProgram(reference)
    const referencePixels = new Uint8Array(pixels.length)
    let clipped = 0, frames = 0, minimumMargin = size, changedPixels = 0
    for (const zoom of [2.5, 2.6]) for (const strength of [0, 1]) for (let i = 0; i < 40; i++) {
      const time = i * 2.731
      for (const [key, value] of Object.entries({ time, cameraZoom: zoom / overscan, pressStrength: strength, pressAge: time })) {
        gl.uniform1f(gl.getUniformLocation(program, key), value)
      }
      gl.uniform2f(gl.getUniformLocation(program, 'pressPoint'), Math.cos(time), Math.sin(time))
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      // The empty-space shortcut may not alter a single rendered component.
      gl.useProgram(reference)
      const a = gl.getAttribLocation(reference, 'position')
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(reference, 'resolution'), size, size)
      for (const [key, value] of Object.entries({ time, cameraZoom: zoom / overscan, pressStrength: strength, pressAge: time })) gl.uniform1f(gl.getUniformLocation(reference, key), value)
      gl.uniform2f(gl.getUniformLocation(reference, 'pressPoint'), Math.cos(time), Math.sin(time))
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, referencePixels)
      for (let j = 0; j < pixels.length; j++) if (pixels[j] !== referencePixels[j]) changedPixels++
      gl.useProgram(program)
      let margin = size
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (pixels[(y * size + x) * 4 + 3] > 8) margin = Math.min(margin, x, y, size - x - 1, size - y - 1)
      }
      if (margin < 2) clipped++
      minimumMargin = Math.min(minimumMargin, margin); frames++
    }
    const timings = []
    const pixel = new Uint8Array(4)
    for (const [p, factor] of [[reference, 1], [program, overscan]]) {
      const edge = Math.round(384 * factor)
      canvas.width = canvas.height = edge; gl.viewport(0, 0, edge, edge)
      gl.useProgram(p)
      const a = gl.getAttribLocation(p, 'position')
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(gl.getUniformLocation(p, 'resolution'), edge, edge)
      gl.uniform1f(gl.getUniformLocation(p, 'cameraZoom'), 2.5 / factor)
      gl.uniform1f(gl.getUniformLocation(p, 'pressStrength'), 0)
      const samples = []
      for (let i = 0; i < 10; i++) {
        gl.uniform1f(gl.getUniformLocation(p, 'time'), i * .7)
        const start = performance.now()
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        gl.readPixels(edge >> 1, edge >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        if (i > 1) samples.push(performance.now() - start)
      }
      samples.sort((a, b) => a - b)
      timings.push({ factor, medianMs: samples[4] })
    }
    return { overscan, frames, clipped, minimumMargin, changedPixels, timings }
  }, { vertex, fragment, original, overscan })
  console.log(result)
  assert.equal(result.clipped, 0, 'animated bubbles and held-touch deformation must not reach the canvas boundary')
  assert.equal(result.changedPixels, 0, 'empty-space optimisation must preserve every original shader pixel')
} finally { await browser.close() }
