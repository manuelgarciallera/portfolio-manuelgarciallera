export type CasePhaseId = 'research' | 'prototipo' | 'ia' | 'desarrollo' | 'validacion'

export interface CasePhase {
  id: CasePhaseId
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface CaseAiProcess {
  tool: string
  phase: string
  humanInput: string
  output: string
  criteria: string
  limits: string
  decision: string
}

export interface CaseCodeEvidence {
  caption: string
  filename: string
  code: string
}

export interface CaseLink {
  label: string
  href: string
}

export type CaseStoryBlockId = 'opening' | 'context' | 'system' | 'journey' | 'implementation'
export type CaseStoryBlockKind = 'brand-scene' | 'narrative' | 'system' | 'journey' | 'implementation'

export interface CaseStoryLink extends CaseLink {
  kind: 'product' | 'figma'
  external?: boolean
}

export interface CaseStoryBlock {
  id: CaseStoryBlockId
  kind: CaseStoryBlockKind
  eyebrow: string
  title: string
  body: string
  image?: {
    src: string
    alt: string
    fit?: 'cover' | 'contain'
  }
  links?: CaseStoryLink[]
}

export interface CaseVisual {
  theme: 'buy-sell' | 'laliga' | 'coordination' | 'theuxunion' | 'neutral'
  logoSrc: string
  logoAlt: string
  kicker: string
  statement: string
  slides: CaseVisualSlide[]
}

export interface CaseVisualSlide {
  label: string
  src: string
  alt: string
  description?: string
  kind?: 'image' | 'coordination-diagram'
  diagramVariant?: 'flow' | 'autonomy' | 'consensus' | 'verification'
  fit?: 'cover' | 'contain'
}

export type CaseStatus = 'published' | 'experimental' | 'evolving'

export interface CaseStudy {
  slug: string
  index: string
  title: string
  titleAccent?: string
  claim: string
  summary: string
  year: string
  context: string
  role: string
  stack: string[]
  tags: string
  proofPoints?: Array<{ value: string; label: string }>
  published: boolean
  status?: CaseStatus
  contribution?: string
  collaboration?: string
  disclosure?: string
  phases: CasePhase[]
  ai: CaseAiProcess
  figmaLayers: string[]
  codeEvidence?: CaseCodeEvidence
  dataMapping?: string
  learnings: string[]
  futureQuestion: string
  links?: CaseLink[]
  visual?: CaseVisual
  story?: CaseStoryBlock[]
}
