import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('Figma server boundary', () => {
  it.each(['provider.ts', 'request.ts', 'import-execution-service.ts', 'render-download.ts'])('%s is poisoned against client imports', async (file) => {
    const source = await readFile(join(here, file), 'utf8')
    expect(source).toMatch(/^import 'server-only'/)
  })

  it('keeps reviewed import execution behind an owner-only server route', async () => {
    const route = await readFile(join(here, '../../app/(payload)/api/owner/figma/import-reviews/[id]/execute/route.ts'), 'utf8')
    expect(route).toMatch(/handleFigmaImportExecutionRequest/)
    expect(route).toMatch(/createFigmaReadProvider/)
    expect(route).toMatch(/executeOwnerFigmaImport/)
    expect(route).not.toMatch(/NEXT_PUBLIC|publish|deploy/)
  })
})
