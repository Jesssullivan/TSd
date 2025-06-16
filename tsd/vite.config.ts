import { defineConfig } from 'vite';
import { resolve } from 'path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        vite: resolve(__dirname, 'src/vite/index.ts'),
        svelte: resolve(__dirname, 'src/svelte/index.ts'),
      },
      name: 'TinylandTSD',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vite',
        'svelte',
        '@sveltejs/kit',
        'express',
        'cors',
        '@grpc/grpc-js',
        '@grpc/proto-loader',
        'node:path',
        'node:fs',
        'node:fs/promises',
        'node:crypto',
        'node:url',
      ],
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});