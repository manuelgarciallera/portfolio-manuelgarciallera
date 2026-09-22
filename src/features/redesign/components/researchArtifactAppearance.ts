export function getResearchAppearance(time: number, pulseAge: number, reduceMotion: boolean) {
  const elapsed = Number.isFinite(time) ? Math.max(0, time) : 0
  const remaining = Number.isFinite(pulseAge) ? Math.max(0, 1 - Math.max(0, pulseAge) / 6) : 0
  return {
    lighten: reduceMotion ? 0 : (1 - Math.cos(elapsed * Math.PI / 12)) / 2,
    colour: remaining * remaining * (3 - 2 * remaining),
  }
}

export function advanceResearchPulse(age: number, delta: number, visible: boolean) {
  return visible && Number.isFinite(delta) ? age + Math.max(delta, 0) : age
}

export function createResearchAppearanceClock() {
  let running = false
  return {
    pause() {
      // Demand rendering may provide no frame at all while offscreen/hidden.
      running = false
    },
    tick(delta: number, active: boolean) {
      const wasRunning = running
      running = active
      // Ignore the first resumed frame: its delta may include the hidden time.
      if (!active || !wasRunning || !Number.isFinite(delta)) return 0
      // Colour uses active wall-clock time; only rotation clamps slow frames.
      return Math.max(0, delta)
    },
  }
}
