import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('CapabilityAccordion interaction', () => {
  it('opens categories only by click, never by hover', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/CapabilityAccordion.tsx'), 'utf8')
    expect(source).not.toContain('onMouseEnter')
    expect(source).not.toContain('onPointerEnter')
    expect(source).toContain('onClick={() => setOpen(open === index ? -1 : index)}')
  })
})
