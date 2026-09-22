export function getResearchAppearance(time: number, pulseAge: number, reduceMotion: boolean) {
  const remaining = Number.isFinite(pulseAge) ? Math.max(0, 1 - Math.max(0, pulseAge) / 6) : 0
  return {
    lighten: reduceMotion ? 0 : (1 - Math.cos(time * Math.PI / 12)) / 2,
    colour: remaining * remaining * (3 - 2 * remaining),
  }
}

export function advanceResearchPulse(age: number, delta: number, visible: boolean) {
  return visible ? age + Math.min(Math.max(delta, 0), 0.05) : age
}
