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
  published: boolean
  phases: CasePhase[]
  ai: CaseAiProcess
  figmaLayers: string[]
  codeEvidence?: CaseCodeEvidence
  dataMapping?: string
  learnings: string[]
  futureQuestion: string
  links?: CaseLink[]
}
