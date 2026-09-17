import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { MediaPlacementEditor } from './MediaPlacementEditor'

// Vitest does not load Next's path alias. Resolve it to the unchanged modules.
vi.mock('@/media/placement-preview', () => import('../media/placement-preview'))
vi.mock('@/media/placement', () => import('../media/placement'))

// Only the Payload form context is replaced; markup and access handling are
// rendered by the real editor. Interactive reset is covered by the browser flow.
vi.mock('@payloadcms/ui', () => ({
  useForm: () => ({ setModified: () => {} }),
  useFormFields: () => [{}, () => {}],
  useFormInitializing: () => false,
  useFormProcessing: () => false,
}))

it('explains that desktop is the base without offering a reset of base values', () => {
  const html = renderToStaticMarkup(<MediaPlacementEditor />)
  expect(html).toContain('Encuadre base para escritorio')
  expect(html).not.toContain('Usar encuadre de escritorio</button>')
})

it('keeps crop inputs read-only when editing permission is absent', () => {
  const html = renderToStaticMarkup(<MediaPlacementEditor readOnly />)
  expect(html.match(/<input[^>]*disabled=""/g)).toHaveLength(3)
  expect(html.match(/<select[^>]*disabled=""/g)).toHaveLength(2)
})
