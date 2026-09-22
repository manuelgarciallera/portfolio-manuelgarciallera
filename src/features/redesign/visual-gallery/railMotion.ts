export interface RailMotionState {
  enabled: boolean
  reducedMotion: boolean
  visible: boolean
  focused: boolean
  paused: boolean
  manual: boolean
  pointer: number | null
  position: number
  maximum: number
}

export function railVelocity(state: RailMotionState): number {
  if (!state.enabled || state.reducedMotion || !state.visible || state.focused || state.paused || state.manual) return 0
  const edge = 0.16
  const pointer = state.pointer
  const velocity = pointer === null ? 14
    : pointer < edge ? -110 * (1 - Math.max(0, pointer) / edge)
      : pointer > 1 - edge ? 110 * (1 - (1 - Math.min(1, pointer)) / edge) : 0
  if ((velocity < 0 && state.position <= 0) || (velocity > 0 && state.position >= state.maximum)) return 0
  return velocity
}

export function stepRail(position: number, velocity: number, elapsed: number, maximum: number): number {
  return Math.max(0, Math.min(maximum, position + velocity * Math.min(0.05, Math.max(0, elapsed))))
}
