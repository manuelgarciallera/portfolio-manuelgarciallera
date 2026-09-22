import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createResearchSphere, createSatinTexture } from './researchArtifactMaterial'
import * as researchMaterial from './researchArtifactMaterial'
import { advanceResearchTime, getResearchPose, getResearchNodePosition } from './researchArtifactMotion'
import { advanceResearchPulse, createResearchAppearanceClock, getResearchAppearance } from './researchArtifactAppearance'
import { ResearchArtifactCanvas } from './ResearchArtifactCanvas'

describe('round research sculpture', () => {
  it('offers a keyboard-operable colour control outside the decorative canvas', () => {
    const markup = renderToStaticMarkup(createElement(ResearchArtifactCanvas))
    expect(markup).toMatch(/<button\b[^>]*type="button"[^>]*aria-label="Cambiar el color de Saturno"/)
  })

  it('uses a bounded seamless multicolour map without increasing the sphere geometry', () => {
    expect(researchMaterial.createResearchGradientTexture).toBeTypeOf('function')
    const texture = researchMaterial.createResearchGradientTexture()
    const { data, width, height } = texture.image
    const pixels = data as Uint8Array
    expect([width, height, pixels.byteLength]).toEqual([64, 32, 8192])
    const colours = new Set<string>()
    for (let y = 0; y < height; y++) {
      const start = y * width * 4
      expect([...pixels.slice(start, start + 4)]).toEqual([...pixels.slice(start + (width - 1) * 4, start + width * 4)])
      for (let x = 0; x < width; x++) {
        const index = start + x * 4
        colours.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`)
        expect(pixels[index + 3]).toBe(255)
      }
    }
    expect(colours.size).toBeGreaterThan(500)
    expect(pixels.some((value, index) => index % 4 === 0 && value > 200)).toBe(true)
    expect(pixels.some((value, index) => index % 4 === 1 && value > 180)).toBe(true)
    texture.dispose()
  })

  it('keeps every surface vertex on the same radius, including the silhouette', () => {
    const geometry = createResearchSphere()
    const positions = geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      expect(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i))).toBeCloseTo(1.2, 5)
    }
    expect(positions.count).toBeGreaterThan(2000)
    expect(positions.count).toBeLessThan(4000)
    geometry.dispose()
  })

  it('uses bounded surface detail with no visible longitude seam or pinched poles', () => {
    const texture = createSatinTexture()
    const { data, width, height } = texture.image
    const pixels = data as Uint8Array
    const samples = Array.from(pixels).filter((_, index) => index % 4 === 0)
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(10)
    expect(Math.min(...samples)).toBeGreaterThan(70)
    expect(Math.max(...samples)).toBeLessThan(190)
    for (let y = 0; y < height; y++) {
      expect(pixels[(y * width) * 4]).toBe(pixels[(y * width + width - 1) * 4])
    }
    for (const y of [0, height - 1]) {
      expect(new Set(samples.slice(y * width, (y + 1) * width)).size).toBe(1)
    }
    texture.dispose()
  })

  it('stores satin roughness separately from height so the bump map cannot polish the surface', () => {
    const texture = createSatinTexture()
    const pixels = texture.image.data as Uint8Array
    const roughness = Array.from(pixels).filter((_, index) => index % 4 === 1)
    expect(Math.min(...roughness) / 255).toBeGreaterThan(0.8)
    expect(Math.max(...roughness) / 255).toBeLessThan(0.95)
    expect(pixels[1] - pixels[0]).toBeGreaterThan(64)
    texture.dispose()
  })
})

describe('temporary research colour', () => {
  afterEach(() => vi.useRealTimers())

  it('returns to graphite after six seconds and restarts that period after another activation', () => {
    vi.useFakeTimers()
    expect(researchMaterial.createResearchPulseReset).toBeTypeOf('function')
    let active = true
    const reset = researchMaterial.createResearchPulseReset(() => { active = false })
    reset.restart()
    vi.advanceTimersByTime(5900)
    expect(active).toBe(true)
    reset.restart()
    vi.advanceTimersByTime(5900)
    expect(active).toBe(true)
    vi.advanceTimersByTime(100)
    expect(active).toBe(false)
    reset.cancel()
  })

  it('cancels the pending state update when the scene is removed', () => {
    vi.useFakeTimers()
    expect(researchMaterial.createResearchPulseReset).toBeTypeOf('function')
    let updates = 0
    const reset = researchMaterial.createResearchPulseReset(() => { updates += 1 })
    reset.restart()
    reset.cancel()
    vi.runAllTimers()
    expect(updates).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the six-second reset aligned with a pulse paused out of view', () => {
    vi.useFakeTimers()
    let active = true
    const reset = researchMaterial.createResearchPulseReset(() => { active = false })
    expect(reset.pause).toBeTypeOf('function')
    expect(reset.resume).toBeTypeOf('function')
    const clock = createResearchAppearanceClock()
    let age = 0
    clock.tick(0, true)
    reset.restart()
    for (let frame = 0; frame < 10; frame++) {
      vi.advanceTimersByTime(100)
      age = advanceResearchPulse(age, clock.tick(0.1, true), true)
    }
    reset.pause()
    clock.pause()
    vi.advanceTimersByTime(2000)
    expect(active).toBe(true)
    expect(reset.age()).toBeCloseTo(1)
    reset.resume()
    expect(clock.tick(2, true)).toBe(0)
    for (let frame = 0; frame < 30; frame++) {
      vi.advanceTimersByTime(100)
      age = advanceResearchPulse(age, clock.tick(0.1, true), true)
    }
    expect(age).toBeCloseTo(4)
    expect(reset.age()).toBeCloseTo(4)
    expect(getResearchAppearance(0, age, false).colour).toBeGreaterThan(0.25)
    expect(active).toBe(true)
    for (let frame = 0; frame < 20; frame++) {
      vi.advanceTimersByTime(100)
      age = advanceResearchPulse(age, clock.tick(0.1, true), true)
    }
    expect(age).toBeCloseTo(6)
    expect(getResearchAppearance(0, age, false).colour).toBeCloseTo(0)
    expect(active).toBe(false)
    reset.cancel()
  })

  it('can cancel a paused reset without reviving it on resume', () => {
    vi.useFakeTimers()
    const onReset = vi.fn()
    const reset = researchMaterial.createResearchPulseReset(onReset)
    expect(reset.pause).toBeTypeOf('function')
    reset.restart()
    vi.advanceTimersByTime(1000)
    reset.pause()
    reset.cancel()
    reset.resume()
    vi.runAllTimers()
    expect(onReset).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restarts a paused pulse at zero and resumes only one remaining timer', () => {
    vi.useFakeTimers()
    const onReset = vi.fn()
    const reset = researchMaterial.createResearchPulseReset(onReset)
    expect(reset.age).toBeTypeOf('function')
    expect(reset.age()).toBe(Infinity)
    reset.restart()
    vi.advanceTimersByTime(3000)
    expect(reset.age()).toBeCloseTo(3)
    reset.pause()
    reset.restart(false)
    expect(reset.age()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(10000)
    expect(reset.age()).toBe(0)
    reset.resume()
    reset.resume()
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(5999)
    expect(onReset).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(reset.age()).toBe(Infinity)
    reset.cancel()
  })

  it('uses the same pulse age when switching between static and animated feedback', () => {
    vi.useFakeTimers()
    const onReset = vi.fn()
    const reset = researchMaterial.createResearchPulseReset(onReset)
    expect(reset.age).toBeTypeOf('function')
    reset.restart()
    vi.advanceTimersByTime(3000)
    expect(getResearchAppearance(0, reset.age(), false).colour).toBeCloseTo(0.5)
    expect(getResearchAppearance(0, 0, true).colour).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(getResearchAppearance(0, reset.age(), false).colour).toBeCloseTo(0.259259)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(2000)
    expect(onReset).toHaveBeenCalledTimes(1)
    reset.cancel()
  })
})

describe('research orbit motion', () => {
  it('starts reduced motion at the composed static pose and keeps it there', () => {
    expect(getResearchPose(900, true)).toEqual(getResearchPose(0, false))
    expect(advanceResearchTime(0, 0.016, true, true)).toBe(0)
  })

  it('pauses offscreen and clamps the first frame after a long pause', () => {
    expect(advanceResearchTime(12, 600, false, false)).toBe(12)
    expect(advanceResearchTime(12, 600, false, true)).toBeCloseTo(12.05)
    expect(advanceResearchTime(12, 1 / 60, false, true)).toBeCloseTo(12 + 1 / 60)
  })

  it('keeps precession bounded and slow over a long visit', () => {
    for (let time = 0; time < 3600; time += 7) {
      const pose = getResearchPose(time, false)
      const next = getResearchPose(time + 1 / 60, false)
      expect(pose.ringTilt[0]).toBeGreaterThan(0.9)
      expect(pose.ringTilt[0]).toBeLessThan(1.25)
      expect(Math.abs(pose.ringTilt[1])).toBeLessThan(0.3)
      expect(pose.ringTilt[2]).toBeGreaterThan(-0.45)
      expect(pose.ringTilt[2]).toBeLessThan(-0.1)
      pose.ringTilt.forEach((value, axis) => expect(Math.abs(next.ringTilt[axis] - value)).toBeLessThan(0.001))
    }
  })

  it('moves lights on their actual ring plane without radial drift', () => {
    for (const phase of [0, 0.4, 1.6, 3.2, 6.28]) {
      const [x, y, z] = getResearchNodePosition(phase)
      expect(Math.hypot(x, y)).toBeCloseTo(1.7, 10)
      expect(z).toBe(0)
    }
    expect(getResearchNodePosition(0)).toEqual([1.7, 0, 0])
    expect(getResearchNodePosition(Math.PI / 2)[1]).toBeCloseTo(1.7)
  })
})
