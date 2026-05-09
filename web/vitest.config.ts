import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './tests/testSetup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});