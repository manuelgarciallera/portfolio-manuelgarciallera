import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Physical media fixtures fsync real files. Bound competing processes so
    // high-core hosts do not exhaust their per-test I/O budget.
    maxWorkers: 2,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['.data/**', '.next/**', 'node_modules/**'],
  },
})
