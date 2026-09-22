import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRailMotion } from './useRailMotion'

// Node unit tests of the real hook's effect and scheduler, not a React render or
// browser test. Native focus navigation, pointer coalescing and layout need E2E.
const effects = vi.hoisted(() => ({ mount: undefined as (() => (() => void) | void) | undefined }))
vi.mock('react', () => ({
  useEffect: (mount: () => (() => void) | void) => { effects.mount = mount },
  useRef: <T>(current: T) => ({ current }),
  useState: <T>(value: T) => [value, () => {}],
}))

let unmount: (() => void) | undefined

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance', 'setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  unmount?.()
  unmount = undefined
  effects.mount = undefined
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function mountRail() {
  let controlsFocused = false
  let nextFrame = 0
  const frames = new Map<number, FrameRequestCallback>()
  const capturedPointers = new Set<number>()
  const scope = Object.assign(new EventTarget(), {
    querySelector: (selector: string) => selector === ':focus-visible' && controlsFocused ? {} : null,
  })
  const track = Object.assign(new EventTarget(), {
    scrollLeft: 0, scrollWidth: 2000, clientWidth: 1000,
    dataset: {} as Record<string, string>,
    closest: (selector: string) => selector === 'section' ? scope : null,
    matches: () => false,
    getBoundingClientRect: () => ({ left: 0, width: 1000 }),
    setPointerCapture: (pointerId: number) => capturedPointers.add(pointerId),
    hasPointerCapture: (pointerId: number) => capturedPointers.has(pointerId),
    releasePointerCapture: (pointerId: number) => capturedPointers.delete(pointerId),
  })
  const documentTarget = Object.assign(new EventTarget(), {
    hidden: false,
    getElementById: (id: string) => id === 'art-gallery-track' ? track : null,
  })
  const desktop = Object.assign(new EventTarget(), { matches: true })
  const reduced = Object.assign(new EventTarget(), { matches: false })
  const intersectionDisconnect = vi.fn()
  const resizeDisconnect = vi.fn()

  vi.stubGlobal('document', documentTarget)
  const windowTarget = Object.assign(new EventTarget(), {
    matchMedia: (query: string) => query.includes('min-width') ? desktop : reduced,
    setTimeout, clearTimeout,
  })
  vi.stubGlobal('window', windowTarget)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(private callback: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() { this.callback([{ isIntersecting: true }]) }
    disconnect = intersectionDisconnect
  })
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect = resizeDisconnect
  })

  // React primitives are mocked above: this invokes the effect, not a component render.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const motion = useRailMotion('art-gallery-track', true)
  const cleanup = effects.mount?.()
  unmount = () => {
    if (typeof cleanup === 'function') cleanup()
    unmount = undefined
  }

  return {
    motion, track, scope, documentTarget, windowTarget, desktop, reduced, frames, capturedPointers,
    intersectionDisconnect, resizeDisconnect,
    focusControls(focused: boolean) {
      controlsFocused = focused
      // focusin/out bubble to the section in a browser; no visibility/resize or
      // pointer event is sent here, so none can hide a missing focus listener.
      scope.dispatchEvent(new Event(focused ? 'focusin' : 'focusout'))
    },
    movePointer(clientX: number) {
      track.dispatchEvent(Object.assign(new Event('pointermove'), { pointerType: 'mouse', clientX }))
    },
    pointer(type: string, clientX: number, overrides: Partial<PointerEvent> = {}) {
      const event = Object.assign(new Event(type, { cancelable: true }), {
        pointerType: 'mouse', pointerId: 7, isPrimary: true,
        button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX, clientY: 100,
        ...overrides,
      })
      track.dispatchEvent(event)
      // EventTarget has no DOM bubbling; dispatch the same event to the window
      // boundary to exercise the effect's real outside-track gesture handlers.
      windowTarget.dispatchEvent(event)
      return event
    },
    click(detail = 1) {
      const event = Object.assign(new Event('click', { cancelable: true }), { detail, pointerId: 7 })
      track.dispatchEvent(event)
      return event
    },
    advance(count: number) {
      for (let i = 0; i < count; i++) {
        vi.advanceTimersByTime(16)
        const callbacks = [...frames.values()]
        frames.clear()
        callbacks.forEach(callback => callback(performance.now()))
      }
    },
  }
}

describe('rail motion effect with controlled DOM events and frames', () => {
  it('drags left and right while keeping a stationary click available', () => {
    const rail = mountRail()
    rail.track.scrollLeft = 400
    rail.pointer('pointerdown', 600)
    rail.pointer('pointermove', 602)
    expect(rail.track.scrollLeft).toBe(400)
    rail.pointer('pointerup', 602)
    expect(rail.click().defaultPrevented).toBe(false)

    rail.pointer('pointerdown', 600)
    rail.pointer('pointermove', 480)
    expect(rail.track.scrollLeft).toBe(520)
    expect(rail.track.dataset.dragging).toBe('true')
    rail.pointer('pointermove', 670)
    expect(rail.track.scrollLeft).toBe(330)
    rail.pointer('pointerup', 670)
    expect(rail.track.dataset.dragging).toBeUndefined()
  })

  it('suppresses the immediate drag click without suppressing keyboard or the next plain click', () => {
    const rail = mountRail()
    rail.pointer('pointerdown', 600)
    rail.pointer('pointermove', 480)
    rail.pointer('pointerup', 480)
    expect(rail.click(0).defaultPrevented).toBe(false)
    expect(rail.click().defaultPrevented).toBe(true)
    rail.pointer('pointerdown', 500)
    rail.pointer('pointerup', 500)
    expect(rail.click().defaultPrevented).toBe(false)
  })

  it('never races a held drag after the five-second auto-motion delay', () => {
    const rail = mountRail()
    rail.pointer('pointerdown', 900)
    rail.pointer('pointermove', 940)
    rail.advance(400)
    expect(rail.track.scrollLeft).toBe(0)
    rail.pointer('pointermove', 800)
    expect(rail.track.scrollLeft).toBe(100)
    rail.pointer('pointerup', 800)
    rail.pointer('pointerleave', 1100)
    rail.advance(300)
    expect(rail.track.scrollLeft).toBe(100)
    rail.advance(70)
    expect(rail.track.scrollLeft).toBeGreaterThan(100)
  })

  it.each(['pointercancel', 'lostpointercapture', 'blur'])('cleans up an interrupted drag on %s', (type) => {
    const rail = mountRail()
    rail.pointer('pointerdown', 600)
    rail.pointer('pointermove', 500)
    expect(rail.track.scrollLeft).toBe(100)
    if (type === 'blur') rail.windowTarget.dispatchEvent(new Event('blur'))
    else rail.pointer(type, 500)
    rail.pointer('pointermove', 300)
    expect(rail.track.scrollLeft).toBe(100)
    expect(rail.track.dataset.dragging).toBeUndefined()
    expect(rail.capturedPointers.size).toBe(0)
    expect(rail.click().defaultPrevented).toBe(false)
    rail.pointer('pointerleave', 1100)
    rail.advance(370)
    expect(rail.track.scrollLeft).toBeGreaterThan(100)
  })

  it('keeps touch gestures native and modifier clicks available', () => {
    const rail = mountRail()
    for (const overrides of [{ pointerType: 'touch' }, { button: 1 }, { ctrlKey: true }, { metaKey: true }]) {
      const down = rail.pointer('pointerdown', 600, overrides)
      const move = rail.pointer('pointermove', 400, overrides)
      rail.pointer('pointerup', 400, overrides)
      expect(down.defaultPrevented).toBe(false)
      expect(move.defaultPrevented).toBe(false)
      expect(rail.track.scrollLeft).toBe(0)
      expect(rail.capturedPointers.size).toBe(0)
      expect(rail.click().defaultPrevented).toBe(false)
    }
  })

  it('prevents native image drag only during a mouse gesture', () => {
    const rail = mountRail()
    rail.pointer('pointerdown', 600)
    const imageDrag = new Event('dragstart', { cancelable: true })
    rail.track.dispatchEvent(imageDrag)
    expect(imageDrag.defaultPrevented).toBe(true)
    rail.pointer('pointerup', 600)
    const laterDrag = new Event('dragstart', { cancelable: true })
    rail.track.dispatchEvent(laterDrag)
    expect(laterDrag.defaultPrevented).toBe(false)
  })

  it('releases a captured drag on unmount and removes window handlers', () => {
    const rail = mountRail()
    rail.pointer('pointerdown', 600)
    rail.pointer('pointermove', 400)
    expect(rail.track.scrollLeft).toBe(200)
    unmount?.()
    rail.pointer('pointermove', 200)
    rail.pointer('pointerup', 200)
    rail.windowTarget.dispatchEvent(new Event('blur'))
    expect(rail.track.scrollLeft).toBe(200)
    expect(rail.track.dataset.dragging).toBeUndefined()
    expect(rail.capturedPointers.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resumes after footer focus leaves even when the manual hold has expired', () => {
    const rail = mountRail()
    rail.focusControls(true)
    rail.motion.seek(300)
    rail.advance(365) // 5.84 s: the five-second gesture hold has already expired.
    expect(rail.track.scrollLeft).toBe(300)

    rail.focusControls(false)
    rail.advance(30)
    expect(rail.track.scrollLeft).toBeGreaterThan(305)
  })

  it('keeps moving at an edge with a pointer event before every animation frame', () => {
    const rail = mountRail()
    for (let i = 0; i < 30; i++) {
      rail.movePointer(950 + i % 2)
      rail.advance(1)
    }
    expect(rail.track.scrollLeft).toBeGreaterThan(20)
  })

  it('honors explicit keyboard pause and resumes only after resume and focus exit', () => {
    const rail = mountRail()
    rail.advance(10)
    rail.focusControls(true)
    rail.motion.toggle()
    rail.focusControls(false)
    const pausedPosition = rail.track.scrollLeft
    rail.advance(30)
    expect(rail.track.scrollLeft).toBe(pausedPosition)

    rail.focusControls(true)
    rail.motion.toggle()
    rail.advance(30)
    expect(rail.track.scrollLeft).toBe(pausedPosition)
    rail.focusControls(false)
    rail.advance(30)
    expect(rail.track.scrollLeft).toBeGreaterThan(pausedPosition + 5)
  })

  it('releases observers, pending work and event reactions on unmount', () => {
    const rail = mountRail()
    rail.advance(10)
    rail.motion.hold.current()
    expect(rail.frames.size).toBeGreaterThan(0)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount?.()

    expect(rail.frames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(rail.track.dataset.motionRail).toBeUndefined()
    expect(rail.intersectionDisconnect).toHaveBeenCalledOnce()
    expect(rail.resizeDisconnect).toHaveBeenCalledOnce()

    rail.focusControls(true)
    rail.focusControls(false)
    rail.movePointer(950)
    for (const event of ['pointerleave', 'pointerdown', 'wheel', 'keydown']) {
      rail.track.dispatchEvent(new Event(event))
    }
    rail.documentTarget.dispatchEvent(new Event('visibilitychange'))
    rail.desktop.dispatchEvent(new Event('change'))
    rail.reduced.dispatchEvent(new Event('change'))
    rail.motion.hold.current()
    rail.motion.toggle()
    expect(rail.frames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
