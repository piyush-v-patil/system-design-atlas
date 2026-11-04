/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' + HashRouter lets the same build run on GitHub Pages (any sub-path) and Vercel.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // The shared chunk is mostly content/topics.json (the whole README, needed by every page, ~140 kB gzipped with
    // React). Pages, the markdown renderer, solution data and search are separate chunks loaded on demand.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 60_000,
  },
})
