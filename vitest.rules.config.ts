import { defineConfig } from 'vitest/config';

// Firebase-emulator rules tests. Run via `npm run test:rules`, which starts the
// Firestore emulator first (needs firebase-tools + Java).
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
