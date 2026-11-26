import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    // Restore spies (e.g. vi.spyOn(Math, 'random')) after every test so a
    // failing test can never leak a mock into later tests.
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts', // two-line bootstrap; the wiring in src/app.ts is covered by tests/app.test.ts
        'src/i18n/types.ts',
        'src/i18n/translations.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})
