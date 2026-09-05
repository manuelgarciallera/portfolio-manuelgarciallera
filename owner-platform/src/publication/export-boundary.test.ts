import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('publication export server boundary', () => {
  it('poisons the export service against client imports', async () => {
    expect(await readFile(join(here, 'export-service.ts'), 'utf8')).toMatch(/^import 'server-only'/)
  })

  it('exposes only an authenticated download route without public writes', async () => {
    const route = await readFile(join(here, '../app/(payload)/api/owner/publication-artifacts/[id]/export/route.ts'), 'utf8')
    expect(route).toMatch(/handlePublicationExportRequest/)
    expect(route).toMatch(/createOwnerPublicationExport/)
    expect(route).not.toMatch(/publish|deploy|writeFile|NEXT_PUBLIC/)
  })
})
