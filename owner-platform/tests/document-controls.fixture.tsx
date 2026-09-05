import { createRoot } from 'react-dom/client'
import { PublicationBundleControls } from '../src/components/PublicationBundleControls'
import { PublicationReviewControls } from '../src/components/PublicationReviewControls'
import { PublicationArtifactControls } from '../src/components/PublicationArtifactControls'
import { FigmaImportPlanControls } from '../src/components/FigmaImportPlanControls'
import { FigmaImportReviewControls } from '../src/components/FigmaImportReviewControls'
import { AssistanceProposalControls } from '../src/components/AssistanceProposalControls'

const components = { bundle: PublicationBundleControls, review: PublicationReviewControls, artifact: PublicationArtifactControls, figmaPlan: FigmaImportPlanControls, figmaReview: FigmaImportReviewControls, assistance: AssistanceProposalControls }
const key = new URLSearchParams(location.search).get('component') as keyof typeof components
const Component = components[key]
createRoot(document.getElementById('root')!).render(<form onSubmit={(event) => {
  event.preventDefault()
  document.body.dataset.parentSubmissions = String(Number(document.body.dataset.parentSubmissions ?? 0) + 1)
}}><Component /></form>)
