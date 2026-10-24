import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        adamJonesLab: resolve(import.meta.dirname, 'projects/adam-jones-lab/index.html'),
      },
    },
  },
});
