import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    globals: true,
    fileParallelism: false,
    hookTimeout: 45000,
    testTimeout: 45000,
  },
});
