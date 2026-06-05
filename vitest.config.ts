import { defineConfig } from 'vitest/config';

// Unit tests only. Emulator-backed rules tests use vitest.rules.config.ts.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
