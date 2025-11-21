import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      'pixi-adaptive-glass': path.resolve(__dirname, '../src/index.ts'),
      '@lib': path.resolve(__dirname, '../src'),
      tweakpane: path.resolve(__dirname, '../node_modules/tweakpane'),
    },
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
