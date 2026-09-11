import { renderToStaticMarkup } from 'react-dom/server'
import type { TextFieldClientProps } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TypographyFamilyField } from './TypographyFamilyField'

// Only the Payload form provider is substituted. The rendered selector,
// disabled attribute and sanitized sample are the production component.
const fieldState = vi.hoisted(() => ({ value: 'Custom Family', disabled: false, setValue: () => {} }))
vi.mock('@payloadcms/ui', () => ({ useField: () => fieldState, TextField: () => null }))
const props = { path: 'typography.primaryFamily', field: { name: 'primaryFamily', type: 'text', label: 'Familia de títulos' } } as TextFieldClientProps

describe('font family control', () => {
  beforeEach(() => { fieldState.disabled = false })
  it('freezes selection while Payload is processing a save', () => {
    fieldState.disabled = true
    const html = renderToStaticMarkup(<TypographyFamilyField {...props} />)
    expect(html).toMatch(/<select[^>]*disabled=""/)
    fieldState.disabled = false
  })
  it('respects read-only access and preserves an unknown family', () => {
    const html = renderToStaticMarkup(<TypographyFamilyField {...props} readOnly />)
    expect(html).toMatch(/<select[^>]*disabled=""/)
    expect(html).toContain('value="Custom Family" selected=""')
    expect(html).toContain('font-family:&quot;Custom Family&quot;, system-ui, sans-serif')
  })
})
