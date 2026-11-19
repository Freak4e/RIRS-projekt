import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/index.ts', 'src/types/**'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportOnFailure: true,
    },
  },
})
