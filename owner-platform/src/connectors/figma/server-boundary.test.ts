import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('Figma server boundary', () => {
  it.each(['provider.ts', 'request.ts'])('%s is poisoned against client imports', async (file) => {
    const source = await readFile(join(here, file), 'utf8')
    expect(source).toMatch(/^import 'server-only'/)
  })
})
