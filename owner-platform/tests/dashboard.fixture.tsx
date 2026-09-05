import { createRoot } from 'react-dom/client'
import { OwnerSearch } from '../src/components/OwnerSearch'
import { OwnerOverview } from '../src/components/OwnerOverview'

// Render the real dashboard components and their CSS; only HTTP and Next Link
// are substituted by the browser harness.
createRoot(document.getElementById('root')!).render(<><OwnerSearch /><OwnerOverview /></>)
