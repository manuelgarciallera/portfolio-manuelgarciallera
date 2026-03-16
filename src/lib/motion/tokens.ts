export const MOTION_EASE = {
  smoothOut: [0.22, 0.61, 0.36, 1] as const,
  reveal: [0.16, 1, 0.3, 1] as const,
};

export const MOTION_DURATION = {
  fast: 0.2,
  normal: 0.4,
  reveal: 0.82,
  cinematic: 1.2,
} as const;

export const LENIS_DEFAULTS = {
  smoothWheel: true,
  gestureOrientation: "vertical" as const,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.05,
  duration: 1.0,
  lerp: 0.09,
  syncTouch: false,
} as const;
