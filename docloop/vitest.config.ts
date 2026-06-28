import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // A headless Milkdown Editor needs a DOM (document, window, DOMParser).
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
