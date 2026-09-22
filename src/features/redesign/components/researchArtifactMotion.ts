export function advanceResearchTime(time: number, delta: number, reduceMotion: boolean, visible: boolean) {
  if (reduceMotion || !visible) return time
  return time + Math.min(Math.max(delta, 0), 0.05)
}

export function getResearchPose(time: number, reduceMotion: boolean) {
  const elapsed = reduceMotion ? 0 : time
  return {
    sphereTurn: elapsed * 0.035,
    orbitTurn: elapsed * 0.085,
    ringTilt: [
      1.07 + Math.sin(elapsed * 0.12) * 0.12,
      -0.08 + Math.sin(elapsed * 0.09) * 0.12,
      -0.27 + Math.sin(elapsed * 0.1) * 0.09,
    ] as [number, number, number],
  }
}

export function getResearchNodePosition(phase: number): [number, number, number] {
  return [Math.cos(phase) * 1.7, Math.sin(phase) * 1.7, 0]
}
