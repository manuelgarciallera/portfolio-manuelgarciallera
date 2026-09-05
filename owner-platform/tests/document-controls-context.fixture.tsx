import type { ComponentProps } from 'react'

// Only the CMS context and Next navigation boundary are substituted. All action
// components, React behavior, styles and API clients are the production code.
export const useDocumentInfo = () => ({ id: 100, data: { decision: 'approved', status: 'pending' } })
export default function Link(props: ComponentProps<'a'>) { return <a {...props} /> }
