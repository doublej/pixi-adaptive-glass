import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'PixiAdaptiveGlass',
      fileName: (format) => `pixi-adaptive-glass.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['pixi.js', 'tweakpane', '@tweakpane/core'],
      output: {
        globals: {
          'pixi.js': 'PIXI',
          'tweakpane': 'Tweakpane',
          '@tweakpane/core': 'TweakpaneCore',
        },
      },
    },
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
});