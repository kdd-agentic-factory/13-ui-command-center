/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/pit-wall/',
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Babylon (~5 MB) is reached only through the React.lazy()'d 3D viewers
        // (see components/babylon/lazy.tsx), so Rollup splits it into its own
        // ASYNC chunk automatically — it is no longer preloaded on first paint.
        // We only pin the eager vendor chunk here; forcing a `babylon` object
        // entry would mark it as an initial chunk and re-add the modulepreload.
        manualChunks: {
          vendor: ['react', 'react-dom', 'i18next', 'react-i18next'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 1,
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
});
