/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Babylon is ~5 MB of the bundle; splitting it lets the SPA shell
        // paint long before the 3D engine arrives.
        manualChunks: {
          babylon: ['@babylonjs/core'],
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
    maxWorkers: 1
  }
});
