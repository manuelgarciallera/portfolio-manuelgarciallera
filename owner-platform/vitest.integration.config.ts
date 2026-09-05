import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.integration.test.ts'],
    fileParallelism: false,
    env: { NODE_ENV: 'test', DATABASE_URL: '', PAYLOAD_SECRET: '' },
  },
})
