import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('publication preflight route boundary', () => {
  it('keeps the route owner-only and free of public writes or deployment controls', async () => {
    const route = await readFile(join(here, '../app/(payload)/api/owner/publication-artifacts/[id]/preflights/route.ts'), 'utf8')
    expect(route).toMatch(/handlePublicationPreflightRequest/)
    expect(route).toMatch(/createOwnerPublicationPreflight/)
    expect(route).not.toMatch(/writeFile|deploy|NEXT_PUBLIC|publish/i)
  })
})
