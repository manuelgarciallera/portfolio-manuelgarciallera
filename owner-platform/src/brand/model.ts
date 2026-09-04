export const BRAND_COLOR_ROLES = [
  'background',
  'surface',
  'text',
  'mutedText',
  'accent',
  'interaction',
  'success',
  'danger',
] as const

export type BrandColorRole = (typeof BRAND_COLOR_ROLES)[number]

export type SemanticColor = {
  role: BrandColorRole
  value: string
}

export type UsageWeight = {
  role: BrandColorRole
  weight: number
}

export const MOTION_EASINGS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'] as const
export const REDUCED_MOTION_BEHAVIORS = ['reduce', 'disable'] as const

export type MotionSettings = {
  duration: number
  stagger: number
  travel: number
  easing: (typeof MOTION_EASINGS)[number] | string
  reducedMotion: (typeof REDUCED_MOTION_BEHAVIORS)[number] | string
}

export type BrandProfileInput = {
  colors?: SemanticColor[] | null
  usageWeights?: UsageWeight[] | null
  motion?: Partial<MotionSettings> | null
}
